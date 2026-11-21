/**
 * Best-effort client IP for rate limiting / audit logs.
 * Only the first hop of x-forwarded-for is used and it is validated, so a
 * client cannot inject arbitrary strings into Redis keys or logs.
 */
const IP_LIKE = /^[0-9a-fA-F:.]{3,45}$/;

export function getClientIp(request) {
  const headers = request?.headers;
  const get = (n) => (typeof headers?.get === "function" ? headers.get(n) : headers?.[n]);
  const candidate =
    get("x-real-ip") || (get("x-forwarded-for") || "").split(",")[0]?.trim() || "";
  return IP_LIKE.test(candidate) ? candidate : "unknown";
}
