import { describe, it, expect } from "vitest";
import {
  base32Encode, base32Decode, totpAt, verifyTotp, generateSecret, buildOtpAuthUri,
  encryptSecret, decryptSecret, generateRecoveryCodes, consumeRecoveryCode,
} from "@/lib/server/auth/mfaService.js";

// RFC 6238 appendix B, SHA-1, secret "12345678901234567890", 6 digits (last 6 of the 8-digit vectors)
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"));

describe("TOTP", () => {
  it("matches the RFC 6238 test vectors", () => {
    expect(totpAt(RFC_SECRET, 59_000)).toBe("287082");
    expect(totpAt(RFC_SECRET, 1_111_111_109_000)).toBe("081804");
    expect(totpAt(RFC_SECRET, 1_234_567_890_000)).toBe("005924");
  });
  it("verifies within +/-1 step only", () => {
    const t = 1_700_000_000_000;
    const code = totpAt(RFC_SECRET, t);
    expect(verifyTotp(RFC_SECRET, code, { timeMs: t })).toBe(true);
    expect(verifyTotp(RFC_SECRET, code, { timeMs: t + 30_000 })).toBe(true);
    expect(verifyTotp(RFC_SECRET, code, { timeMs: t + 120_000 })).toBe(false);
  });
  it("rejects malformed codes", () => {
    expect(verifyTotp(RFC_SECRET, "abc")).toBe(false);
    expect(verifyTotp(RFC_SECRET, "")).toBe(false);
  });
  it("base32 round-trips", () => {
    const buf = Buffer.from("hello world");
    expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
  });
  it("builds an otpauth uri", () => {
    const uri = buildOtpAuthUri({ secret: generateSecret(), account: "a@b.com" });
    expect(uri).toMatch(/^otpauth:\/\/totp\/MessMate%3Aa%40b\.com\?secret=[A-Z2-7]+&issuer=MessMate/);
  });
});

describe("secret encryption + recovery codes", () => {
  it("encrypts at rest and decrypts", () => {
    const enc = encryptSecret("JBSWY3DPEHPK3PXP");
    expect(enc).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptSecret(enc)).toBe("JBSWY3DPEHPK3PXP");
  });
  it("detects tampering", () => {
    const enc = encryptSecret("SECRET");
    const parts = enc.split(".");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });
  it("recovery codes are single use", () => {
    const { codes, hashes } = generateRecoveryCodes(3);
    const first = consumeRecoveryCode(hashes, codes[0]);
    expect(first.valid).toBe(true);
    expect(first.remaining).toHaveLength(2);
    expect(consumeRecoveryCode(first.remaining, codes[0]).valid).toBe(false);
    expect(consumeRecoveryCode(hashes, "nope-nope").valid).toBe(false);
  });
});
