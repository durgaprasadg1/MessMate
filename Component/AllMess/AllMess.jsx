"use client";

import { useMemo, useState, useEffect } from "react";
import Navbar from "../Others/Navbar";
import ButtonComponent from "../Others/Button";
import Loading from "@/Component/Others/Loading";

export default function ConsumerAllMesses({
  messes = [],
  filteredMesses: passedFiltered,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // ---------------------------
  // 1️⃣  GEOLOCATION FETCH
  // ---------------------------
  useEffect(() => {
    if (!navigator?.geolocation) {
      setLocationDenied(true);
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLocationDenied(false);
        setLocationLoading(false);
      },
      () => {
        setLocationDenied(true);
        setLocationLoading(false);
        setUserLocation(null);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 12000 }
    );
  }, []);

  // ----------------------------------------
  // 2️⃣  SAFE DISTANCE FUNCTION
  // ----------------------------------------
  const distanceInMeters = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null; // prevent crash

    const R = 6371000;
    const toRad = (v) => (v * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ----------------------------------------
  // 3️⃣  SEARCH FILTER
  // ----------------------------------------
  const filteredBySearch = useMemo(() => {
    if (passedFiltered) return passedFiltered;

    if (!searchQuery.trim()) return messes;

    const q = searchQuery.toLowerCase();

    return messes.filter((m) =>
      [m.name, m.description, m.address, m.ownerName, m.category]
        .filter(Boolean)
        .some((item) => item.toLowerCase().includes(q))
    );
  }, [messes, searchQuery, passedFiltered]);

  // ----------------------------------------
  // 4️⃣  RADIUS FILTER
  // ----------------------------------------
  const visibleMesses = useMemo(() => {
    const baseList = filteredBySearch.filter(
      (m) => m.isVerified && !m.isBlocked
    );

    if (!radius || !userLocation) return baseList;

    return baseList.filter((m) => {
      const d = distanceInMeters(
        userLocation.lat,
        userLocation.lon,
        m.lat,
        m.lon
      );
      return d !== null && d <= radius;
    });
  }, [filteredBySearch, radius, userLocation]);

  return (
    <>
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        radius={radius}
        setRadius={setRadius}
      />

      <main className="py-8 px-4 mt-15">
        <h2 className="text-center mb-3">
          Find the best messes around you!
        </h2>

        {locationLoading && (
          <div className="flex justify-center mt-10">
            <Loading />
          </div>
        )}

        {/* LOCATION DENIED */}
        {!locationLoading && locationDenied && (
          <div className="flex justify-center mb-4 text-center">
            <div className="p-2 rounded w-full sm:w-96 text-red-600 bg-red-50">
              Location access denied — showing all messes.
              <br />
              Allow location access to search nearby messes.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleMesses.map((mess) => {
            const dist =
              userLocation && radius
                ? distanceInMeters(
                    userLocation.lat,
                    userLocation.lon,
                    mess.lat,
                    mess.lon
                  )
                : null;

            return (
              <article
                key={mess._id}
                className="rounded border bg-white shadow hover:scale-105 transition"
              >
                <img
                  src={mess.image?.url || "https://via.placeholder.com/800x500"}
                  className="w-full h-48 object-cover"
                />

                <div className="p-4">
                  <h2 className="text-xl font-bold text-amber-900">
                    {mess.name}
                  </h2>

                  <p className="text-sm italic text-gray-600">
                    {mess.category === "both"
                      ? "Veg + Non-Veg"
                      : mess.category}
                  </p>

                  <p className="text-gray-700 text-sm mt-2 line-clamp-3">
                    {mess.description}
                  </p>

                  <p className="text-sm mt-2 text-gray-600">
                    {mess.address?.split(",")[0]}
                  </p>

                  <span
                    className={`px-3 py-1 mt-2 inline-block rounded-full text-xs ${
                      mess.isOpen
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {mess.isOpen ? "Open" : "Closed"}
                  </span>

                  {dist !== null && (
                    <p className="text-xs mt-2 text-blue-600">
                      {Math.round(dist)} meters away
                    </p>
                  )}

                  <div className="mt-4 flex justify-between items-center">
                    <ButtonComponent
                      data="Get More Info"
                      link={`/mess/${mess._id}`}
                    />
                    <button
                  className="bg-gray-600  text-white font-medium hover:bg-black p-2 transition-colors duration-300 rounded"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${mess.lat},${mess.lon}`,
                      "_blank"
                    )
                  }
                >
                  Get Location on Map
                </button>
                  </div>
                  

                </div>
              </article>
            );
          })}
        </div>

        {visibleMesses.length === 0 && (
          <p className="text-center text-gray-600 mt-10 text-xl">
            No messes found for your filters.
          </p>
        )}
      </main>
    </>
  );
}
