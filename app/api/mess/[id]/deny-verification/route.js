import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { messRepository } from "@/lib/server/repositories/messes";
import { sendMailSafe } from "@/lib/server/mail/mailer";
import { messDeniedMail } from "@/lib/server/mail/templates";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const runtime = "nodejs";

// Denying a verification request removes the request (admin only).
export const POST = createRoute(
  { name: "admin.mess.deny", auth: "admin", uuid: ["id"], rateLimit: { ...Limits.admin, by: "user" }, bodyType: "none" },
  async ({ params, session, log }) => {
    const mess = await messRepository.delete(params.id);
    if (!mess) throw notFound("Mess not found or already deleted");

    await deleteCacheKeys([cacheKeys.mess(mess.id), cacheKeys.messList(), cacheKeys.messPending(), cacheKeys.adminMesses()]);
    audit(AuditEvent.MESS_VERIFICATION_DENIED, { actorId: session.user.id, actorRole: "admin", targetId: mess.id }, log);
    await sendMailSafe({ to: mess.email, ...messDeniedMail({ ownerName: mess.owner_name || mess.name }) }, log);
    return json({ message: "Mess verification denied and record deleted" });
  },
);
