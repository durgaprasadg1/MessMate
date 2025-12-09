import { connectDB } from "./mongodb";
import Notification from "@/models/notification";
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
    await connectDB();

    const notification = await Notification.create({
      recipient: recipientId,
      recipientModel,
      type,
      title,
      message,
      orderId,
      messId,
      metadata,
    });

    try {
      emitToUser(recipientId.toString(), "notification", {
        _id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        orderId: notification.orderId?.toString(),
        messId: notification.messId?.toString(),
        isRead: false,
        createdAt: notification.createdAt,
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
