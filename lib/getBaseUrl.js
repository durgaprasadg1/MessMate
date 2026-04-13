/**
 * Get the base URL for API calls
 * Works in both client and server components
 * @returns {Promise<string>} The base URL
 */
export async function getBaseUrl() {
  // Browser should use relative path
  if (typeof window !== "undefined") {
    return "";
  }

  const firstHeaderValue = (value) => value?.split(",")?.[0]?.trim() || "";
  const normalize = (url) => url.replace(/\/+$/, "");
  const isLocalHost = (value) => {
    try {
      const parsed = new URL(value);
      return ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
    } catch {
      return false;
    }
  };

  // Prefer the active request host to avoid cross-host requests on deployments.
  try {
    const { headers } = await import("next/headers");
    const requestHeaders = await headers();
    const host =
      firstHeaderValue(requestHeaders.get("x-forwarded-host")) ||
      firstHeaderValue(requestHeaders.get("host"));
    const protocol =
      firstHeaderValue(requestHeaders.get("x-forwarded-proto")) ||
      (process.env.NODE_ENV === "production" ? "https" : "http");

    if (host) {
      return `${protocol}://${host}`;
    }
  } catch {
    // headers() may be unavailable in non-request contexts; use env fallback.
  }

  // Server: Deployment URL (Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Server: Explicit base URL (custom hosting / self-hosted)
  const configuredBase =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  if (configuredBase) {
    if (process.env.NODE_ENV === "production" && isLocalHost(configuredBase)) {
      console.warn(
        "[getBaseUrl] Ignoring localhost URL in production:",
        configuredBase,
      );
    } else {
      return normalize(configuredBase);
    }
  }

  // Server: Safe local fallback only for local development
  return `http://localhost:${process.env.PORT || 3000}`;
}
