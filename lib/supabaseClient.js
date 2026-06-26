import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

const SUPABASE_RETRYABLE_METHODS = new Set(["GET", "HEAD"]);
const SUPABASE_RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504, 520, 522, 524]);
const SUPABASE_MAX_RETRIES = 2;
const SUPABASE_RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRetryableNetworkError(error) {
  const message = getErrorMessage(error);

  return (
    message.includes("UND_ERR_CONNECT_TIMEOUT") ||
    message.includes("Connect Timeout Error") ||
    message.includes("fetch failed")
  );
}

async function supabaseFetchWithRetry(input, init = {}) {
  const method = (init.method || "GET").toUpperCase();
  const canRetry = SUPABASE_RETRYABLE_METHODS.has(method);
  const maxAttempts = canRetry ? SUPABASE_MAX_RETRIES + 1 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(input, init);

      if (
        !canRetry ||
        !SUPABASE_RETRYABLE_STATUS_CODES.has(response.status) ||
        attempt === maxAttempts
      ) {
        return response;
      }

      const delayMs = SUPABASE_RETRY_DELAY_MS * attempt;
      console.warn(
        `Supabase request returned ${response.status}. Retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts}).`
      );
      await sleep(delayMs);
    } catch (error) {
      if (!canRetry || attempt === maxAttempts || !isRetryableNetworkError(error)) {
        throw error;
      }

      const delayMs = SUPABASE_RETRY_DELAY_MS * attempt;
      console.warn(
        `Supabase request failed: ${getErrorMessage(error)}. Retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts}).`
      );
      await sleep(delayMs);
    }
  }

  throw new Error("Supabase request failed after retries");
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    "Supabase env vars missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

function createMissingConfigClient() {
  const message =
    "Supabase env vars missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY";

  return new Proxy(
    {},
    {
      get() {
        throw new Error(message);
      },
    }
  );
}

export const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { fetch: supabaseFetchWithRetry },
      })
    : createMissingConfigClient();

export default supabase;
