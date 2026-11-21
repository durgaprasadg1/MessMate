/**
 * NextAuth configuration (moved out of the route file so any module can import
 * it without circular imports, and so the route exports only HTTP handlers).
 */
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import logger from "../logging/logger.js";
import { audit, AuditEvent } from "../logging/audit.js";
import { getEnv, assertSecureConfig } from "../config/env.js";
import { adminRepository, ownerRepository, consumerRepository } from "../repositories/accounts.js";
import { getPasswordService, getDummyHash } from "./passwordService.js";
import { getRateLimiter, Limits } from "../security/rateLimiter.js";
import { getClientIp } from "../security/clientIp.js";
import { verifyTotp, decryptSecret, consumeRecoveryCode } from "./mfaService.js";

export const AUTH_ERRORS = Object.freeze({
  INVALID: "Invalid credentials",
  MFA_REQUIRED: "MFA_REQUIRED",
  MFA_INVALID: "MFA_INVALID",
  RATE_LIMITED: "Too many attempts. Please try again later.",
});

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
  mfaCode: z.string().trim().max(32).optional().or(z.literal("")),
});

/** Order matters: it is the historical lookup order (admin, owner, consumer). */
const PRINCIPALS = [
  { repo: adminRepository, isAdmin: true, isOwner: false },
  { repo: ownerRepository, isAdmin: false, isOwner: true },
  { repo: consumerRepository, isAdmin: false, isOwner: false },
];

async function findPrincipal(email) {
  for (const p of PRINCIPALS) {
    const row = await p.repo.findForLogin(email);
    if (row) return { ...p, row };
  }
  return null;
}

async function checkMfa(principal, code, log) {
  const { row, repo } = principal;
  if (!row.mfa_enabled) return;
  if (!code) throw new Error(AUTH_ERRORS.MFA_REQUIRED);

  const limiter = await getRateLimiter();
  await limiter
    .enforce({ ...Limits.mfa, key: `acct:${row.id}` })
    .catch(() => {
      throw new Error(AUTH_ERRORS.RATE_LIMITED);
    });

  let secret;
  try {
    secret = decryptSecret(row.mfa_secret);
  } catch (err) {
    log.error("MFA secret could not be decrypted", { err, accountId: row.id });
    throw new Error(AUTH_ERRORS.MFA_INVALID);
  }
  if (verifyTotp(secret, code)) return;

  // recovery code (single use)
  const { valid, remaining } = consumeRecoveryCode(row.mfa_recovery_codes || [], code);
  if (valid) {
    await repo.setRecoveryCodes(row.id, remaining);
    log.warn("MFA recovery code used", { accountId: row.id, remaining: remaining.length });
    return;
  }
  audit(AuditEvent.MFA_FAILED, { actorId: row.id }, log);
  throw new Error(AUTH_ERRORS.MFA_INVALID);
}

export async function authorizeCredentials(rawCredentials, req) {
  const log = logger.child({ module: "auth" });
  const parsed = credentialsSchema.safeParse(rawCredentials || {});
  if (!parsed.success) throw new Error(AUTH_ERRORS.INVALID);
  const { email, password, mfaCode } = parsed.data;
  const ip = getClientIp({ headers: req?.headers || {} });

  const limiter = await getRateLimiter();
  try {
    await limiter.enforce({ ...Limits.login, key: `${ip}:${email}` });
    await limiter.enforce({ ...Limits.login, name: "login-ip", limit: 30, key: ip });
  } catch {
    audit(AuditEvent.LOGIN_RATE_LIMITED, { ip, email }, log);
    throw new Error(AUTH_ERRORS.RATE_LIMITED);
  }

  const passwords = getPasswordService();
  const principal = await findPrincipal(email);

  if (!principal) {
    await passwords.verify(password, await getDummyHash(passwords)); // equalise timing
    audit(AuditEvent.LOGIN_FAILURE, { ip, email, reason: "unknown_account" }, log);
    throw new Error(AUTH_ERRORS.INVALID);
  }

  const { row, repo, isAdmin, isOwner } = principal;
  if (!(await passwords.verify(password, row.password))) {
    audit(AuditEvent.LOGIN_FAILURE, { ip, actorId: row.id, reason: "bad_password" }, log);
    throw new Error(AUTH_ERRORS.INVALID);
  }

  try {
    await checkMfa(principal, mfaCode, log);
  } catch (err) {
    if (err.message !== AUTH_ERRORS.MFA_REQUIRED) {
      audit(AuditEvent.LOGIN_FAILURE, { ip, actorId: row.id, reason: "mfa" }, log);
    }
    throw err;
  }

  if (passwords.needsRehash(row.password)) {
    repo.updatePassword(row.id, await passwords.hash(password)).catch((err) => log.warn("Password rehash failed", { err }));
  }

  audit(AuditEvent.LOGIN_SUCCESS, { ip, actorId: row.id, actorRole: isAdmin ? "admin" : isOwner ? "owner" : "consumer" }, log);
  return {
    id: row.id,
    username: row[repo.nameColumn],
    email: row.email,
    isAdmin,
    isOwner,
  };
}

export function buildAuthOptions() {
  const env = getEnv();
  return {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
          mfaCode: { label: "Authenticator code", type: "text" },
        },
        async authorize(credentials, req) {
          const problems = assertSecureConfig();
          if (problems.length) logger.warn("Configuration problems", { problems });
          return authorizeCredentials(credentials, req);
        },
      }),
    ],

    session: { strategy: "jwt", maxAge: env.SESSION_MAX_AGE_SECONDS },
    jwt: { maxAge: env.SESSION_MAX_AGE_SECONDS },
    secret: env.NEXTAUTH_SECRET,
    useSecureCookies: env.baseUrl.startsWith("https://"),

    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.username = user.username;
          token.isAdmin = user.isAdmin || false;
          token.isOwner = user.isOwner || false;
        }
        return token;
      },
      async session({ session, token }) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.isAdmin = token.isAdmin;
        session.user.isOwner = token.isOwner;
        return session;
      },
    },

    logger: {
      error: (code, meta) => logger.error("next-auth", { code, meta }),
      warn: (code) => logger.warn("next-auth", { code }),
      debug: () => {},
    },

    pages: { signIn: "/login" },
  };
}

export const authOptions = buildAuthOptions();
