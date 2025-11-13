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

export const createMenuSchema = z.object({
  mess: objectId,
  menutype: z.enum(["vegMenu", "nonVegMenu"]),
  mealTime: z.string().optional(),
  dishes: z.array(dishSchema).optional(),
});

export const updateMenuSchema = createMenuSchema.partial();

export function validate(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { success: true, data: res.data };
  return { success: false, errors: res.error.flatten() };
}

export default { createMenuSchema, updateMenuSchema, validate };
