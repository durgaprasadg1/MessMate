import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createConsumerSchema = z.object({
  username: z.string().min(1, "username is required"),
  email: z.string().email("Invalid email"),
  address: z.string().min(2, "address should be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  password: z.string().min(6, "password should be at least 6 characters"),
  mess: z.array(objectId).optional(),
});

export const updateConsumerSchema = createConsumerSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default { createConsumerSchema, updateConsumerSchema, validate };
