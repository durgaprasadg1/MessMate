import { describe, it, expect } from "vitest";
import { RateLimiter, MemoryRateLimitStore, RedisRateLimitStore } from "@/lib/server/security/rateLimiter.js";

describe("RateLimiter", () => {
  it("blocks after the limit and reports retry-after", async () => {
    let now = 0;
    const limiter = new RateLimiter(new MemoryRateLimitStore(() => now));
    const rule = { name: "t", key: "ip", limit: 3, windowSeconds: 60 };
    for (let i = 0; i < 3; i++) expect((await limiter.check(rule)).allowed).toBe(true);
    const blocked = await limiter.check(rule);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
  it("resets when the window passes", async () => {
    let now = 0;
    const limiter = new RateLimiter(new MemoryRateLimitStore(() => now));
    const rule = { name: "t", key: "ip", limit: 1, windowSeconds: 10 };
    await limiter.check(rule);
    expect((await limiter.check(rule)).allowed).toBe(false);
    now = 11_000;
    expect((await limiter.check(rule)).allowed).toBe(true);
  });
  it("keys are isolated", async () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore());
    await limiter.check({ name: "t", key: "a", limit: 1, windowSeconds: 60 });
    expect((await limiter.check({ name: "t", key: "b", limit: 1, windowSeconds: 60 })).allowed).toBe(true);
  });
  it("enforce throws a 429 with Retry-After", async () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore());
    const rule = { name: "t", key: "a", limit: 1, windowSeconds: 60 };
    await limiter.enforce(rule);
    await expect(limiter.enforce(rule)).rejects.toMatchObject({ status: 429, headers: { "Retry-After": expect.any(String) } });
  });
  it("falls back to memory (still limiting) when Redis is unavailable", async () => {
    const store = new RedisRateLimitStore({ getClient: async () => null }, new MemoryRateLimitStore());
    const limiter = new RateLimiter(store);
    const rule = { name: "t", key: "a", limit: 1, windowSeconds: 60 };
    await limiter.enforce(rule);
    await expect(limiter.enforce(rule)).rejects.toMatchObject({ status: 429 });
  });
  it("falls back when Redis throws", async () => {
    const broken = { incr: () => { throw new Error("down"); } };
    const store = new RedisRateLimitStore({ getClient: async () => broken });
    const res = await store.hit("k", 60);
    expect(res.count).toBe(1);
  });
});
