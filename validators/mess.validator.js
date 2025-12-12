import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const itemSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  price: z.number().nullable().optional(),
  isLimited: z.boolean().optional(),
  limitCount: z.number().nullable().optional(),
});

const dishSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  price: z.number().nullable().optional(),
  items: z.array(itemSchema).optional(),
});

export const createMessSchema = z.object({
  name: z.string().min(3, "name must be at least 3 characters"),
  description: z.string().optional(),
  image: z
    .object({
      url: z.string().optional(),
      filename: z.string().optional(),
      public_id: z.string().optional(),
    })
    .optional(),
  email: z
    .string()
    .email("Invalid email")
    .min(3, "Email must be at least 3 characters"),
  upi: z.string().min(5, "UPI must be at least 5 characters"),
  address: z.string().optional(),
  mealTime: z.string().optional(),
  vegMenu: z.array(dishSchema).optional(),
  vegPrice: z.number().optional(),
  nonVegPrice: z.number().optional(),
  nonVegMenu: z.array(dishSchema).optional(),
  nonVegMenuRef: objectId.optional(),
  vegMenuRef: objectId.optional(),
  owner: objectId.optional(),
  reviews: z.array(objectId).optional(),
  orders: z.array(objectId).optional(),
  category: z.string().min(2, "category min length 2"),
  isOpen: z.boolean().optional(),
  ownerName: z.string().min(1, "ownerName required"),
  adharNumber: z.string().regex(/^\d{12}$/, "adharNumber must be 12 digits"),
  phoneNumber: z.string().regex(/^\d{10}$/, "phoneNumber must be 10 digits"),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  isLimited: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  certificate: z
    .object({
      url: z.string().optional(),
      filename: z.string().optional(),
      public_id: z.string().optional(),
    })
    .optional(),
  isBlocked: z.boolean().optional(),
  alert: z.array(objectId).optional(),
  monthlyMessDuration: z.number().min(15).max(31),
  monthlyMessFee: z.number().positive(),
  newMessCustomer: z.array(objectId).optional(),
});

export const updateMessSchema = createMessSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default { createMessSchema, updateMessSchema, validate };
