import { describe, it, expect } from "vitest";
import { newMessFieldsSchema } from "@/lib/server/validation/messSchemas.js";

const base = {
  name: "Annapurna Mess", upi: "owner@upi", email: "o@x.com", category: "Veg", adharNumber: "123412341234",
  phoneNumber: "9876543210", monthlyMessFee: "1500", monthlyMessDuration: "30", lat: "18.52043", lon: "73.85674",
};

describe("new mess schema (map-picked location)", () => {
  it("accepts a pinned location (string form values from FormData)", () => {
    const r = newMessFieldsSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data.lat).toBeCloseTo(18.52043, 5);
    expect(r.data.lon).toBeCloseTo(73.85674, 5);
  });
  it("requires the owner to pick a location (blank or missing)", () => {
    for (const bad of [{ lat: "", lon: "" }, { lat: undefined, lon: undefined }, { lat: "18.5", lon: "" }]) {
      const r = newMessFieldsSchema.safeParse({ ...base, ...bad });
      expect(r.success).toBe(false);
      expect(r.error.issues[0].message).toBe("Please select the mess location on the map.");
    }
  });
  it("rejects the 0,0 placeholder and out-of-range values", () => {
    expect(newMessFieldsSchema.safeParse({ ...base, lat: "0", lon: "0" }).success).toBe(false);
    expect(newMessFieldsSchema.safeParse({ ...base, lat: "91", lon: "10" }).success).toBe(false);
    expect(newMessFieldsSchema.safeParse({ ...base, lat: "10", lon: "181" }).success).toBe(false);
    expect(newMessFieldsSchema.safeParse({ ...base, lat: "abc", lon: "10" }).success).toBe(false);
  });
  it("allows a real location on the equator or prime meridian", () => {
    expect(newMessFieldsSchema.safeParse({ ...base, lat: "0", lon: "10" }).success).toBe(true);
  });
  it("keeps the 30 day default when the UI placeholder (0) is sent", () => {
    expect(newMessFieldsSchema.parse({ ...base, monthlyMessDuration: "0" }).monthlyMessDuration).toBe(30);
  });
});
