import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createReviewSchema = z.object({
  feedback: z.string().min(3).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  author: objectId.optional(),
  mess: objectId.optional(),
});

export const updateReviewSchema = createReviewSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default { createReviewSchema, updateReviewSchema, validate };
