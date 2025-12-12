import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createWastageSchema = z.object({
  mess: objectId,
  date: z.date(),
  plateName: z.string().optional(),
  cookedQty: z.number().min(0, "Cooked quantity must be non-negative"),
  servedQty: z.number().min(0, "Served quantity must be non-negative"),
  notes: z.string().optional(),
});

export const updateWastageSchema = createWastageSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default { createWastageSchema, updateWastageSchema, validate };
