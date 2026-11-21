/**
 * TOTP (RFC 6238) multi-factor authentication implemented with Node's crypto
 * only - no third-party service involved. Works with Google Authenticator,
 * Authy, Microsoft Authenticator, 1Password, etc.
 *
 * The shared secret is stored ENCRYPTED (AES-256-GCM) with MFA_ENCRYPTION_KEY
 * (falls back to a key derived from NEXTAUTH_SECRET). Recovery codes are
 * stored only as SHA-256 hashes and are single-use.
 */
import crypto from "node:crypto";
import { getEnv } from "../config/env.js";
import { safeEqual, sha256Hex } from "../security/safeCompare.js";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;

export function base32Encode(buf) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(str) {
  const clean = String(str).replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0, value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function totpAt(secretBase32, timeMs = Date.now()) {
  const counter = Math.floor(timeMs / 1000 / TOTP_STEP_SECONDS);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(secretBase32)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

/** Accepts the current step +/- `window` steps to tolerate clock drift. */
export function verifyTotp(secretBase32, token, { timeMs = Date.now(), window = 1 } = {}) {
  const candidate = String(token || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(candidate)) return false;
  let ok = false;
  for (let i = -window; i <= window; i++) {
    // no early exit: constant number of comparisons
    if (safeEqual(totpAt(secretBase32, timeMs + i * TOTP_STEP_SECONDS * 1000), candidate)) ok = true;
  }
  return ok;
}

export function buildOtpAuthUri({ secret, account, issuer = "MessMate" }) {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
}

// ---- secret encryption at rest -------------------------------------------
function encryptionKey() {
  const env = getEnv();
  const material = env.MFA_ENCRYPTION_KEY || env.NEXTAUTH_SECRET;
  if (!material) throw new Error("MFA_ENCRYPTION_KEY (or NEXTAUTH_SECRET) must be set to use MFA");
  return crypto.createHash("sha256").update(`messmate-mfa:${material}`).digest();
}

export function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${enc.toString("base64")}`;
}

export function decryptSecret(payload) {
  const [v, iv, tag, data] = String(payload).split(".");
  if (v !== "v1" || !iv || !tag || !data) throw new Error("Unsupported secret format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

// ---- recovery codes ---------------------------------------------------------
export function generateRecoveryCodes(count = 8) {
  const codes = Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString("hex"); // 10 hex chars
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
  return { codes, hashes: codes.map(hashRecoveryCode) };
}

export const hashRecoveryCode = (code) =>
  sha256Hex(String(code).trim().toLowerCase().replace(/[^a-f0-9]/g, ""));

/** @returns {{ valid: boolean, remaining: string[] }} remaining hashes after consuming */
export function consumeRecoveryCode(hashes = [], code) {
  const h = hashRecoveryCode(code);
  const idx = hashes.findIndex((x) => safeEqual(x, h));
  if (idx === -1) return { valid: false, remaining: hashes };
  return { valid: true, remaining: hashes.filter((_, i) => i !== idx) };
}
