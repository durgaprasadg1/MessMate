import { describe, it, expect } from "vitest";
import { navKindFor, NAV, homeFor } from "@/lib/navRouting.js";

const ID = "11111111-1111-4111-8111-111111111111";
const admin = { isAdmin: true };
const owner = { isOwner: true };
const consumer = {};

describe("navKindFor", () => {
  it("public and consumer pages use the consumer sidebar", () => {
    for (const p of ["/", "/mess", `/mess/${ID}`, `/mess/${ID}/new-customer`, `/consumer/${ID}`, `/consumer/${ID}/history`, `/consumer/${ID}/daily-mess`, "/terms-and-conditions", "/login", "/signup", "/register-owner"]) {
      expect(navKindFor(p, null), p).toBe(NAV.CONSUMER);
    }
  });
  it("owner pages use the owner sidebar", () => {
    for (const p of ["/owner", `/owner/${ID}`, `/owner/${ID}/analytics`, `/owner/${ID}/new-mess`, `/mess/${ID}/orders`, `/mess/${ID}/update-menu`, `/mess/${ID}/edit-info`, `/mess/${ID}/messages`]) {
      expect(navKindFor(p, owner), p).toBe(NAV.OWNER);
    }
  });
  it("admin pages use the admin sidebar", () => {
    for (const p of ["/admin", "/admin/all-users", "/admin/all-messes", "/admin/pending-verification", "/mess/pending-verification"]) {
      expect(navKindFor(p, admin), p).toBe(NAV.ADMIN);
    }
  });
  it("pages that never had a sidebar still have none", () => {
    for (const p of ["/forgot-password", "/reset-password/abc", `/admin/${ID}`, `/admin/all-messes/${ID}`, `/admin/all-messes/${ID}/reviews`, `/consumer/${ID}/edit-info`, `/consumer/${ID}/delete`, "/does-not-exist", "/api/x"]) {
      expect(navKindFor(p, admin), p).toBe(NAV.NONE);
    }
  });
  it("notifications follow the viewer's role", () => {
    expect(navKindFor("/notifications", owner)).toBe(NAV.OWNER);
    expect(navKindFor("/notifications", consumer)).toBe(NAV.CONSUMER);
  });
  it("falls back to the public sidebar when the role is missing", () => {
    expect(navKindFor("/admin", consumer)).toBe(NAV.CONSUMER);
    expect(navKindFor(`/owner/${ID}`, consumer)).toBe(NAV.CONSUMER);
  });
  it("ignores trailing slashes and query strings", () => {
    expect(navKindFor("/mess/?q=1", null)).toBe(NAV.CONSUMER);
    expect(navKindFor("/admin/", admin)).toBe(NAV.ADMIN);
  });
});

describe("homeFor", () => {
  it("sends every role to its own landing page", () => {
    expect(homeFor({ isAdmin: true })).toBe("/admin");
    expect(homeFor({ isOwner: true })).toBe("/owner");
    expect(homeFor({})).toBe("/mess");
    expect(homeFor(null)).toBe("/mess");
  });
});
