/**
 * Get the base URL for API calls
 * Works in both client and server components
 * @returns {string} The base URL
 */
export function getBaseUrl() {
  // Browser should use relative path
  if (typeof window !== "undefined") {
    return "";
  }

  const normalize = (url) => url.replace(/\/+$/, "");
  const isLocalHost = (value) => {
    try {
      const parsed = new URL(value);
      return ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
    } catch {
      return false;
    }
  };

  // Server: Deployment URL (Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Server: Explicit base URL (custom hosting / self-hosted)
  const configuredBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
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