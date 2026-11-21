/**
 * Redaction helpers (Single Responsibility): decide what must never reach logs.
 */
const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|cookie|signature|api[-_]?key|adhar|aadhaar|upi|otp|mfa|credit|card|cvv|hash/i;
const EMAIL =
  /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

export const REDACTED = "[REDACTED]";
const MAX_DEPTH = 5;
const MAX_STRING = 500;

export function maskEmail(value) {
  if (typeof value !== "string") return value;
  return value.replace(EMAIL, (_m, first, domain) => `${first}***${domain}`);
}

function redactString(value) {
  const masked = maskEmail(value);
  return masked.length > MAX_STRING
    ? `${masked.slice(0, MAX_STRING)}…[truncated]`
    : masked;
}

export function redact(value, depth = 0, seen = new WeakSet()) {
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value !== "object") return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message || ""),
      code: value.code,
      status: value.status,
    };
  }
  if (value instanceof Date) return value.toISOString();
  if (depth >= MAX_DEPTH) return "[Truncated]";
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redact(v, depth + 1, seen));
  }

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEY.test(k) ? REDACTED : redact(v, depth + 1, seen);
  }
  return out;
}
