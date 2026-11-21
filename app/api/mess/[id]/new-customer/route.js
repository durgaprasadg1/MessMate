import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound, forbidden, badRequest } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { newCustomerSchema, newCustomerPatchSchema } from "@/lib/server/validation/schemas";
import { messRepository } from "@/lib/server/repositories/messes";
import { registrationRepository } from "@/lib/server/repositories/registrations";
import { consumerRepository } from "@/lib/server/repositories/accounts";
import { requireActiveConsumer } from "@/lib/server/auth/guards";
import { getPaymentGateway, verifyCheckoutSignature, newReceipt } from "@/lib/server/services/paymentService";
import { isMembershipPaymentComplete, remainingDays } from "@/lib/server/services/membership";
import { sendMailSafe } from "@/lib/server/mail/mailer";
import { monthlyRequestMail, paymentSuccessMail } from "@/lib/server/mail/templates";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

const RAZORPAY_MIN_AMOUNT_PAISE = 100;
const FOOD_MAP = { veg: "Veg", both: "Both", nonveg: "Non-Veg", "non-veg": "Non-Veg" };

const overlaps = (existing, requested) => {
  const hasDay = (d) => d === "Day" || d === "Day + Night";
  const hasNight = (d) => d === "Night" || d === "Day + Night";
  return (hasDay(existing) && hasDay(requested)) || (hasNight(existing) && hasNight(requested));
};

export const POST = createRoute(
  { name: "registration.create", auth: "consumer", uuid: ["id"], rateLimit: { ...Limits.payment, by: "user" }, body: newCustomerSchema },
  async ({ params, session, body, log }) => {
    const consumer = await requireActiveConsumer(session, "Your account is blocked by admin. You cannot register for a mess.");

    const mess = await messRepository.getForBooking(params.id);
    if (!mess) throw notFound("Mess not found");
    if (mess.is_blocked) throw forbidden("This mess is not accepting registrations right now.");

    const all = (await registrationRepository.listForConsumer(session.user.id, "mess:mess_id(monthly_mess_duration)")).filter(
      isMembershipPaymentComplete,
    );
    const active = all.filter((reg) => remainingDays(reg, reg.mess?.monthly_mess_duration || 30) > 0);

    const sameMess = all.find((r) => r.mess_id === params.id);
    if (sameMess) {
      const remaining = remainingDays(sameMess, sameMess.mess?.monthly_mess_duration || 30);
      if (remaining > 0 && overlaps(sameMess.duration, body.duration)) {
        throw forbidden(
          `You are already registered in this mess for ${sameMess.duration} with ${remaining} day(s) remaining. You cannot register for the same meal time again.`,
        );
      }
    }

    const hasDay = active.some((r) => r.duration === "Day" || r.duration === "Day + Night");
    const hasNight = active.some((r) => r.duration === "Night" || r.duration === "Day + Night");
    if (body.duration === "Day" && hasDay)
      throw forbidden("You are already registered for Day meal time. Please cancel your existing Day registration first.");
    if (body.duration === "Night" && hasNight)
      throw forbidden("You are already registered for Night meal time. Please cancel your existing Night registration first.");
    if (body.duration === "Day + Night" && (hasDay || hasNight))
      throw forbidden("You cannot register for Day + Night because you already have a Day or Night registration. Please cancel your existing registration first.");

    if (body.emergencyContact && !/^[6-9]\d{9}$/.test(body.emergencyContact)) throw badRequest("Invalid emergency contact number");

    const mappedFood = FOOD_MAP[(body.foodPreference || "").trim().toLowerCase()] || null;
    if (body.foodPreference && !mappedFood) throw badRequest("Invalid food preference");
    if (body.foodPreference) {
      const cat = mess.category?.toLowerCase();
      const pref = body.foodPreference.toLowerCase();
      if (cat === "veg" && pref !== "veg") throw badRequest("This is a vegetarian mess. You can only select 'Veg' as your food preference.");
      if (cat === "non-veg" && pref === "veg") throw badRequest("This is a non-vegetarian mess. Vegetarian options may not be available.");
    }

    // Amount is computed server-side from the mess's configured fee.
    let amountRupees = Number(mess.monthly_mess_fee || 0);
    if (body.duration === "Day + Night") amountRupees *= 2;

    const base = {
      consumer_id: consumer.id,
      customers: [consumer.id],
      mess_id: params.id,
      duration: body.duration,
      phone: body.phone,
      payment_mode: body.paymentMode,
      name: body.name,
      address: body.address,
      gender: body.gender || null,
      college: body.college,
      food_preference: mappedFood,
      emergency_contact: body.emergencyContact || null,
      joining_date: new Date().toISOString(),
      total_amount: amountRupees,
    };

    if (body.paymentMode === "upi") {
      const amount = Math.round(amountRupees * 100);
      if (amount < RAZORPAY_MIN_AMOUNT_PAISE) {
        throw badRequest("Online payment amount is too low. Please choose cash payment or contact the mess owner.");
      }
      const rOrder = await getPaymentGateway().createOrder({ amount, receipt: newReceipt("mess_reg") });
      const reg = await registrationRepository.create({
        ...base,
        razorpay_order_id: rOrder.id,
        payment_status: "created",
        payment_verified: false,
      });
      return json({
        message: "Order created for payment",
        order: rOrder,
        dbOrderId: reg.id,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amountRupees,
      });
    }

    const reg = await registrationRepository.create({ ...base, payment_status: "paid", payment_verified: true });
    await consumerRepository.markHasMonthlyMess(consumer.id);
    await deleteCacheKeys([cacheKeys.consumerProfile(consumer.id), cacheKeys.consumerMonthly(consumer.id)]);
    audit(AuditEvent.REGISTRATION_CHANGED, { actorId: consumer.id, targetId: reg.id, action: "create-cash" }, log);

    await sendMailSafe({ to: consumer.email, ...monthlyRequestMail({ name: consumer.username, messName: mess.name }) }, log);
    return json({ message: "New Customer Added Successfully.", customer: reg });
  },
);

