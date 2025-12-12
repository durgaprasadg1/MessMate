import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createOwnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .email("Invalid email")
    .min(3, "Email must be at least 3 characters"),
  upi: z.string().min(4, "UPI must be at least 4 characters"),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  password: z
    .string()
    .min(6, "Password should be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one special character"
    ),
  address: z.string().min(1, "Address is required"),
  messes: z.array(objectId).optional(),
});

export const updateOwnerSchema = createOwnerSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default { createOwnerSchema, updateOwnerSchema, validate };
