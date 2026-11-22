import { describe, it, expect } from "vitest";
import { buildSearchUrl, buildReverseUrl, parseSearchResults, parseReverseResult, roundCoordinate, OSM_TILE_URL } from "@/lib/osm.js";

describe("OSM helpers", () => {
  it("uses the standard OSM tile server", () => {
    expect(OSM_TILE_URL).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
  });
  it("builds a Nominatim search url and rejects tiny queries", () => {
    const url = new URL(buildSearchUrl("  FC Road Pune "));
    expect(url.origin).toBe("https://nominatim.openstreetmap.org");
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toBe("FC Road Pune");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect(buildSearchUrl("ab")).toBeNull();
    expect(buildSearchUrl("")).toBeNull();
  });
  it("encodes user input safely", () => {
    const url = buildSearchUrl("a&b=c#d");
    expect(new URL(url).searchParams.get("q")).toBe("a&b=c#d");
  });
  it("builds a reverse url", () => {
    const url = new URL(buildReverseUrl(18.52043, 73.85674));
    expect(url.pathname).toBe("/reverse");
    expect(url.searchParams.get("lat")).toBe("18.52043");
  });
  it("parses and filters results", () => {
    const parsed = parseSearchResults([
      { lat: "18.5", lon: "73.8", display_name: "Pune, Maharashtra" },
      { lat: "x", lon: "73.8", display_name: "broken" },
      { lat: "1", lon: "2" },
    ]);
    expect(parsed).toEqual([{ lat: 18.5, lon: 73.8, label: "Pune, Maharashtra" }]);
    expect(parseSearchResults(null)).toEqual([]);
  });
  it("parses reverse geocoding and rounds coordinates", () => {
    expect(parseReverseResult({ display_name: "Somewhere" })).toBe("Somewhere");
    expect(parseReverseResult({})).toBeNull();
    expect(roundCoordinate(18.520439999)).toBe(18.52044);
  });
});
