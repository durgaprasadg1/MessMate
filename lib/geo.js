/**
 * Geo helpers (pure functions, shared by the UI and the tests).
 *
 * Distances use the Haversine formula: the great-circle distance between two
 * points on a sphere from their latitudes / longitudes.
 *
 *   a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
 *   d = 2 · R · atan2(√a, √(1−a))          (R = mean Earth radius, 6 371 km)
 */
export const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg) => (deg * Math.PI) / 180;

/** Finite numbers inside the valid lat/lon ranges. 0 is a valid coordinate. */
export function isValidCoordinate(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  return (
    lat !== null && lat !== undefined && lat !== "" &&
    lon !== null && lon !== undefined && lon !== "" &&
    Number.isFinite(la) && Number.isFinite(lo) &&
    la >= -90 && la <= 90 && lo >= -180 && lo <= 180
  );
}

/**
 * Great-circle distance in metres, or null when either point is invalid.
 * @param {number|string} lat1 @param {number|string} lon1
 * @param {number|string} lat2 @param {number|string} lon2
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) return null;
  const phi1 = toRad(Number(lat1));
  const phi2 = toRad(Number(lat2));
  const dPhi = toRad(Number(lat2) - Number(lat1));
  const dLambda = toRad(Number(lon2) - Number(lon1));

  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** "850 m" below 1 km, "1.4 km" above. */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || !Number.isFinite(meters)) return "";
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

/**
 * Adds `distance` (metres) to every mess that has valid coordinates.
 * @param {Array<{lat:any, lon:any}>} messes
 * @param {{lat:number, lon:number}|null} origin
 */
export function withDistances(messes, origin) {
  if (!origin || !isValidCoordinate(origin.lat, origin.lon)) {
    return messes.map((m) => ({ ...m, distance: null }));
  }
  return messes.map((m) => ({ ...m, distance: haversineDistance(origin.lat, origin.lon, m.lat, m.lon) }));
}

/** Messes within `radiusMeters` of the origin (messes without coordinates are excluded). */
export function filterByRadius(messesWithDistance, radiusMeters) {
  if (!radiusMeters) return messesWithDistance;
  return messesWithDistance.filter((m) => m.distance !== null && m.distance <= radiusMeters);
}

/** Nearest first; messes without a distance keep their order at the end. */
export function sortByDistance(messesWithDistance) {
  return [...messesWithDistance].sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });
}
