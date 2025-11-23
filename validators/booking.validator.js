import { z } from "zod";

export const bookingCreateSchema = z.object({
  noOfPlate: z.number().int().min(1).optional(),
  menutype: z.string().optional(),
  selectedDish: z.union([z.string(), z.number()]).optional(),
});

export const bookingPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  dbOrderId: z.string().optional(),
});

export default { bookingCreateSchema, bookingPaymentSchema };
