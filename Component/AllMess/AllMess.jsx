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

  const distanceInMeters = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371000;
    const toRad = (v) => (v * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

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
        <h2 className="text-center mb-3">Find the best messes around you!</h2>

        {locationLoading && (
          <div className="flex justify-center mb-4">
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

        {!locationLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleMesses.map((mess) => {
              const dist = userLocation
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
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-200"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={
                        mess.image?.url || "https://via.placeholder.com/800x500"
                      }
                      alt={mess.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                          mess.isOpen
                            ? "bg-green-500/90 text-white"
                            : "bg-red-500/90 text-white"
                        }`}
                      >
                        {mess.isOpen ? "● Open Now" : "● Closed"}
                      </span>
                    </div>

                    {dist !== null && (
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {dist >= 1000
                            ? `${(dist / 1000).toFixed(1)} km`
                            : `${Math.round(dist)} m`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-3">
                      <h2 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {mess.name}
                      </h2>

                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`px-2.5 py-1 rounded-md font-medium ${
                            mess.category === "both"
                              ? "bg-purple-100 text-purple-700"
                              : mess.category?.toLowerCase() === "veg"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {mess.category === "both"
                            ? "🥗 Veg + Non-Veg"
                            : mess.category?.toLowerCase() === "veg"
                            ? "🌱 Vegetarian"
                            : "🍗 Non-Veg"}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-1 line-clamp-2 min-h-[40px]">
                      {mess.description ||
                        "Delicious meals served fresh daily."}
                    </p>

                    <div className="flex items-start gap-2 mb-1 text-gray-500 text-sm">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="line-clamp-1">
                        {mess.address?.split(",").slice(0, 2).join(",") ||
                          "Location available"}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 mb-4"></div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <ButtonComponent
                        data="View Details"
                        link={`/mess/${mess._id}`}
                      />

                      <button
                        className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps?q=${mess.lat},${mess.lon}`,
                            "_blank"
                          )
                        }
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Map
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!locationLoading && visibleMesses.length === 0 && (
          <p className="text-center text-gray-600 mt-10 text-xl">
            No messes found for your filters.
          </p>
        )}
      </main>
    </>
  );
}
