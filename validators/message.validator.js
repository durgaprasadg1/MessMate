import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  toMess: objectId,
});

export const updateMessageSchema = createMessageSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default { createMessageSchema, updateMessageSchema, validate };
