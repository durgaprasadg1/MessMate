import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { Limits } from "@/lib/server/security/rateLimiter";
import { forgotPasswordSchema } from "@/lib/server/validation/schemas";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { createResetToken } from "@/lib/server/auth/resetTokenService";
import { sendMailSafe } from "@/lib/server/mail/mailer";
import { passwordResetMail } from "@/lib/server/mail/templates";
import { getEnv } from "@/lib/server/config/env";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

// Same answer whether or not the account exists (no user enumeration).
const GENERIC = {
  message: "If an account exists for that e-mail, a reset link has been sent.",
};

export const POST = createRoute(
  {
    name: "auth.forgot-password",
    auth: "public",
    rateLimit: Limits.forgotPassword,
    body: forgotPasswordSchema,
  },
  async ({ body, ip, log }) => {
    const user = await consumerRepository.findByEmail(
      body.email,
      "id, email, username",
    );
    audit(
      AuditEvent.PASSWORD_RESET_REQUESTED,
      { ip, found: Boolean(user) },
      log,
    );
    if (!user) return json(GENERIC);

    const { token, tokenHash, expiresAt } = createResetToken();
    await consumerRepository.setResetToken(user.id, tokenHash, expiresAt);

    // Link is built ONLY from configured base URL (never from Host headers).
    const base = getEnv().baseUrl;
    if (!base) {
      log.error(
        "NEXTAUTH_URL is not configured; cannot build a safe reset link",
      );
      return json(GENERIC);
    }
    const mail = passwordResetMail({
      name: user.username,
      link: `${base}/reset-password/${token}`,
    });
    await sendMailSafe({ to: user.email, ...mail }, log);

    return json(GENERIC);
  },
);
