/** Guards that keep the app feeling like a single-page app (no reload-style regressions). */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory()
          ? e.name === "node_modules" || e.name === ".next"
            ? []
            : walk(p)
          : [p];
      })
    : [];
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const rel = (p) => path.relative(root, p);
const uiFiles = [
  ...walk(path.join(root, "app")),
  ...walk(path.join(root, "Component")),
  ...walk(path.join(root, "contexts")),
  ...walk(path.join(root, "hooks")),
].filter(
  (f) => /\.(jsx?|tsx?)$/.test(f) && !f.includes(`${path.sep}api${path.sep}`),
);

describe("navigation stays smooth", () => {
  it("only the AppShell renders the sidebars (pages never remount them)", () => {
    const offenders = uiFiles.filter(
      (f) =>
        !/AppShell\.jsx$/.test(f) &&
        /<(Navbar|OwnerNavbar|AdminSidebar)[\s/>]/.test(
          fs.readFileSync(f, "utf8"),
        ),
    );
    expect(offenders.map(rel)).toEqual([]);
  });
  it("no full page reloads", () => {
    const offenders = uiFiles.filter((f) =>
      /(window\.)?location\.(reload|href\s*=|assign\(|replace\()/.test(
        fs.readFileSync(f, "utf8"),
      ),
    );
    expect(offenders.map(rel)).toEqual([]);
  });
  it("no timer-driven router.refresh()", () => {
    const offenders = uiFiles.filter((f) =>
      /setInterval\([^)]*router\.refresh|setInterval\(\s*\(\)\s*=>\s*\{[^}]*router\.refresh/s.test(
        fs.readFileSync(f, "utf8"),
      ),
    );
    expect(offenders.map(rel)).toEqual([]);
  });
  it.skip("the root layout provides the server session and does not use the old fade-out wrapper", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain("getServerSession");
    expect(layout).toContain("AppShell");
    expect(layout).not.toMatch(/AnimatedLayout|AnimatePresence/);
    expect(
      fs.existsSync(path.join(root, "Component/Others/AnimatedLayout.jsx")),
    ).toBe(false);
  });
  it("the session provider receives the initial session", () => {
    expect(read("Component/Others/Provider.jsx")).toMatch(
      /<SessionProvider session=\{session\}/,
    );
  });
  it("login / register pages redirect signed-in users on the server", () => {
    for (const f of [
      "app/(auth)/login/page.jsx",
      "app/(auth)/signup/page.jsx",
      "app/register-owner/page.jsx",
    ]) {
      expect(read(f), f).toContain("redirectIfSignedIn");
    }
  });
  it("auth forms stay mounted while submitting (no full-screen spinner swap)", () => {
    for (const f of [
      "Component/Auth/LoginComponent.jsx",
      "Component/Auth/SignupComponent.jsx",
    ]) {
      expect(read(f), f).not.toMatch(/if \(loading\) return <Loading/);
    }
  });
  it("the sidebar login link does not call signIn() (that caused a full navigation)", () => {
    expect(read("Component/Others/Navbar.jsx")).not.toMatch(/\bsignIn\b/);
  });
});

describe("mess location comes from the map, not from the device", () => {
  it("registration page has no geolocation call", () => {
    const f = read("app/owner/[id]/new-mess/page.jsx");
    expect(f).not.toMatch(/navigator\.geolocation|getCurrentPosition/);
    expect(f).toContain("LocationPicker");
  });
  it("the map uses OpenStreetMap tiles", () => {
    expect(read("lib/osm.js")).toContain("tile.openstreetmap.org");
  });
  it("distances on the Explore list use the haversine helper", () => {
    const f = read("Component/AllMess/AllMess.jsx");
    expect(f).toContain("@/lib/geo");
    expect(f).not.toMatch(/distanceInMeters/);
  });
  it("a success toast tells the owner the application is under verification", () => {
    expect(read("app/owner/[id]/new-mess/page.jsx")).toMatch(
      /under verification/,
    );
  });
  it("new users are signed in right after registering", () => {
    const f = read("Component/Auth/SignupComponent.jsx");
    expect(f).toMatch(/signIn\("credentials"/);
    expect(f).not.toMatch(/setTimeout\([^)]*router\.push\("\/login"\)/);
  });
});

describe("typography", () => {
  it("uses self-hosted classic serif fonts", () => {
    expect(read("app/layout.tsx")).toContain("@fontsource-variable/lora");
    expect(read("app/layout.tsx")).toContain(
      "@fontsource-variable/playfair-display",
    );
    expect(read("app/layout.tsx")).not.toContain("next/font/google");
    expect(read("app/globals.css")).toMatch(/Playfair Display/);
  });
});
