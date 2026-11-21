/**
 * Central, validated runtime configuration (Single Responsibility: env access).
 *
 * Everything else in the backend reads configuration through `getEnv()` so
 * that (a) missing/weak secrets are caught in one place and (b) tests can swap
 * the environment without touching process.env all over the code base.
 */
import { z } from "zod";

export const SECRET_MIN_LENGTH = 32;

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  TENANT_ID: z.string().default("public"),
  LOG_LEVEL: z.string().optional(),
  SESSION_MAX_AGE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(8 * 60 * 60),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),
  MFA_ENCRYPTION_KEY: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
});

let cached = null;

/** Read + validate the environment. Result is memoised for process.env. */
export function getEnv(source = process.env) {
  if (source === process.env && cached) return cached;
  const parsed = schema.parse(source);
  const env = {
    ...parsed,
    isProduction: parsed.NODE_ENV === "production",
    isTest: parsed.NODE_ENV === "test",
    /** Public origin of this deployment, without a trailing slash. */
    baseUrl: (parsed.NEXTAUTH_URL || parsed.NEXT_PUBLIC_BASE_URL || "").replace(
      /\/+$/,
      "",
    ),
  };
  if (source === process.env) cached = env;
  return env;
}

/** For tests only. */
export function resetEnvCache() {
  cached = null;
}

/**
 * Returns a list of configuration problems and, in production, throws when
 * NEXTAUTH_SECRET is missing/weak or NEXTAUTH_URL is not https. Used by
 * NextAuth options and server.js so the app refuses to boot instead of
 * silently signing sessions with a guessable key.
 */
export function assertSecureConfig(source = process.env) {
  const env = getEnv(source);
  const problems = [];

  if (!env.NEXTAUTH_SECRET || env.NEXTAUTH_SECRET.length < SECRET_MIN_LENGTH) {
    problems.push(
      `NEXTAUTH_SECRET must be at least ${SECRET_MIN_LENGTH} characters (generate with: openssl rand -base64 48)`,
    );
  }
  if (env.isProduction) {
    if (!env.baseUrl) {
      problems.push("NEXTAUTH_URL must be set in production");
    } else if (!env.baseUrl.startsWith("https://")) {
      problems.push(
        "NEXTAUTH_URL must be https:// in production so cookies are Secure",
      );
    }
  }

  if (problems.length && env.isProduction) {
    throw new Error(`Insecure configuration:\n - ${problems.join("\n - ")}`);
  }
  return problems; // non-production callers can log them as warnings
}
