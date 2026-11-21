/** Only https URLs may be rendered as links / images coming from API data. */
export function safeHttpsUrl(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === "https:" ? u.toString() : "#";
  } catch {
    return "#";
  }
}

/** Google Maps link built from validated numbers only. */
export function mapsUrl(lat, lon, base = "https://www.google.com/maps") {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return "#";
  return `${base}?q=${la},${lo}`;
}
