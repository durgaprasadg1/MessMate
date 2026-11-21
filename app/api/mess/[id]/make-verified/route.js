import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { messRepository } from "@/lib/server/repositories/messes";
import { sendMailSafe } from "@/lib/server/mail/mailer";
import { messVerifiedMail } from "@/lib/server/mail/templates";
import { getEnv } from "@/lib/server/config/env";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const POST = createRoute(
  { name: "admin.mess.verify", auth: "admin", uuid: ["id"], rateLimit: { ...Limits.admin, by: "user" }, bodyType: "none" },
  async ({ params, session, log }) => {
    const mess = await messRepository.getForVerification(params.id);
    if (!mess) throw notFound("Mess not found");

    await messRepository.setVerified(mess.id);
    await deleteCacheKeys([cacheKeys.mess(mess.id), cacheKeys.messList(), cacheKeys.messPending(), cacheKeys.adminMesses(), cacheKeys.ownerMesses(mess.owner_id)]);
    audit(AuditEvent.MESS_VERIFIED, { actorId: session.user.id, actorRole: "admin", targetId: mess.id }, log);

    await sendMailSafe(
      { to: mess.email, ...messVerifiedMail({ ownerName: mess.owner_name || mess.name, messName: mess.name, dashboardLink: getEnv().baseUrl || "/" }) },
      log,
    );
    return json({ message: "Verified Mess" });
  },
);