export const PATCH = createRoute(
  { name: "registration.verify", auth: "consumer", uuid: ["id"], rateLimit: { ...Limits.payment, by: "user" }, body: newCustomerPatchSchema },
  async ({ params, session, body, log }) => {
    const consumer = await requireActiveConsumer(session, "Your account is blocked.");

    if (body.action === "cancel") {
      const pending = await registrationRepository.findById(body.dbOrderId, "id, mess_id, consumer_id, payment_status, payment_verified");
      if (!pending) throw notFound("Registration not found");
      if (pending.consumer_id !== session.user.id) throw forbidden("Unauthorized");
      if (pending.payment_verified || pending.payment_status === "paid") {
        return json({ message: "Payment already completed for this registration." }, 409);
      }
      await registrationRepository.delete(pending.id);
      return json({ message: "Payment cancelled. Registration request was not submitted." });
    }

    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature, dbOrderId } = body;
    const reg = dbOrderId
      ? await registrationRepository.findById(dbOrderId, "id, mess_id, consumer_id, razorpay_order_id, total_amount, duration")
      : await registrationRepository.findByRazorpayOrderId(orderId);
    if (!reg || reg.mess_id !== params.id) throw notFound("Registration not found");
    if (reg.consumer_id !== session.user.id) throw forbidden("Unauthorized");
    if (reg.razorpay_order_id !== orderId) throw badRequest("Order mismatch");

    if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
      await registrationRepository.markFailed(reg.id);
      audit(AuditEvent.PAYMENT_SIGNATURE_INVALID, { actorId: consumer.id, targetId: reg.id }, log);
      throw badRequest("Invalid payment signature");
    }

    const transitioned = await registrationRepository.markPaidIfPending(reg.id, { paymentId, signature });
    audit(AuditEvent.PAYMENT_VERIFIED, { actorId: consumer.id, targetId: reg.id, firstTime: transitioned }, log);

    if (transitioned) {
      await consumerRepository.markHasMonthlyMess(consumer.id);
      await deleteCacheKeys([cacheKeys.consumerProfile(consumer.id), cacheKeys.consumerMonthly(consumer.id)]);
      const mess = await messRepository.getOwnership(reg.mess_id);
      await sendMailSafe(
        {
          to: consumer.email,
          ...paymentSuccessMail({
            name: consumer.username,
            messName: mess?.name,
            paymentId,
            orderId,
            amount: reg.total_amount,
            duration: reg.duration,
          }),
        },
        log,
      );
    }

    const customer = (await registrationRepository.listDetailedForConsumer(consumer.id)).find((r) => r.id === reg.id);
    return json({ message: "Payment verified successfully. Registration complete.", customer });
  },
);
