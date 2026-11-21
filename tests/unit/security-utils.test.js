import { describe, it, expect } from "vitest";
import { escapeHtml, html, safeUrl } from "@/lib/server/security/escapeHtml.js";
import { safeEqual, sha256Hex, hmacSha256Hex } from "@/lib/server/security/safeCompare.js";
import { getClientIp } from "@/lib/server/security/clientIp.js";
import { isUuid } from "@/lib/server/http/params.js";

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">`)).toBe("&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;");
  });
  it("handles null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
  it("html tag escapes every interpolation", () => {
    expect(html`<b>${"<script>"}</b>`).toBe("<b>&lt;script&gt;</b>");
  });
  it("safeUrl blocks javascript: URLs", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("#");
    expect(safeUrl("https://example.com/a")).toBe("https://example.com/a");
  });
});

describe("safeCompare", () => {
  it("compares equal and different strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual(undefined, "")).toBe(true);
  });
  it("hashes", () => {
    expect(sha256Hex("a")).toHaveLength(64);
    expect(hmacSha256Hex("k", "m")).toHaveLength(64);
  });
});

describe("getClientIp", () => {
  const req = (h) => ({ headers: new Headers(h) });
  it("uses the first forwarded hop", () => {
    expect(getClientIp(req({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
  });
  it("rejects junk so it cannot poison keys/logs", () => {
    expect(getClientIp(req({ "x-forwarded-for": "<script>alert(1)</script>" }))).toBe("unknown");
    expect(getClientIp(req({}))).toBe("unknown");
  });
});

describe("isUuid", () => {
  it("accepts v4 and rejects others", () => {
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isUuid("1; drop table users")).toBe(false);
    expect(isUuid("undefined")).toBe(false);
  });
});
