import { describe, it, expect } from "vitest";
import { checkOrigin } from "@/lib/server/http/origin.js";
import { makeRequest } from "../helpers/http.js";

const env = { baseUrl: "https://mess.example.com", ALLOWED_ORIGINS: "" };

describe("CSRF origin check", () => {
  it("ignores safe methods", () => {
    expect(checkOrigin(makeRequest("/api/x", { origin: null }), env).ok).toBe(true);
  });
  it("allows same-origin mutations", () => {
    expect(checkOrigin(makeRequest("/api/x", { method: "POST", origin: "http://localhost:3000" }), env).ok).toBe(true);
    expect(checkOrigin(makeRequest("/api/x", { method: "POST", origin: "https://mess.example.com" }), env).ok).toBe(true);
  });
  it("blocks cross-site mutations", () => {
    const r = checkOrigin(makeRequest("/api/x", { method: "DELETE", origin: "https://evil.example" }), env);
    expect(r).toEqual({ ok: false, reason: "origin_mismatch" });
  });
  it("blocks the opaque 'null' origin and missing origin", () => {
    expect(checkOrigin(makeRequest("/api/x", { method: "POST", origin: "null" }), env).ok).toBe(false);
    expect(checkOrigin(makeRequest("/api/x", { method: "POST", origin: null }), env).ok).toBe(false);
  });
  it("falls back to Referer", () => {
    const req = makeRequest("/api/x", { method: "POST", origin: null, headers: { referer: "http://localhost:3000/page" } });
    expect(checkOrigin(req, env).ok).toBe(true);
  });
  it("honours ALLOWED_ORIGINS", () => {
    const e = { ...env, ALLOWED_ORIGINS: "https://admin.example.com" };
    expect(checkOrigin(makeRequest("/api/x", { method: "POST", origin: "https://admin.example.com" }), e).ok).toBe(true);
  });
});
