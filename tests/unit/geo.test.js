import { describe, it, expect } from "vitest";
import { haversineDistance, isValidCoordinate, formatDistance, withDistances, filterByRadius, sortByDistance, EARTH_RADIUS_M } from "@/lib/geo.js";

describe("haversineDistance", () => {
  it("is zero for the same point", () => {
    expect(haversineDistance(18.5204, 73.8567, 18.5204, 73.8567)).toBeCloseTo(0, 6);
  });
  it("matches known city distances (within 0.5 %)", () => {
    // Pune -> Mumbai is about 120 km as the crow flies
    const d = haversineDistance(18.5204, 73.8567, 19.076, 72.8777);
    expect(d / 1000).toBeGreaterThan(115);
    expect(d / 1000).toBeLessThan(125);
    // London -> Paris ~ 343.5 km
    const lp = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(Math.abs(lp / 1000 - 343.5) / 343.5).toBeLessThan(0.005);
  });
  it("one degree of latitude is ~111.19 km", () => {
    expect(haversineDistance(0, 0, 1, 0) / 1000).toBeCloseTo(111.19, 1);
  });
  it("is symmetric", () => {
    expect(haversineDistance(10, 20, 30, 40)).toBeCloseTo(haversineDistance(30, 40, 10, 20), 6);
  });
  it("antipodal points are half the circumference", () => {
    expect(haversineDistance(0, 0, 0, 180)).toBeCloseTo(Math.PI * EARTH_RADIUS_M, 0);
  });
  it("handles points on the equator / prime meridian (0 is valid)", () => {
    expect(haversineDistance(0, 0, 0, 1)).toBeGreaterThan(0);
  });
  it("accepts numeric strings (coordinates come from the API as numbers or strings)", () => {
    expect(haversineDistance("18.5", "73.8", "18.6", "73.8")).toBeCloseTo(haversineDistance(18.5, 73.8, 18.6, 73.8), 6);
  });
  it("returns null for invalid input instead of NaN", () => {
    expect(haversineDistance(null, 1, 2, 3)).toBeNull();
    expect(haversineDistance("", 1, 2, 3)).toBeNull();
    expect(haversineDistance(91, 1, 2, 3)).toBeNull();
    expect(haversineDistance(1, 181, 2, 3)).toBeNull();
    expect(haversineDistance("abc", 1, 2, 3)).toBeNull();
  });
});

describe("helpers", () => {
  it("validates coordinates", () => {
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(-90, 180)).toBe(true);
    expect(isValidCoordinate(undefined, 5)).toBe(false);
    expect(isValidCoordinate(NaN, 5)).toBe(false);
  });
  it("formats distances", () => {
    expect(formatDistance(850.4)).toBe("850 m");
    expect(formatDistance(1449)).toBe("1.4 km");
    expect(formatDistance(null)).toBe("");
  });
  const messes = [
    { _id: "far", lat: 19.076, lon: 72.8777 },
    { _id: "near", lat: 18.5214, lon: 73.8577 },
    { _id: "nocoords" },
  ];
  const origin = { lat: 18.5204, lon: 73.8567 };
  it("adds distances, filters by radius and sorts nearest first", () => {
    const withD = withDistances(messes, origin);
    expect(withD.find((m) => m._id === "nocoords").distance).toBeNull();
    expect(filterByRadius(withD, 500).map((m) => m._id)).toEqual(["near"]);
    expect(sortByDistance(withD).map((m) => m._id)).toEqual(["near", "far", "nocoords"]);
  });
  it("without an origin nothing is filtered out by distance", () => {
    expect(withDistances(messes, null).every((m) => m.distance === null)).toBe(true);
    expect(filterByRadius(withDistances(messes, null), null)).toHaveLength(3);
  });
});
