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

  // Server: Check for deployment URL (Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Server: Check for custom base URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Server: Default to localhost
  return `http://localhost:${process.env.PORT || 3000}`;
}
