import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound, forbidden } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { registrationPatchSchema, registrationDeleteSchema } from "@/lib/server/validation/schemas";
import { registrationRepository } from "@/lib/server/repositories/registrations";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { requireMessOwner } from "@/lib/server/auth/guards";
import { isMembershipPaymentComplete } from "@/lib/server/services/membership";
import { sendMailSafe } from "@/lib/server/mail/mailer";
import { registrationApprovedMail, registrationDisabledMail, registrationExtendedMail, registrationRemovedMail } from "@/lib/server/mail/templates";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

// NOTE: `[id]` is the MESS id (the owner dashboard links here with a mess id).
const COMMON = { auth: "owner", uuid: ["id"] };

const normalize = (r) => ({
  ...r,
  _id: r.id,
  joiningDate: r.joining_date,
  foodPreference: r.food_preference,
  phoneNum: r.phone,
  isAllowed: Boolean(r.is_allowed),
  paymentMode: r.payment_mode,
  paymentVerified: r.payment_verified === true,
  razorpayOrderId: r.razorpay_order_id,
  totalAmount: r.total_amount ?? null,
  paymentStatus: r.payment_status,
});

/** The registration must belong to the mess the caller owns (closes the IDOR). */
async function loadRegistrationOfMess(messId, regId) {
  const reg = await registrationRepository.findById(regId);
  if (!reg || reg.mess_id !== messId) throw notFound("User not found");
  return reg;
}

async function memberOf(reg) {
  const ids = Array.isArray(reg.customers) ? reg.customers : reg.customers?.ids || [];
  const consumerId = reg.consumer_id || ids[0];
  return consumerId ? consumerRepository.findById(consumerId, "id, username, email") : null;
}

export const GET = createRoute({ name: "owner.registrations.list", ...COMMON }, async ({ params, session }) => {
  const mess = await requireMessOwner(session, params.id);
  const regs = (await registrationRepository.listForMess(mess.id)).filter(isMembershipPaymentComplete).map(normalize);
  return json({ newMessCustomer: regs });
});

export const PATCH = createRoute(
  { name: "owner.registrations.update", ...COMMON, rateLimit: { ...Limits.mail, name: "reg-update", limit: 60, by: "user" }, body: registrationPatchSchema },
  async ({ params, session, body, log }) => {
    const mess = await requireMessOwner(session, params.id);
    const regId = body.userId || body.id || body._id;
    const reg = await loadRegistrationOfMess(mess.id, regId);
    const member = await memberOf(reg);

    const joiningDate = body.joiningDate || body.joining_date;
    const allow = typeof body.allow === "boolean" ? body.allow : typeof body.isAllowed === "boolean" ? body.isAllowed : undefined;
    const addDays = body.addDays ?? body.add_days;
    const fields = {};

    if (joiningDate) {
      const d = new Date(joiningDate);
      if (Number.isNaN(d.getTime())) throw forbidden("Invalid joining date");
      fields.joining_date = d.toISOString();
    }

    if (typeof allow === "boolean") {
      fields.is_allowed = allow;
      if (member?.email) {
        const mail = allow
          ? registrationApprovedMail({ name: member.username, messName: mess.name })
          : registrationDisabledMail({ name: member.username, messName: mess.name });
        await sendMailSafe({ to: member.email, ...mail }, log);
      }
    }

    if (addDays) {
      const base = new Date(reg.joining_date || Date.now());
      base.setDate(base.getDate() + Number(addDays));
      fields.joining_date = base.toISOString();
      if (member?.email) {
        await sendMailSafe({ to: member.email, ...registrationExtendedMail({ name: member.username, messName: mess.name, days: addDays }) }, log);
      }
    }

    const updated = await registrationRepository.update(reg.id, fields);
    await deleteCacheKeys([cacheKeys.consumerMonthly(reg.consumer_id)]);
    audit(AuditEvent.REGISTRATION_CHANGED, { actorId: session.user.id, targetId: reg.id, action: "update", fields: Object.keys(fields) }, log);
    return json({ message: "Updated successfully", updated });
  },
);

export const DELETE = createRoute({ name: "owner.registrations.delete", ...COMMON, body: registrationDeleteSchema }, async ({ params, session, body, log }) => {
  const mess = await requireMessOwner(session, params.id);
  const reg = await loadRegistrationOfMess(mess.id, body.userId || body.id || body._id);
  const member = await memberOf(reg);

  await registrationRepository.delete(reg.id);
  await deleteCacheKeys([cacheKeys.consumerMonthly(reg.consumer_id)]);
  audit(AuditEvent.REGISTRATION_CHANGED, { actorId: session.user.id, targetId: reg.id, action: "delete" }, log);

  if (member?.email) {
    await sendMailSafe({ to: member.email, ...registrationRemovedMail({ name: member.username, messName: mess.name }) }, log);
  }
  return json({ message: "User deleted successfully" });
});
