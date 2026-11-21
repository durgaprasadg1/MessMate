import { z } from "zod";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (v) => typeof v === "string" && UUID_RE.test(v);
export const uuidSchema = z.string().refine(isUuid, "Invalid id");
