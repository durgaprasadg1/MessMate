/**
 * Static guards: fail the build if someone adds an unprotected handler or
 * reintroduces a known-dangerous pattern.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name === ".next" ? [] : walk(p);
    return [p];
  });
const rel = (p) => path.relative(root, p);

const routeFiles = walk(path.join(root, "app/api")).filter((f) => /route\.(js|ts)$/.test(f));
const serverFiles = [...walk(path.join(root, "app/api")), ...walk(path.join(root, "lib"))].filter((f) => /\.(js|ts)$/.test(f));
const EXEMPT = new Set(["app/api/auth/[...nextauth]/route.js", "app/api/socket/route.js"]);

describe("every API handler goes through createRoute", () => {
  it("found the routes", () => expect(routeFiles.length).toBeGreaterThan(30));

  it.each(routeFiles.map((f) => [rel(f), f]))("%s", (name, file) => {
    if (EXEMPT.has(name)) return;
    const src = fs.readFileSync(file, "utf8");
    expect(src.trim().length, "route file must not be empty").toBeGreaterThan(0);
    const exported = [...src.matchAll(/export\s+(?:const|async function|function)\s+(GET|POST|PUT|PATCH|DELETE)\b([^=\n]*=?\s*[^\n]*)/g)];
    expect(exported.length, "route exports at least one HTTP method").toBeGreaterThan(0);
    for (const m of exported) {
      expect(m[0], `${m[1]} in ${name} must be wrapped with createRoute`).toMatch(/=\s*createRoute\(/);
    }
    // only HTTP methods / route config may be exported from a route file
    const names = [...src.matchAll(/export\s+(?:const|async function|function|let)\s+(\w+)/g)].map((m) => m[1]);
    for (const n of names) expect(["GET", "POST", "PUT", "PATCH", "DELETE", "runtime", "dynamic", "revalidate"]).toContain(n);
  });

  it("no public handler is mutating unless it is an auth / webhook endpoint", () => {
    const allowedPublicMutations = new Set([
      "app/api/auth/signup/route.js",
      "app/api/auth/register-owner/route.js",
      "app/api/auth/forgot-password/route.js",
      "app/api/auth/reset-password/[token]/route.js",
      "app/api/webhooks/razorpay/route.js",
    ]);
    for (const file of routeFiles) {
      const name = rel(file);
      const src = fs.readFileSync(file, "utf8");
      const publicMutation = /export const (POST|PUT|PATCH|DELETE) = createRoute\(\s*\{[^}]*auth:\s*"public"/s.test(src);
      if (publicMutation) expect(allowedPublicMutations.has(name), `${name} has a public mutating handler`).toBe(true);
    }
  });
});

describe("dangerous patterns stay out", () => {
  const code = serverFiles.filter((f) => !f.endsWith("db.sql"));
  it('no select("*") / select(`*`) - password hashes must never be selected by accident', () => {
    const offenders = code.filter((f) => /\.select\(\s*["'`]\*["'`]/.test(fs.readFileSync(f, "utf8")) || /[(,]\s*\*\s*[,)]/.test((fs.readFileSync(f, "utf8").match(/\.select\(\s*[`"'][^`"']*[`"']/g) || []).join("")));
    expect(offenders.map(rel)).toEqual([]);
  });
  it("no x-tenant-id header driven cache keys", () => {
    expect(code.filter((f) => /x-tenant-id/i.test(fs.readFileSync(f, "utf8"))).map(rel)).toEqual([]);
  });
  it("no error.message is sent to clients", () => {
    const offenders = code.filter((f) => /json\(\s*\{[^}]*error:\s*(error|err|e)\.message/s.test(fs.readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });
  it("no raw console.* in server code (use the logger)", () => {
    const allowed = new Set(["lib/server/logging/logger.js"]);
    const offenders = code.filter((f) => !allowed.has(rel(f)) && /\bconsole\.(log|error|warn|info|debug)\(/.test(fs.readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });
  it("no Host-header derived links", () => {
    const offenders = code.filter((f) => /headers\.get\(["']host["']\)/.test(fs.readFileSync(f, "utf8")) && !/origin\.js$|socket\.js$/.test(f));
    expect(offenders.map(rel)).toEqual([]);
  });
  it("no public admin registration page", () => {
    expect(fs.existsSync(path.join(root, "app/secret"))).toBe(false);
  });
  it("no browser-side localStorage/sessionStorage for tokens", () => {
    const files = [...walk(path.join(root, "app")), ...walk(path.join(root, "Component")), ...walk(path.join(root, "contexts"))].filter((f) => /\.(jsx?|tsx?)$/.test(f));
    expect(files.filter((f) => /(localStorage|sessionStorage)/.test(fs.readFileSync(f, "utf8"))).map(rel)).toEqual([]);
  });
});
