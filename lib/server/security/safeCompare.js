import crypto from "node:crypto";

/** Constant-time string comparison that tolerates different lengths. */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ""), "utf8");
  const bufB = Buffer.from(String(b ?? ""), "utf8");
  if (bufA.length !== bufB.length) {
    // still burn comparable time, then fail
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export const sha256Hex = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

export const hmacSha256Hex = (secret, payload) =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");
