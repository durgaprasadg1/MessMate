import supabase from "@/lib/supabaseClient";
import { emitToUser } from "./socket";

export async function createNotification({
  recipientId,
  recipientModel,
  type,
  title,
  message,
  orderId,
  messId,
  metadata = {},
}) {
  try {
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
      .select()
      .single();
    if (error) throw error;

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
      console.error("Socket emit failed:", socketError);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export async function notifyNewOrder(orderId, consumerId, messId, messName) {
  return createNotification({
    recipientId: consumerId,
    recipientModel: "Consumer",
    type: "new_order",
    title: "Order Placed Successfully",
    message: `Your order has been placed at ${messName}. The owner will confirm it soon.`,
    orderId,
    messId,
  });
}

export async function notifyOwnerNewOrder(
  orderId,
  ownerId,
  messId,
  consumerName
) {
  return createNotification({
    recipientId: ownerId,
    recipientModel: "Owner",
    type: "new_order",
    title: "New Order Received",
    message: `${consumerName} has placed a new order. Please review and confirm.`,
    orderId,
    messId,
  });
}

export async function notifyOrderCancelled(
  orderId,
  recipientId,
  recipientModel,
  messId,
  messName,
  cancelledBy
) {
  return createNotification({
    recipientId,
    recipientModel,
    type: "order_cancelled",
    title: "Order Cancelled",
    message: `Order at ${messName} has been cancelled by ${cancelledBy}.`,
    orderId,
    messId,
  });
}

export async function notifyOrderCompleted(
  orderId,
  consumerId,
  messId,
  messName
) {
  return createNotification({
    recipientId: consumerId,
    recipientModel: "Consumer",
    type: "order_completed",
    title: "Order Completed",
    message: `Your order at ${messName} has been marked as completed. Enjoy your meal!`,
    orderId,
    messId,
  });
}

export async function notifyOrderTaken(orderId, consumerId, messId, messName) {
  return createNotification({
    recipientId: consumerId,
    recipientModel: "Consumer",
    type: "order_taken",
    title: "Order Confirmed",
    message: `Your order at ${messName} has been confirmed by the owner. It's being prepared!`,
    orderId,
    messId,
  });
}

export async function notifyOrderRefunded(
  orderId,
  consumerId,
  messId,
  messName,
  amount
) {
  return createNotification({
    recipientId: consumerId,
    recipientModel: "Consumer",
    type: "order_refunded",
    title: "Refund Processed",
    message: `Your refund of ₹${amount} for the order at ${messName} has been processed successfully.`,
    orderId,
    messId,
    metadata: { amount },
  });
}
