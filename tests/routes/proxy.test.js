import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { UUID_A, UUID_B, UUID_C } from "../helpers/http.js";

vi.mock("next-auth/jwt", () => ({ getToken: vi.fn() }));
const { getToken } = await import("next-auth/jwt");
const { proxy } = await import("@/proxy.ts");

const run = async (path, token) => {
  getToken.mockResolvedValue(token);
  const res = await proxy(new NextRequest(`http://localhost:3000${path}`));
  return { status: res.status, location: res.headers.get("location"), rewrite: res.headers.get("x-middleware-rewrite") };
};
const admin = { id: UUID_A, isAdmin: true };
const owner = { id: UUID_B, isOwner: true };
const consumer = { id: UUID_C };

describe("proxy route guard", () => {
  it("sends anonymous visitors to /login for protected areas", async () => {
    for (const p of ["/admin", "/admin/all-users", "/owner", `/owner/${UUID_B}`, `/consumer/${UUID_C}/history`, "/mess/pending-verification", `/mess/${UUID_A}/update-menu`, `/mess/${UUID_A}/new-customer`]) {
      expect((await run(p, null)).location, p).toContain("/login");
    }
  });
  it("admin pages are admin-only", async () => {
    expect((await run("/admin/all-users", consumer)).location).toMatch(/\/$/);
    expect((await run("/admin/all-users", owner)).location).toMatch(/\/$/);
    expect((await run("/admin/all-users", admin)).location).toBeNull();
    expect((await run(`/admin/${UUID_A}`, admin)).location).toBeNull();
  });
  it("owner pages are owner-only, and owner-id pages must match the token", async () => {
    expect((await run(`/owner/${UUID_B}`, consumer)).location).toMatch(/\/$/);
    expect((await run(`/owner/${UUID_B}`, owner)).location).toBeNull();
    expect((await run(`/owner/${UUID_C}`, owner)).location).toContain("/owner");
    expect((await run(`/owner/${UUID_C}/new-mess`, owner)).location).toContain("/owner");
    // analytics / registrations pages carry a MESS id: the API checks ownership
    expect((await run(`/owner/${UUID_C}/analytics`, owner)).location).toBeNull();
  });
  it("consumer pages require your own id (admins excepted)", async () => {
    expect((await run(`/consumer/${UUID_C}/history`, consumer)).location).toBeNull();
    expect((await run(`/consumer/${UUID_B}/history`, consumer)).location).not.toBeNull();
    expect((await run(`/consumer/${UUID_C}/history`, admin)).location).toBeNull();
  });
  it("malformed ids become 404 without hitting any page", async () => {
    expect((await run("/consumer/not-a-uuid/history", consumer)).rewrite).toContain("/404");
    expect((await run("/mess/abc", null)).rewrite).toContain("/404");
  });
  it("public mess pages stay public", async () => {
    expect((await run(`/mess/${UUID_A}`, null)).location).toBeNull();
  });
  it("signed-in users are bounced away from /login", async () => {
    expect((await run("/login", consumer)).location).toMatch(/\/$/);
    expect((await run("/login", null)).location).toBeNull();
  });
  it("owner-only mess sub pages", async () => {
    expect((await run(`/mess/${UUID_A}/update-menu`, consumer)).location).toContain("/mess");
    expect((await run(`/mess/${UUID_A}/update-menu`, owner)).location).toBeNull();
  });
});
