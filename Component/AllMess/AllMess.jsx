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
  const [messesState] = useState(messes);
  const [radius, setRadius] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    if (!navigator?.geolocation) {
      setLocationDenied(true);
      setLocationLoading(false);
      window.userHasLocation = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        window.userHasLocation = true;
        setLocationDenied(false);
        setLocationLoading(false);
      },
      () => {
        setUserLocation(null);
        setLocationDenied(true);
        window.userHasLocation = false;
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );
  }, []);

  const distanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredMesses = useMemo(() => {
    if (passedFiltered) return passedFiltered;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return messesState;
    return messesState.filter((m) =>
      [m.name, m.description, m.address, m.ownerName, m.category]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [messesState, searchQuery, passedFiltered]);

  const visibleMesses = useMemo(() => {
    const base = filteredMesses.filter((m) => m.isVerified && !m.isBlocked);
    if (!radius || !userLocation) return base;

    return base.filter((m) => {
      const d = distanceInMeters(
        userLocation.lat,
        userLocation.lon,
        m.lat,
        m.lon
      );
      return d <= radius;
    });
  }, [filteredMesses, radius, userLocation]);

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

        {!locationLoading && locationDenied && (
          <div className="flex justify-center mb-4 text-center">
            <div className="p-2 rounded w-full sm:w-96 text-red-600 bg-red-50">
              Location access denied — showing all messes.
              <br />
              Allow location access to search nearby messes.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
          {visibleMesses.map((mess) => {
            const {
              _id,
              name,
              description,
              address,
              image,
              category,
              isOpen,
            } = mess;

            const categoryLabel =
              category?.toLowerCase() === "both"
                ? "Veg + Non-Veg"
                : category;

            const dist =
              userLocation && radius
                ? Math.round(
                    distanceInMeters(
                      userLocation.lat,
                      userLocation.lon,
                      mess.lat,
                      mess.lon
                    )
                  )
                : null;

            return (
              <article
                key={_id}
                className="rounded border bg-white shadow hover:scale-105 transition"
              >
                <img
                  src={image?.url || "https://via.placeholder.com/800x500"}
                  className="w-full h-48 object-cover"
                />

                <div className="p-4">
                  <h2 className="text-xl font-bold text-amber-900">{name}</h2>

                  <p className="text-sm italic text-gray-600">
                    {categoryLabel}
                  </p>

                  <p className="text-gray-700 text-sm mt-2 line-clamp-3">
                    {description}
                  </p>

                  <p className="text-sm mt-2 text-gray-600">
                    {address?.split(",")[0]}
                  </p>

                  <span
                    className={`px-3 py-1 mt-2 inline-block rounded-full text-xs ${
                      isOpen
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isOpen ? "Open" : "Closed"}
                  </span>

                  {dist !== null && (
                    <p className="text-xs mt-2 text-blue-600">
                      {dist} meters away
                    </p>
                  )}

                  <div className="mt-4">
                    <ButtonComponent
                      data="Get More Info"
                      link={`/mess/${_id}`}
                    />
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
