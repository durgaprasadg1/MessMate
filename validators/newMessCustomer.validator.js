import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createNewMessCustomerSchema = z.object({
  customer: z.array(objectId).min(1, "At least one customer is required"),
  mess: objectId,
  duration: z.enum(["Day", "Night", "Day + Night"], {
    errorMap: () => ({
      message: "Duration must be Day, Night, or Day + Night",
    }),
  }),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  paymentMode: z.enum(["upi", "cash"], {
    errorMap: () => ({ message: "Payment mode must be upi or cash" }),
  }),
  name: z.string().min(1, "Name is required").trim(),
  address: z.string().trim().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  college: z.string().trim().optional(),
  joiningDate: z.date().optional(),
  foodPreference: z.enum(["Veg", "Non-Veg", "Both"]).optional(),
  emergencyContact: z
    .string()
    .regex(/^[0-9]{10}$/, "Emergency contact must be 10 digits")
    .optional(),
  isAllowed: z.boolean().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  paymentVerified: z.boolean().optional(),
  totalAmount: z.number().optional(),
  paymentStatus: z.enum(["pending", "created", "paid", "failed"]).optional(),
});

export const updateNewMessCustomerSchema =
  createNewMessCustomerSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default {
  createNewMessCustomerSchema,
  updateNewMessCustomerSchema,
  validate,
};
