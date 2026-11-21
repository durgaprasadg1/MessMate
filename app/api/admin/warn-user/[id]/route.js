import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { sendMailSafe } from "@/lib/server/mail/mailer";
import { warningMail } from "@/lib/server/mail/templates";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const POST = createRoute(
  { name: "admin.warn-user", auth: "admin", uuid: ["id"], rateLimit: { ...Limits.mail, by: "user" }, bodyType: "none" },
  async ({ params, session, log }) => {
    const consumer = await consumerRepository.findById(params.id, "id, username, email");
    if (!consumer) throw notFound("consumer not found");
    await sendMailSafe({ to: consumer.email, ...warningMail({ name: consumer.username }) }, log);
    audit(AuditEvent.WARNING_SENT, { actorId: session.user.id, actorRole: "admin", targetId: consumer.id, kind: "consumer" }, log);
    return json({ message: "User warning sent" });
  },
);
