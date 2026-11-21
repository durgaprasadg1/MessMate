/**
 * CSRF defence for cookie-authenticated JSON APIs.
 *
 * The session cookie is SameSite=Lax; on top of that every state-changing
 * request must come from our own origin (Origin, falling back to Referer).
 * `Host` is only used to *compare* with Origin - never to build links.
 */
import { getEnv } from "../config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const isMutating = (method) => !SAFE_METHODS.has(String(method).toUpperCase());

const firstValue = (v) => (v || "").split(",")[0].trim().toLowerCase();

function hostOf(value) {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

export function allowedHosts(request, env = getEnv()) {
  const hosts = new Set();
  const h = request.headers;
  const own = firstValue(h.get("x-forwarded-host")) || firstValue(h.get("host"));
  if (own) hosts.add(own);
  if (env.baseUrl) {
    const b = hostOf(env.baseUrl);
    if (b) hosts.add(b);
  }
  for (const extra of (env.ALLOWED_ORIGINS || "").split(",")) {
    const x = extra.trim() && (hostOf(extra.trim()) || extra.trim().toLowerCase());
    if (x) hosts.add(x);
  }
  return hosts;
}

/** @returns {{ ok: true } | { ok: false, reason: string }} */
export function checkOrigin(request, env = getEnv()) {
  if (!isMutating(request.method)) return { ok: true };

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const source = origin && origin !== "null" ? origin : origin === "null" ? null : referer;

  if (!source) return { ok: false, reason: "missing_origin" };
  const host = hostOf(source);
  if (!host) return { ok: false, reason: "invalid_origin" };
  if (!allowedHosts(request, env).has(host)) return { ok: false, reason: "origin_mismatch" };
  return { ok: true };
}
