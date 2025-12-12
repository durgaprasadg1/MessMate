import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createOrderSchema = z.object({
  consumer: objectId,
  mess: objectId,
  totalPrice: z.number().nonnegative(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  status: z
    .enum(["created", "pending", "paid", "failed", "refunded", "completed"])
    .optional(),
  paymentVerified: z.boolean().optional(),
  noOfPlate: z.number().int().min(1).optional(),
  selectedDishName: z.string().optional(),
  selectedDishPrice: z.number().optional(),
  messName: z.string().optional(),
  done: z.boolean().optional(),
  isTaken: z.boolean().optional(),
  notified: z.boolean().optional(),
  consumerSubscription: z.any().optional(),
  isCancelled: z.boolean().optional(),
  refundInitiated: z.boolean().optional(),
});

export const updateOrderSchema = createOrderSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default { createOrderSchema, updateOrderSchema, validate };
