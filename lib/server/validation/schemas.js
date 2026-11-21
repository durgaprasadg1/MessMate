/**
 * Request schemas (zod). Strings are trimmed and length-capped so stored text
 * cannot be abused for storage bloat; HTML is escaped at output time
 * (React escapes by default, e-mail templates use escapeHtml).
 */
import { z } from "zod";
import { passwordSchema } from "../auth/passwordPolicy.js";

const text = (max, min = 1) => z.string().trim().min(min).max(max);
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const phoneSchema = z.string().trim().regex(/^[0-9]{10}$/, "Phone number must be 10 digits.");
export const mobileSchema = z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid phone number");
export const upiSchema = z.string().trim().regex(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, "Invalid UPI/VPA ID format.").max(50);

export const consumerSignupSchema = z.object({
  username: text(80, 3),
  email: emailSchema,
  phoneNumber: phoneSchema,
  address: text(300, 6),
  password: passwordSchema,
});

export const ownerSignupSchema = consumerSignupSchema.extend({ upi: upiSchema });

export const adminCreateSchema = z.object({
  name: text(80, 3),
  email: emailSchema,
  phoneNumber: phoneSchema,
  address: text(300, 3),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({ password: passwordSchema });

export const consumerUpdateSchema = z.object({
  username: text(80, 3),
  address: text(300, 3),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
});

export const messInfoUpdateSchema = z.object({
  name: text(120),
  address: z.string().trim().max(300).optional(),
  phoneNumber: phoneSchema,
  category: text(30),
  limits: z
    .union([z.boolean(), z.enum(["true", "false", ""])])
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : v === true || v === "true")),
  description: z.string().trim().max(1000).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: text(1000),
});

export const adminMessageSchema = z.object({ message: text(1000) });

export const bookingCreateSchema = z.object({
  noOfPlate: z.coerce.number().int().min(1).max(50).default(1),
  menutype: z.enum(["vegMenu", "nonVegMenu"]).default("vegMenu"),
  selectedDish: z.union([z.string().max(200), z.number()]).optional(),
});

export const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(256),
  dbOrderId: z.string().uuid().optional(),
});

export const orderActionSchema = z.object({
  action: z.enum(["cancel", "take", "refund", "returnPayment", "markDone"]),
});

export const menuSchema = z.object({
  mealTime: z.string().trim().max(100).optional(),
  menutype: z.enum(["vegMenu", "nonVegMenu"]),
  dishes: z.array(z.any()).max(100).default([]),
  price: z.union([z.number(), z.string()]).optional(),
  replace: z.boolean().optional(),
  deletedDishIds: z.array(z.any()).optional(),
});

export const newCustomerSchema = z.object({
  name: text(100),
  phone: mobileSchema,
  address: z.string().trim().max(300).optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable().or(z.literal("")),
  college: z.string().trim().max(150).optional().nullable(),
  duration: z.enum(["Day", "Night", "Day + Night"]),
  foodPreference: z.string().trim().max(20).optional().nullable(),
  emergencyContact: z.string().trim().max(10).optional().nullable().or(z.literal("")),
  paymentMode: z.string().trim().toLowerCase().pipe(z.enum(["upi", "cash"])),
});

export const newCustomerPatchSchema = z.union([
  z.object({ action: z.literal("cancel"), dbOrderId: z.string().uuid() }),
  paymentVerifySchema.extend({ action: z.undefined().optional() }),
]);

export const registrationPatchSchema = z
  .object({
    userId: z.string().uuid().optional(),
    id: z.string().uuid().optional(),
    _id: z.string().uuid().optional(),
    joiningDate: z.string().max(40).optional(),
    joining_date: z.string().max(40).optional(),
    allow: z.boolean().optional(),
    isAllowed: z.boolean().optional(),
    addDays: z.coerce.number().int().min(1).max(365).optional(),
    add_days: z.coerce.number().int().min(1).max(365).optional(),
  })
  .refine((v) => v.userId || v.id || v._id, { message: "User ID required" });

export const registrationDeleteSchema = z
  .object({ userId: z.string().uuid().optional(), id: z.string().uuid().optional(), _id: z.string().uuid().optional() })
  .refine((v) => v.userId || v.id || v._id, { message: "User ID missing" });

export const mfaCodeSchema = z.object({ code: z.string().trim().min(6).max(32) });
