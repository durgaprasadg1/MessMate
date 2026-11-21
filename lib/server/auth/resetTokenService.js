import crypto from "node:crypto";
import { sha256Hex } from "../security/safeCompare.js";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Reset tokens: the raw token only travels in the e-mail link. The database
 * stores a SHA-256 of it, so a database leak does not yield usable links.
 */
export function createResetToken(now = Date.now()) {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: sha256Hex(token),
    expiresAt: new Date(now + RESET_TOKEN_TTL_MS).toISOString(),
  };
}

export const hashResetToken = (token) => sha256Hex(token);
export const looksLikeResetToken = (token) => typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);
