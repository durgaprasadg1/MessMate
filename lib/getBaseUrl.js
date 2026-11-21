/**
 * Base URL for server-side calls to our own API.
 *
 * SECURITY: in production the URL comes from configuration only. The previous
 * version trusted the Host / X-Forwarded-Host request headers, which let a
 * client make the server issue requests to an arbitrary host (SSRF) and
 * poison links. Headers are used only as a development fallback.
 */
export async function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser: relative URLs

  const normalize = (url) => url.replace(/\/+$/, "");
  const isLocalHost = (value) => {
    try {
      return ["localhost", "127.0.0.1", "0.0.0.0"].includes(new URL(value).hostname);
    } catch {
      return false;
    }
  };
  const isProd = process.env.NODE_ENV === "production";

  const configured = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (configured && !(isProd && isLocalHost(configured))) return normalize(configured);

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  if (!isProd) {
    try {
      const { headers } = await import("next/headers");
      const h = await headers();
      const first = (v) => v?.split(",")?.[0]?.trim() || "";
      const host = first(h.get("x-forwarded-host")) || first(h.get("host"));
      if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) return `${first(h.get("x-forwarded-proto")) || "http"}://${host}`;
    } catch {
      /* not in a request context */
    }
  }
  return `http://localhost:${process.env.PORT || 3000}`;
}
