import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { notFound, forbidden, badRequest } from "@/lib/server/errors/httpErrors";
import { orderActionSchema } from "@/lib/server/validation/schemas";
import { orderRepository } from "@/lib/server/repositories/orders";
import { messRepository } from "@/lib/server/repositories/messes";
import { requireMessOwner } from "@/lib/server/auth/guards";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { audit, AuditEvent } from "@/lib/server/logging/audit";
import { notifyOrderCancelled, notifyOrderCompleted, notifyOrderTaken, notifyOrderRefunded } from "@/lib/notifications";

const COMMON = { auth: "session", uuid: ["id", "orderid"] };

async function loadOrder(params) {
  const order = await orderRepository.findById(params.orderid);
  // the order must belong to the mess in the URL (prevents mixing ids)
  if (!order || order.mess_id !== params.id) throw notFound("Order not found");
  return order;
}

const safeNotify = async (fn, log) => {
  try {
    await fn();
  } catch (err) {
    log.warn("Notification failed", { err });
  }
};

export const PATCH = createRoute({ name: "order.action", ...COMMON, body: orderActionSchema }, async ({ params, session, body, log }) => {
  const order = await loadOrder(params);
  const { action } = body;
  const finish = async (message, extra = {}) => {
    await deleteCacheKeys([cacheKeys.messOrders(order.mess_id), cacheKeys.consumerHistory(order.consumer_id)]);
    audit(AuditEvent.ORDER_ACTION, { actorId: session.user.id, targetId: order.id, action }, log);
    return json({ message, ...extra });
  };

  if (action === "cancel") {
    if (order.consumer_id !== session.user.id) throw forbidden();
    if (order.is_taken) throw forbidden("Cannot cancel, order already taken");
    if (order.is_cancelled || order.done) throw badRequest("Order can no longer be cancelled");

    await orderRepository.update(order.id, {
      is_cancelled: true,
      refund_initiated: order.status === "paid",
      status: order.status === "paid" ? "failed" : order.status,
    });
    const mess = await messRepository.getWithOwner(order.mess_id);
    if (mess?.owner) {
      await safeNotify(() => notifyOrderCancelled(order.id, mess.owner.id, "Owner", order.mess_id, mess.name || "your mess", "customer"), log);
    }
    return finish("Order cancelled; refund will be started soon");
  }

  // Everything else is an owner action on a mess they own.
  const mess = await requireMessOwner(session, order.mess_id);
  if (order.is_cancelled && action !== "refund" && action !== "returnPayment") throw badRequest("Order is cancelled");

  if (action === "take") {
    await orderRepository.update(order.id, { is_taken: true });
    await safeNotify(() => notifyOrderTaken(order.id, order.consumer_id, order.mess_id, mess.name || "the mess"), log);
    return finish("Order marked as taken");
  }

  if (action === "refund" || action === "returnPayment") {
    await orderRepository.update(order.id, {
      is_cancelled: true,
      refund_initiated: true,
      status: order.status === "paid" ? "refunded" : "failed",
    });
    await safeNotify(
      () => notifyOrderRefunded(order.id, order.consumer_id, order.mess_id, mess.name || "the mess", order.total_price / 100),
      log,
    );
    return finish("Refund initiated and order marked cancelled");
  }

  // markDone
  await orderRepository.update(order.id, { done: true, status: "completed" });
  await safeNotify(() => notifyOrderCompleted(order.id, order.consumer_id, order.mess_id, mess.name || "the mess"), log);
  return finish("Order marked completed");
});

export const DELETE = createRoute({ name: "order.delete", ...COMMON, bodyType: "none" }, async ({ params, session, log }) => {
  const order = await loadOrder(params);
  await requireMessOwner(session, order.mess_id);
  if (order.done) throw badRequest("Cannot delete a completed order");
  await orderRepository.deleteOne(order.id);
  await deleteCacheKeys([cacheKeys.messOrders(order.mess_id)]);
  audit(AuditEvent.ORDER_ACTION, { actorId: session.user.id, targetId: order.id, action: "delete" }, log);
  return json({ message: "Order deleted" });
});
