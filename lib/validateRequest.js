import { z } from "zod";

/**
 * Validate data against a Zod schema and return a normalized result.
 * @param {z.ZodTypeAny} schema
 * @param {any} data
 * @returns {{ ok: boolean, data?: any, errors?: any }}
 */
export function validateAgainst(schema, data) {
  const res = schema.safeParse(data);
  if (res.success) return { ok: true, data: res.data };
  return { ok: false, errors: res.error.flatten() };
}

/**
 * Express middleware generator to validate req.body
 * Usage: router.post('/', validateBody(schema), handler)
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = validateAgainst(schema, req.body);
    if (!result.ok) {
      return res.status(400).json({ success: false, errors: result.errors });
    }
    // attach validated payload
    req.validatedBody = result.data;
    return next();
  };
}

export default { validateAgainst, validateBody };
