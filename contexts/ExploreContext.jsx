"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/**
 * State shared by the sidebar (search box + radius select) and the Explore
 * page (list), plus ONE geolocation request for the whole app.
 *
 * Living above the pages means the search text / radius survive navigating to
 * a mess and coming back, and the browser is asked for the position only once.
 */
const ExploreContext = createContext(null);

export function ExploreProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(null);
  const [location, setLocation] = useState({ status: "idle", coords: null }); // idle | loading | granted | denied
  const inflight = useRef(null);

  /** Resolves to the coordinates, or null when unavailable / denied. Safe to call repeatedly. */
  const requestLocation = useCallback(() => {
    if (location.status === "granted") return Promise.resolve(location.coords);
    if (inflight.current) return inflight.current;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({ status: "denied", coords: null });
      return Promise.resolve(null);
    }

    setLocation((prev) => ({ ...prev, status: "loading" }));
    inflight.current = new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation({ status: "granted", coords });
          inflight.current = null;
          resolve(coords);
        },
        () => {
          setLocation({ status: "denied", coords: null });
          inflight.current = null;
          resolve(null);
        },
        { enableHighAccuracy: true, maximumAge: 5 * 60_000, timeout: 12_000 },
      );
    });
    return inflight.current;
  }, [location]);

  const value = useMemo(
    () => ({ searchQuery, setSearchQuery, radius, setRadius, location, requestLocation }),
    [searchQuery, radius, location, requestLocation],
  );
  return <ExploreContext.Provider value={value}>{children}</ExploreContext.Provider>;
}

export function useExplore() {
  const ctx = useContext(ExploreContext);
  if (!ctx) throw new Error("useExplore must be used inside <ExploreProvider>");
  return ctx;
}
