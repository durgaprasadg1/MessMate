import { toast } from "react-toastify";

/**
 * Single entry point for browser -> API calls (drop-in replacement for fetch).
 *
 *  - same-origin credentials (the HttpOnly session cookie travels, nothing else)
 *  - JSON content-type is added automatically for string bodies
 *  - central handling of throttling (429) and expired sessions (401)
 *
 * It never reads or stores tokens: authentication is the cookie, authorisation
 * is enforced by the API.
 */
let lastNotice = 0;
const notifyOnce = (fn) => {
  const now = Date.now();
  if (now - lastNotice > 3000) {
    lastNotice = now;
    fn();
  }
};

export async function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  const body = init.body;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body && !isForm && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  const res = await fetch(input, {
    credentials: "same-origin",
    ...init,
    headers,
  });

  if (typeof window !== "undefined") {
    if (res.status === 429) {
      const seconds = Number(res.headers.get("Retry-After")) || 60;
      notifyOnce(() =>
        toast.error(`Too many requests. Please try again in ${seconds} s.`, {
          toastId: "rate-limited",
        }),
      );
    } else if (res.status === 401) {
      notifyOnce(() =>
        toast.info("Your session has expired. Please log in again.", {
          toastId: "session-expired",
        }),
      );
    }
  }
  return res;
}

/** Seconds from a 429 response (for forms that want to show a countdown). */
export const retryAfterSeconds = (res) =>
  Number(res?.headers?.get?.("Retry-After")) || 60;

export default apiFetch;
