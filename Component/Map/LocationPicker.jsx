"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Search, MapPin, X } from "lucide-react";
import {
  OSM_TILE_URL, OSM_ATTRIBUTION, DEFAULT_CENTER, DEFAULT_ZOOM, PIN_ZOOM,
  buildSearchUrl, buildReverseUrl, parseSearchResults, parseReverseResult, roundCoordinate,
} from "@/lib/osm";
import { isValidCoordinate } from "@/lib/geo";

// Default Leaflet marker images do not survive bundling, so draw the pin ourselves (inline SVG, no assets).
const pinIcon = L.divIcon({
  className: "",
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 3px rgba(0,0,0,.35))">
    <path d="M17 1C8.7 1 2 7.6 2 15.8 2 27 17 43 17 43s15-16 15-27.2C32 7.6 25.3 1 17 1z" fill="#059669" stroke="#fff" stroke-width="2"/>
    <circle cx="17" cy="16" r="5.5" fill="#fff"/></svg>`,
});

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** Moves the camera when the chosen position changes (search result, pin drop). */
function Fly({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), PIN_ZOOM), { duration: 0.8 });
  }, [target, map]);
  return null;
}

/**
 * Owner picks the mess location on an OpenStreetMap map (click, drag the pin,
 * or search an address). The chosen coordinates are what gets saved.
 *
 * props: value {lat, lon} | null, onChange({lat, lon}), onAddress(label) optional
 */
export default function LocationPicker({ value, onChange, onAddress }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);
  const reverseTimer = useRef(null);

  const hasValue = value && isValidCoordinate(value.lat, value.lon);
  const position = useMemo(() => (hasValue ? [Number(value.lat), Number(value.lon)] : null), [hasValue, value]);

  const place = useCallback(
    (lat, lon, { fly = false } = {}) => {
      const next = { lat: roundCoordinate(lat), lon: roundCoordinate(lon) };
      onChange(next);
      if (fly) setFlyTarget({ ...next });
      setNotice("");

      // suggest an address for the pin (debounced; the owner can still edit it)
      if (onAddress) {
        clearTimeout(reverseTimer.current);
        reverseTimer.current = setTimeout(async () => {
          try {
            const res = await fetch(buildReverseUrl(next.lat, next.lon));
            if (res.ok) {
              const label = parseReverseResult(await res.json());
              if (label) onAddress(label);
            }
          } catch {
            /* the address is only a convenience */
          }
        }, 800);
      }
    },
    [onChange, onAddress],
  );

  useEffect(() => () => clearTimeout(reverseTimer.current), []);

  const search = async (e) => {
    e.preventDefault();
    const url = buildSearchUrl(query);
    if (!url) {
      setNotice("Type at least 3 characters to search.");
      return;
    }
    setSearching(true);
    setNotice("");
    try {
      const res = await fetch(url);
      const list = res.ok ? parseSearchResults(await res.json()) : [];
      setResults(list);
      if (!list.length) setNotice("No places found. Try a nearby landmark, or click on the map.");
    } catch {
      setNotice("Search is unavailable right now. You can still click on the map to drop the pin.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="flex gap-2">
        <div className="flex items-center flex-1 border border-stone-200 rounded-md bg-[#F4F7F4] px-3">
          <Search size={16} className="text-stone-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search area, landmark or address"
            className="w-full bg-transparent px-2 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400"
            aria-label="Search for the mess location"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {results.length > 0 && (
        <ul className="border border-stone-200 rounded-md bg-white divide-y divide-stone-100 max-h-44 overflow-y-auto text-sm">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lon}-${i}`}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex gap-2 items-start"
                onClick={() => {
                  place(r.lat, r.lon, { fly: true });
                  setResults([]);
                }}
              >
                <MapPin size={14} className="mt-1 text-emerald-600 shrink-0" />
                <span className="text-stone-700">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {notice && <p className="text-xs text-amber-700">{notice}</p>}

      <div className="relative overflow-hidden rounded-lg border border-stone-200" style={{ height: 340 }}>
        <MapContainer
          center={position || [DEFAULT_CENTER.lat, DEFAULT_CENTER.lon]}
          zoom={position ? PIN_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} maxZoom={19} />
          <ClickToPlace onPick={(lat, lon) => place(lat, lon)} />
          <Fly target={flyTarget} />
          {position && (
            <Marker
              position={position}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng();
                  place(p.lat, p.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-stone-600">
        {hasValue ? (
          <>
            <span>
              Selected location: <strong className="font-mono text-stone-800">{Number(value.lat).toFixed(5)}, {Number(value.lon).toFixed(5)}</strong>
            </span>
            <button
              type="button"
              onClick={() => onChange({ lat: "", lon: "" })}
              className="inline-flex items-center gap-1 text-stone-500 hover:text-rose-600 transition-colors"
            >
              <X size={12} /> Clear
            </button>
          </>
        ) : (
          <span>Click on the map (or drag the pin) to mark exactly where your mess is.</span>
        )}
      </div>
    </div>
  );
}
