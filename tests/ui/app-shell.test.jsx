import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";

let pathname = "/";
let user = null;
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: user ? { user } : null, status: user ? "authenticated" : "unauthenticated" }) }));
vi.mock("@/Component/Others/Navbar", () => ({ default: () => <aside data-nav="consumer" /> }));
vi.mock("@/Component/Owner/OwnerNavbar", () => ({ default: () => <aside data-nav="owner" /> }));
vi.mock("@/Component/Admin/AdminSidebar", () => ({ default: () => <aside data-nav="admin" /> }));
vi.mock("../../Component/Others/Navbar", () => ({ default: () => <aside data-nav="consumer" /> }));

const { default: AppShell } = await import("@/Component/Others/AppShell.jsx");
const ID = "11111111-1111-4111-8111-111111111111";
const html = () => renderToString(<AppShell><main>PAGE</main></AppShell>);
const navs = (h) => [...h.matchAll(/data-nav="(\w+)"/g)].map((m) => m[1]);

describe("AppShell (persistent navigation)", () => {
  beforeEach(() => {
    pathname = "/";
    user = null;
  });
  it("renders exactly one sidebar plus the page", () => {
    pathname = "/mess";
    const h = html();
    expect(navs(h)).toEqual(["consumer"]);
    expect(h).toContain("PAGE");
  });
  it("picks the owner sidebar for owners", () => {
    user = { id: "o", isOwner: true };
    pathname = `/owner/${ID}/analytics`;
    expect(navs(html())).toEqual(["owner"]);
  });
  it("picks the admin sidebar for admins", () => {
    user = { id: "a", isAdmin: true };
    pathname = "/admin/all-users";
    expect(navs(html())).toEqual(["admin"]);
  });
  it("renders no sidebar on pages that never had one", () => {
    pathname = "/forgot-password";
    expect(navs(html())).toEqual([]);
    pathname = "/not-a-real-page";
    expect(navs(html())).toEqual([]);
  });
  it("a non-owner never gets the owner sidebar", () => {
    user = { id: "c" };
    pathname = `/owner/${ID}`;
    expect(navs(html())).toEqual(["consumer"]);
  });
});
