import { z } from "zod";
import { emailSchema, phoneSchema, upiSchema } from "./schemas.js";

const LOCATION_REQUIRED = "Please select the mess location on the map.";

/** The owner must pick the location on the map: no silent 0,0 default any more. */
const coordinate = (min, max) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number({ error: LOCATION_REQUIRED }).min(min, LOCATION_REQUIRED).max(max, LOCATION_REQUIRED),
  );

const blankToUndefined = (v) => (v === "" || v === null || v === undefined ? undefined : v);
const optionalNumber = (schema) => z.preprocess(blankToUndefined, schema);

export const newMessFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  upi: upiSchema,
  email: emailSchema,
  description: z.string().trim().max(1000).default(""),
  address: z.string().trim().max(300).default(""),
  category: z.string().trim().min(1).max(30),
  limits: z.enum(["true", "false"]).default("true"),
  ownerName: z.string().trim().max(100).default(""),
  adharNumber: z.string().trim().regex(/^[0-9]{12}$/, "Aadhaar must be 12 digits"),
  phoneNumber: phoneSchema,
  monthlyMessFee: optionalNumber(z.coerce.number().min(0).max(100000).default(0)),
  // "0" is the UI placeholder ("Select Duration"): fall back to the 30 day default
  monthlyMessDuration: z.preprocess((v) => (Number(v) > 0 ? v : undefined), z.coerce.number().int().min(1).max(366).default(30)),
  lat: coordinate(-90, 90),
  lon: coordinate(-180, 180),
})
  // (0, 0) is the "null island" default of an unset map pin, not a real mess location
  .refine((v) => !(v.lat === 0 && v.lon === 0), { path: ["lat"], message: LOCATION_REQUIRED });
