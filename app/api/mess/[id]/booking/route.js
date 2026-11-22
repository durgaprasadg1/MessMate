import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import {
  notFound,
  forbidden,
  badRequest,
} from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import {
  bookingCreateSchema,
  paymentVerifySchema,
} from "@/lib/server/validation/schemas";
import { messRepository } from "@/lib/server/repositories/messes";
import { orderRepository } from "@/lib/server/repositories/orders";
import { requireActiveConsumer } from "@/lib/server/auth/guards";
import { computePricePerPlate } from "@/lib/server/services/pricing";
import {
  getPaymentGateway,
  verifyCheckoutSignature,
  newReceipt,
} from "@/lib/server/services/paymentService";
import { notifyNewOrder, notifyOwnerNewOrder } from "@/lib/notifications";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const POST = createRoute(
  {
    name: "booking.create",
    auth: "consumer",
    uuid: ["id"],
    rateLimit: { ...Limits.payment, by: "user" },
    body: bookingCreateSchema,
  },
  async ({ params, session, body }) => {
    await requireActiveConsumer(
      session,
      "Your account is blocked by admin due to your activities. You cannot create bookings.",
    );

    const mess = await messRepository.getForBooking(params.id);
    if (!mess) throw notFound("Mess not found");
    if (mess.is_blocked || mess.is_open === false)
      throw forbidden("This mess is not accepting bookings right now.");

    const { pricePerPlate, dishName } = await computePricePerPlate(
      mess,
      body.menutype,
      body.selectedDish,
    );
    if (!pricePerPlate || pricePerPlate <= 0)
      throw badRequest("Cannot determine price for selected dish");

    const amount = Math.round(pricePerPlate * 100 * body.noOfPlate);
    const rOrder = await getPaymentGateway().createOrder({
      amount,
      receipt: newReceipt("receipt"),
    });

    const dbOrder = await orderRepository.create({
      mess_id: mess.id,
      consumer_id: session.user.id,
      total_price: amount,
      razorpay_order_id: rOrder.id,
      status: "created",
      no_of_plate: body.noOfPlate,
      selected_dish_name: dishName || String(body.selectedDish ?? ""),
      selected_dish_price: pricePerPlate,
      mess_name: mess.name,
    });

    return json({
      message: "Order created",
      order: rOrder,
      dbOrderId: dbOrder.id,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  },
);

export const PATCH = createRoute(
  {
    name: "booking.verify",
    auth: "consumer",
    uuid: ["id"],
    rateLimit: { ...Limits.payment, by: "user" },
    body: paymentVerifySchema,
  },
  async ({ params, session, body, log }) => {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      dbOrderId,
    } = body;

    const dbOrder = dbOrderId
      ? await orderRepository.findById(dbOrderId)
      : await orderRepository.findByRazorpayOrderId(orderId);
    if (!dbOrder || dbOrder.mess_id !== params.id)
      throw notFound("Order not found");
    if (dbOrder.consumer_id !== session.user.id)
      throw forbidden("Unauthorized");
    if (dbOrder.razorpay_order_id !== orderId)
      throw badRequest("Order mismatch");

    await requireActiveConsumer(
      session,
      "Your account is blocked by admin due to your activities. You cannot pay for bookings.",
    );

    if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
      await orderRepository.markFailed(dbOrder.id);
      audit(
        AuditEvent.PAYMENT_SIGNATURE_INVALID,
        { actorId: session.user.id, targetId: dbOrder.id },
        log,
      );
      throw badRequest("Invalid signature");
    }

    const transitioned = await orderRepository.markPaidIfPending(dbOrder.id, {
      paymentId,
      signature,
    });
    audit(
      AuditEvent.PAYMENT_VERIFIED,
      {
        actorId: session.user.id,
        targetId: dbOrder.id,
        firstTime: transitioned,
      },
      log,
    );

    if (transitioned) {
      try {
        const mess = await messRepository.getWithOwner(dbOrder.mess_id);
        const consumer = await requireActiveConsumer(session);
        await notifyNewOrder(
          dbOrder.id,
          dbOrder.consumer_id,
          dbOrder.mess_id,
          mess?.name || "the mess",
        );
        if (mess?.owner)
          await notifyOwnerNewOrder(
            dbOrder.id,
            mess.owner.id,
            dbOrder.mess_id,
            consumer.username || "A customer",
          );
      } catch (err) {
        log.warn("Notification failed", { err });
      }
      await deleteCacheKeys([
        cacheKeys.messOrders(dbOrder.mess_id),
        cacheKeys.consumerHistory(dbOrder.consumer_id),
        cacheKeys.messAnalytics(dbOrder.mess_id),
      ]);
    }
    return json({
      message: "Payment verified",
      order: { id: dbOrder.id, status: "paid" },
    });
  },
);
