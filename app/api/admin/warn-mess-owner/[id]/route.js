import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { ownerRepository } from "@/lib/server/repositories/accounts";
import { sendMailSafe } from "@/lib/server/mail/mailer";
import { warningMail } from "@/lib/server/mail/templates";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const POST = createRoute(
  { name: "admin.warn-owner", auth: "admin", uuid: ["id"], rateLimit: { ...Limits.mail, by: "user" }, bodyType: "none" },
  async ({ params, session, log }) => {
    const owner = await ownerRepository.findById(params.id, "id, name, email");
    if (!owner) throw notFound("owner not found");
    await sendMailSafe({ to: owner.email, ...warningMail({ name: owner.name }) }, log);
    audit(AuditEvent.WARNING_SENT, { actorId: session.user.id, actorRole: "admin", targetId: owner.id, kind: "owner" }, log);
    return json({ message: "User warning sent" });
  },
);
