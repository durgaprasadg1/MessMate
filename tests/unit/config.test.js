import { describe, it, expect } from "vitest";
import { assertSecureConfig, getEnv } from "@/lib/server/config/env.js";

const good = { NODE_ENV: "production", NEXTAUTH_SECRET: "x".repeat(48), NEXTAUTH_URL: "https://mess.example.com" };

describe("assertSecureConfig", () => {
  it("accepts a strong production config", () => {
    expect(assertSecureConfig(good)).toEqual([]);
  });
  it("refuses a weak secret in production", () => {
    expect(() => assertSecureConfig({ ...good, NEXTAUTH_SECRET: "short" })).toThrow(/NEXTAUTH_SECRET/);
  });
  it("refuses http NEXTAUTH_URL in production", () => {
    expect(() => assertSecureConfig({ ...good, NEXTAUTH_URL: "http://mess.example.com" })).toThrow(/https/);
  });
  it("only reports problems outside production", () => {
    expect(assertSecureConfig({ NODE_ENV: "development", NEXTAUTH_SECRET: "short" }).length).toBeGreaterThan(0);
  });
  it("defaults: 8h sessions and bcrypt cost 12", () => {
    const env = getEnv({ NODE_ENV: "test" });
    expect(env.SESSION_MAX_AGE_SECONDS).toBe(28800);
    expect(env.BCRYPT_COST).toBe(12);
  });
});
