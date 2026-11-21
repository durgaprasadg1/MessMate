import { describe, it, expect } from "vitest";
import { validatePasswordStrength, passwordSchema } from "@/lib/server/auth/passwordPolicy.js";
import { PasswordService } from "@/lib/server/auth/passwordService.js";
import bcrypt from "bcryptjs";
import { createResetToken, hashResetToken, looksLikeResetToken } from "@/lib/server/auth/resetTokenService.js";

describe("password policy", () => {
  it("rejects short / weak passwords", () => {
    expect(validatePasswordStrength("Ab1!")).not.toHaveLength(0);
    expect(validatePasswordStrength("alllowercase123!")).toContain("an uppercase letter");
    expect(validatePasswordStrength("ALLUPPERCASE123!")).toContain("a lowercase letter");
    expect(validatePasswordStrength("NoSpecialChars123")).toContain("a special character");
  });
  it("accepts a strong password", () => {
    expect(validatePasswordStrength("Correct-Horse-9-Battery")).toEqual([]);
    expect(passwordSchema.safeParse("Correct-Horse-9-Battery").success).toBe(true);
  });
  it("caps very long inputs", () => {
    expect(passwordSchema.safeParse("Aa!" + "x".repeat(200)).success).toBe(false);
  });
});

describe("PasswordService", () => {
  const svc = new PasswordService({ cost: 10 });
  it("hashes and verifies", async () => {
    const h = await svc.hash("Correct-Horse-9-Battery");
    expect(await svc.verify("Correct-Horse-9-Battery", h)).toBe(true);
    expect(await svc.verify("wrong", h)).toBe(false);
  });
  it("never throws on junk hashes", async () => {
    expect(await svc.verify("x", "not-a-hash")).toBe(false);
    expect(await svc.verify("x", undefined)).toBe(false);
  });
  it("flags lower-cost hashes for upgrade", async () => {
    const old = await bcrypt.hash("x", 8);
    expect(new PasswordService({ cost: 12 }).needsRehash(old)).toBe(true);
    expect(new PasswordService({ cost: 10 }).needsRehash(await svc.hash("x"))).toBe(false);
  });
});

describe("reset tokens", () => {
  it("stores only a hash of the token", () => {
    const { token, tokenHash, expiresAt } = createResetToken(1_000);
    expect(looksLikeResetToken(token)).toBe(true);
    expect(tokenHash).toBe(hashResetToken(token));
    expect(tokenHash).not.toBe(token);
    expect(new Date(expiresAt).getTime()).toBe(1_000 + 3_600_000);
  });
  it("rejects malformed tokens", () => {
    expect(looksLikeResetToken("undefined")).toBe(false);
    expect(looksLikeResetToken("../etc/passwd")).toBe(false);
  });
});
