import supabase from "./supabaseClient.js";
import logger from "./server/logging/logger.js";
import { emitToUser } from "./socket";
import { deleteCacheKeys } from "./redis";
import { cacheKeys } from "./server/cache/cacheKeys.js";

const log = logger.child({ module: "notifications" });

export async function createNotification({ recipientId, recipientModel, type, title, message, orderId, messId, metadata = {} }) {
  const { data: notification, error } = await supabase
    .from("notification")
    .insert({
      recipient_id: recipientId,
      recipient_model: recipientModel,
      type,
      title,
      message,
      order_id: orderId,
      mess_id: messId,
      metadata,
    })
    .select("id, type, title, message, order_id, mess_id, is_read, created_at")
    .single();
  if (error) {
    log.error("Error creating notification", { err: error });
    throw error;
  }

  await deleteCacheKeys([cacheKeys.notifications(String(recipientId))]);
  try {
    emitToUser(String(recipientId), "notification", {
      _id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      orderId: notification.order_id || null,
      messId: notification.mess_id || null,
      isRead: notification.is_read ?? false,
      createdAt: notification.created_at,
    });
  } catch (socketError) {
    log.warn("Socket emit failed", { err: socketError });
  }
  return notification;
}

export const notifyNewOrder = (orderId, consumerId, messId, messName) =>
  createNotification({
    recipientId: consumerId,
    recipientModel: "Consumer",
    type: "new_order",
    title: "Order Placed Successfully",
    message: `Your order has been placed at ${messName}. The owner will confirm it soon.`,
    orderId,
    messId,
  });

export const notifyOwnerNewOrder = (orderId, ownerId, messId, consumerName) =>
  createNotification({
    recipientId: ownerId,
    recipientModel: "Owner",
    type: "new_order",
    title: "New Order Received",
    message: `${consumerName} has placed a new order. Please review and confirm.`,
    orderId,
    messId,
  });

export const notifyOrderCancelled = (orderId, recipientId, recipientModel, messId, messName, cancelledBy) =>
  createNotification({
    recipientId,
    recipientModel,
    type: "order_cancelled",
    title: "Order Cancelled",
    message: `Order at ${messName} has been cancelled by ${cancelledBy}.`,
    orderId,
    messId,
  });

export const notifyOrderCompleted = (orderId, consumerId, messId, messName) =>
  createNotification({
    recipientId: consumerId,
    recipientModel: "Consumer",
    type: "order_completed",
    title: "Order Completed",
    message: `Your order at ${messName} has been marked as completed. Enjoy your meal!`,
    orderId,
    messId,
  });

export const notifyOrderTaken = (orderId, consumerId, messId, messName) =>
  createNotification({
    recipientId: consumerId,
    recipientModel: "Consumer",
    type: "order_taken",
    title: "Order Confirmed",
    message: `Your order at ${messName} has been confirmed by the owner. It's being prepared!`,
    orderId,
    messId,
  });

export const notifyOrderRefunded = (orderId, consumerId, messId, messName, amount) =>
  createNotification({
    recipientId: consumerId,
    recipientModel: "Consumer",
    type: "order_refunded",
    title: "Refund Processed",
    message: `Your refund of ₹${amount} for the order at ${messName} has been processed successfully.`,
    orderId,
    messId,
    metadata: { amount },
  });
