import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { makeRequest, ctx, sessions, noRedis } from "../helpers/http.js";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/redis", () => noRedis());
vi.mock("@/lib/supabaseClient", () => ({ default: { from: vi.fn() } }));

const { getServerSession } = await import("next-auth");
const { createRoute } = await import("@/lib/server/http/apiHandler.js");
const { json } = await import("@/lib/server/http/respond.js");
const { badRequest } = await import("@/lib/server/errors/httpErrors.js");
const { setRateLimiter, RateLimiter, MemoryRateLimitStore } =
  await import("@/lib/server/security/rateLimiter.js");

beforeEach(() => setRateLimiter(new RateLimiter(new MemoryRateLimitStore())));

describe("createRoute", () => {
  it("blocks cross-site state-changing requests (CSRF)", async () => {
    const route = createRoute({ name: "t", auth: "public" }, async () =>
      json({ ok: true }),
    );
    const res = await route(
      makeRequest("/api/t", {
        method: "POST",
        origin: "https://evil.example",
        body: {},
      }),
      ctx(),
    );
    expect(res.status).toBe(403);
  });
  it("does not require an Origin for GET", async () => {
    const route = createRoute({ name: "t", auth: "public" }, async () =>
      json({ ok: true }),
    );
    expect(
      (await route(makeRequest("/api/t", { origin: null }), ctx())).status,
    ).toBe(200);
  });
  it("hides internal error details on unexpected failures", async () => {
    const route = createRoute({ name: "t", auth: "public" }, async () => {
      throw new Error(
        'duplicate key value violates unique constraint "consumer_email_key"',
      );
    });
    const res = await route(makeRequest("/api/t"), ctx());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(
      /duplicate|constraint|consumer_email/,
    );
    expect(body.requestId).toBeTruthy();
    expect(res.headers.get("x-request-id")).toBe(body.requestId);
  });
  it("passes HttpErrors through with their status", async () => {
    const route = createRoute({ name: "t", auth: "public" }, async () => {
      throw badRequest("Nope");
    });
    const res = await route(makeRequest("/api/t"), ctx());
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("Nope");
  });
  it("validates bodies with zod and requires JSON content-type", async () => {
    const route = createRoute(
      { name: "t", auth: "public", body: z.object({ a: z.number() }) },
      async ({ body }) => json(body),
    );
    expect(
      (
        await route(
          makeRequest("/api/t", { method: "POST", body: { a: "x" } }),
          ctx(),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await route(
          makeRequest("/api/t", { method: "POST", body: { a: 1 } }),
          ctx(),
        )
      ).status,
    ).toBe(200);
    const wrongType = makeRequest("/api/t", {
      method: "POST",
      raw: '{"a":1}',
      headers: { "content-type": "text/plain" },
    });
    expect((await route(wrongType, ctx())).status).toBe(415);
    const badJson = makeRequest("/api/t", {
      method: "POST",
      raw: "{oops",
      headers: { "content-type": "application/json" },
    });
    expect((await route(badJson, ctx())).status).toBe(400);
  });
  it("strips unknown fields (no mass assignment)", async () => {
    const route = createRoute(
      { name: "t", auth: "public", body: z.object({ name: z.string() }) },
      async ({ body }) => json(body),
    );
    const res = await route(
      makeRequest("/api/t", {
        method: "POST",
        body: { name: "x", isAdmin: true, is_blocked: false },
      }),
      ctx(),
    );
    expect(await res.json()).toEqual({ name: "x" });
  });
  it("rejects oversized JSON", async () => {
    const route = createRoute({ name: "t", auth: "public" }, async () =>
      json({}),
    );
    const big = makeRequest("/api/t", {
      method: "POST",
      raw: JSON.stringify({ x: "a".repeat(300_000) }),
      headers: { "content-type": "application/json" },
    });
    expect((await route(big, ctx())).status).toBe(413);
  });
  it("returns 429 + Retry-After once the limit is hit", async () => {
    const route = createRoute(
      {
        name: "t",
        auth: "public",
        rateLimit: { name: "t", limit: 2, windowSeconds: 60, by: "ip" },
      },
      async () => json({}),
    );
    const call = () =>
      route(
        makeRequest("/api/t", {
          headers: { "x-forwarded-for": "198.51.100.7" },
        }),
        ctx(),
      );
    expect((await call()).status).toBe(200);
    expect((await call()).status).toBe(200);
    const blocked = await call();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    expect((await blocked.json()).retryAfter).toBeGreaterThan(0);
  });
  it("applies a default per-user limit to mutating routes", async () => {
    getServerSession.mockResolvedValue(sessions.consumer());
    const route = createRoute(
      { name: "t", auth: "session", bodyType: "none" },
      async () => json({}),
    );
    let last;
    for (let i = 0; i < 125; i++)
      last = await route(makeRequest("/api/t", { method: "POST" }), ctx());
    expect(last.status).toBe(429);
  });
  it("validates uuid params", async () => {
    const route = createRoute(
      { name: "t", auth: "public", uuid: ["id"] },
      async () => json({}),
    );
    expect(
      (await route(makeRequest("/api/t"), ctx({ id: "nope" }))).status,
    ).toBe(400);
  });
  it("marks authenticated responses as non-cacheable", async () => {
    getServerSession.mockResolvedValue(sessions.consumer());
    const route = createRoute({ name: "t", auth: "session" }, async () =>
      json({}),
    );
    expect(
      (await route(makeRequest("/api/t"), ctx())).headers.get("Cache-Control"),
    ).toBe("no-store");
  });
});
