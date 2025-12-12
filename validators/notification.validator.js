import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createNotificationSchema = z.object({
  recipient: objectId,
  recipientModel: z.enum(["Consumer", "Owner"], {
    errorMap: () => ({ message: "Recipient model must be Consumer or Owner" }),
  }),
  type: z.enum(
    [
      "new_order",
      "order_cancelled",
      "order_completed",
      "order_taken",
      "order_refunded",
    ],
    {
      errorMap: () => ({ message: "Invalid notification type" }),
    }
  ),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  orderId: objectId.optional(),
  messId: objectId.optional(),
  isRead: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateNotificationSchema = createNotificationSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default { createNotificationSchema, updateNotificationSchema, validate };
