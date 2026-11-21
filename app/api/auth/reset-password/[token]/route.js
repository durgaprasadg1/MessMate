import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { badRequest } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { resetPasswordSchema } from "@/lib/server/validation/schemas";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { hashResetToken, looksLikeResetToken } from "@/lib/server/auth/resetTokenService";
import { getPasswordService } from "@/lib/server/auth/passwordService";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

async function findUserByToken(token) {
  if (!looksLikeResetToken(token)) return null;
  return consumerRepository.findByResetTokenHash(hashResetToken(token));
}

// Token is the credential, so this works for logged-out users (the previous
// version required an active session, which defeated the purpose).
export const GET = createRoute(
  { name: "auth.reset-password.check", auth: "public", rateLimit: { ...Limits.resetPassword, by: "ip" } },
  async ({ params }) => {
    const user = await findUserByToken(params.token);
    if (!user) throw badRequest("Link Expired");
    return json({ success: true });
  },
);

export const PATCH = createRoute(
  { name: "auth.reset-password", auth: "public", rateLimit: { ...Limits.resetPassword, by: "ip" }, body: resetPasswordSchema },
  async ({ params, body, ip, log }) => {
    const user = await findUserByToken(params.token);
    if (!user) {
      audit(AuditEvent.PASSWORD_RESET_FAILED, { ip }, log);
      throw badRequest("Invalid or expired token");
    }
    await consumerRepository.resetPassword(user.id, await getPasswordService().hash(body.password));
    audit(AuditEvent.PASSWORD_RESET_COMPLETED, { actorId: user.id, ip }, log);
    return json({ message: "Password reset successful" });
  },
);
