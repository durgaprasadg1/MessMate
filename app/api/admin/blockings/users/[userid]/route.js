import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { toConsumerDto } from "@/lib/server/repositories/dto";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { sendMailSafe } from "@/lib/server/mail/mailer";
import { accountBlockedMail } from "@/lib/server/mail/templates";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const PATCH = createRoute(
  { name: "admin.user.block", auth: "admin", uuid: ["userid"], rateLimit: { ...Limits.admin, by: "user" }, bodyType: "none" },
  async ({ params, session, log }) => {
    const consumer = await consumerRepository.findById(params.userid, "id, username, email, is_blocked");
    if (!consumer) throw notFound("consumer not found");

    const updated = await consumerRepository.setBlocked(consumer.id, !consumer.is_blocked);
    await deleteCacheKeys([cacheKeys.consumerProfile(consumer.id), cacheKeys.consumersAll(), cacheKeys.adminUsers()]);
    audit(AuditEvent.USER_BLOCK_TOGGLED, { actorId: session.user.id, actorRole: "admin", targetId: consumer.id, blocked: updated.is_blocked }, log);

    if (updated.is_blocked) {
      await sendMailSafe({ to: consumer.email, ...accountBlockedMail({ name: consumer.username }) }, log);
    }

    return json({
      message: updated.is_blocked ? "User Blocked" : "User Unblocked",
      user: { ...toConsumerDto(updated), isBlocked: updated.is_blocked },
    });
  },
);
