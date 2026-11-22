/**
 * OpenStreetMap helpers: tile URL + Nominatim search / reverse geocoding.
 * Pure URL builders and response parsers (easy to test); the fetch itself is
 * done by the map component on a user action (never in a keystroke loop, as
 * the Nominatim usage policy asks for at most one request per second).
 */
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
export const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

/** Centre of India, used until the owner searches or drops a pin. */
export const DEFAULT_CENTER = { lat: 20.5937, lon: 78.9629 };
export const DEFAULT_ZOOM = 5;
export const PIN_ZOOM = 17;

export function buildSearchUrl(query, { limit = 5, countryCodes = "in" } = {}) {
  const q = String(query || "").trim();
  if (q.length < 3) return null;
  const params = new URLSearchParams({ q, format: "jsonv2", limit: String(limit), addressdetails: "0", "accept-language": "en" });
  if (countryCodes) params.set("countrycodes", countryCodes);
  return `${NOMINATIM_BASE}/search?${params.toString()}`;
}

export function buildReverseUrl(lat, lon) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), format: "jsonv2", zoom: "18", "accept-language": "en" });
  return `${NOMINATIM_BASE}/reverse?${params.toString()}`;
}

/** Nominatim returns lat/lon as strings; keep only valid results. */
export function parseSearchResults(payload) {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((r) => ({ lat: Number(r.lat), lon: Number(r.lon), label: String(r.display_name || "").slice(0, 200) }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon) && r.label);
}

export function parseReverseResult(payload) {
  const label = typeof payload?.display_name === "string" ? payload.display_name.slice(0, 300) : "";
  return label || null;
}

/** 5 decimals ~ 1 m precision. */
export const roundCoordinate = (n) => Math.round(Number(n) * 1e5) / 1e5;
