"use client";

import { useMemo, useEffect } from "react";
import { useExplore } from "@/contexts/ExploreContext";
import { withDistances, filterByRadius, sortByDistance, formatDistance } from "@/lib/geo";
import Link from "next/link";
import { Star, MapPin, Heart, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function ConsumerAllMesses({
  messes = [],
  filteredMesses: passedFiltered,
}) {
  // search text, radius and the (single) geolocation request live in the shared context
  const { searchQuery, radius, location, requestLocation } = useExplore();
  const userLocation = location.status === "granted" ? location.coords : null;
  const locationLoading = location.status === "idle" || location.status === "loading";
  const locationDenied = location.status === "denied";

  // ask for the position once; the list is shown immediately and distances fill in later
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBySearch = useMemo(() => {
    if (passedFiltered && Array.isArray(passedFiltered)) return passedFiltered;
    const messesArray = Array.isArray(messes) ? messes : [];
    if (!searchQuery.trim()) return messesArray;
    const q = searchQuery.toLowerCase();

    return messesArray.filter((m) =>
      [m.name, m.description, m.address, m.ownerName, m.category]
        .filter(Boolean)
        .some((item) => item.toLowerCase().includes(q)),
    );
  }, [messes, searchQuery, passedFiltered]);

  // Haversine distance from the user to every mess, optional radius filter,
  // and nearest-first ordering once the position is known.
  const visibleMesses = useMemo(() => {
    const list = Array.isArray(filteredBySearch) ? filteredBySearch : [];
    const withD = withDistances(list, userLocation);
    if (!userLocation) return withD;
    return sortByDistance(filterByRadius(withD, radius));
  }, [filteredBySearch, radius, userLocation]);

  // Helper function to extract cheapest and most expensive dishes
  const getDishExtremes = (menu) => {
    if (!menu) return { cheapest: null, expensive: null };
    let items = [];
    if (Array.isArray(menu)) items = menu;
    else if (menu.dishes && Array.isArray(menu.dishes)) items = menu.dishes;
    else return { cheapest: null, expensive: null };

    const pricedItems = items.filter(
      (d) => typeof d === 'object' && d !== null && d.price != null && !isNaN(parseFloat(d.price))
    );
    if (pricedItems.length === 0) return { cheapest: null, expensive: null };

    pricedItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    return {
      cheapest: pricedItems[0],
      expensive: pricedItems[pricedItems.length - 1],
    };
  };

  
  return (
    <div className="min-h-screen bg-slate-50 md:pl-[25vw] flex flex-col transition-[padding] duration-0 ease-linear">

      <main className="flex-1 py-10 px-6 max-w-screen-2xl mx-auto w-full">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800">
            Find the perfect mess...
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            <span className="font-semibold text-orange-600">{visibleMesses.length} messes</span>{" "}
            {userLocation ? "found near your location" : "found"}
            {locationLoading && <span className="ml-2 text-xs text-slate-400">(finding distances…)</span>}
          </p>
        </div>

        {!locationLoading && locationDenied && (
          <div className="mb-6 p-4 rounded-xl text-orange-800 bg-orange-100 border border-orange-200 shadow-sm max-w-2xl text-sm font-medium">
            Location access denied — showing all messes regardless of distance.
            Allow location access to find messes nearby!
          </div>
        )}

        {(
          <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
            {visibleMesses.map((mess) => {
              const dist = mess.distance;

              const vegExtremes = getDishExtremes(mess.vegMenu);
              const nonVegExtremes = getDishExtremes(mess.nonVegMenu);

              return (
                <article
                  key={mess._id}
                  className="group bg-white rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] border border-slate-200 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row h-auto sm:min-h-60"
                >
                  {/* Left Side: Image */}
                  <div className="relative w-full sm:w-[320px] h-56 sm:h-auto shrink-0 overflow-hidden">
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image
                        src={mess.url || ""}
                        alt={mess.name || "Mess image"}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-widest shadow-sm uppercase ${
                          mess.isOpen
                            ? "bg-white text-emerald-600"
                            : "bg-white text-rose-600"
                        }`}
                      >
                        {mess.isOpen ? "Open Now" : "Closed"}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-xs text-white uppercase tracking-wider font-semibold">
                       {mess.category === "both" ? "Veg + Non-Veg" : mess.category}
                    </div>
                  </div>

                  {/* Main Data Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top Meta info */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase border border-slate-200 px-2 py-0.5 rounded">
                            Mess Category
                          </span>
                          <div className="flex text-emerald-500 gap-0.5">
                             <Star size={12} fill="currentColor" />
                             <Star size={12} fill="currentColor" />
                             <Star size={12} fill="currentColor" />
                             <Star size={12} fill="currentColor" />
                             <Star size={12} fill="currentColor" />
                          </div>
                        </div>

                        {/* Save to Favorites toggle moved to top right */}
                        <div className="text-slate-300 hover:text-rose-500 cursor-pointer transition-colors" title="Save to favorites">
                          <Heart size={20} />
                        </div>
                      </div>

                      {/* Name & Location */}
                      <h2 className="text-xl font-extrabold text-slate-800 line-clamp-2 leading-tight hover:text-orange-600 transition-colors cursor-pointer pr-4">
                        {mess.name}
                      </h2>

                      <div className="mt-1.5 flex items-center text-xs text-slate-500 gap-1.5">
                        <MapPin size={14} className="text-orange-500 shrink-0" />
                        <span className="font-medium text-slate-700 line-clamp-1">
                          {mess.address?.split(",").slice(0, 2).join(",") || "Location available"}
                        </span>
                      </div>

                      {dist !== null && (
                        <div className="mt-1 flex items-center text-xs text-slate-500 gap-1.5 ml-[22px]">
                           <strong className="text-orange-600 font-semibold">
                             {formatDistance(dist)}
                           </strong>
                           <span>from your location</span>
                        </div>
                      )}

                      {/* Dynamic Dish Extreams Display */}
                      {(vegExtremes.cheapest || nonVegExtremes.cheapest || mess.vegPrice || mess.nonVegPrice) && (
                         <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {/* Veg Section */}
                           {(vegExtremes.cheapest || mess.vegPrice) && (
                             <div className="bg-green-50/60 p-3 rounded-lg border border-green-100/50">
                               <div className="text-[10px] font-bold text-green-700 uppercase mb-1.5 flex items-center gap-1.5">
                                 <span className="w-2 h-2 rounded-full bg-green-500"></span> Veg Menu
                               </div>
                               {vegExtremes.cheapest ? (
                                 <div className="flex justify-between items-end text-xs mb-1">
                                    <span className="text-slate-600 truncate pr-2" title={vegExtremes.cheapest.name || vegExtremes.cheapest.dishName}>
                                      Budget: <span className="font-medium">{vegExtremes.cheapest.name || vegExtremes.cheapest.dishName || 'Dish'}</span>
                                    </span>
                                    <span className="font-bold text-slate-800 shrink-0">₹{vegExtremes.cheapest.price}</span>
                                 </div>
                               ) : mess.vegPrice ? (
                                 <div className="flex justify-between items-end text-xs mb-1">
                                    <span className="text-slate-600 truncate pr-2">Base Pricing per Meal</span>
                                    <span className="font-bold text-slate-800 shrink-0">₹{mess.vegPrice}</span>
                                 </div>
                               ) : null}

                               {vegExtremes.expensive && vegExtremes.expensive !== vegExtremes.cheapest && (
                                 <div className="flex justify-between items-end text-xs">
                                    <span className="text-slate-600 truncate pr-2" title={vegExtremes.expensive.name || vegExtremes.expensive.dishName}>
                                      Premium: <span className="font-medium">{vegExtremes.expensive.name || vegExtremes.expensive.dishName || 'Dish'}</span>
                                    </span>
                                    <span className="font-bold text-slate-800 shrink-0">₹{vegExtremes.expensive.price}</span>
                                 </div>
                               )}
                             </div>
                           )}

                           {/* Non-Veg Section */}
                           {(nonVegExtremes.cheapest || mess.nonVegPrice) && (
                             <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-100/50">
                               <div className="text-[10px] font-bold text-rose-700 uppercase mb-1.5 flex items-center gap-1.5">
                                 <span className="w-2 h-2 rounded-full bg-rose-500"></span> Non-Veg Menu
                               </div>
                               {nonVegExtremes.cheapest ? (
                                 <div className="flex justify-between items-end text-xs mb-1">
                                    <span className="text-slate-600 truncate pr-2" title={nonVegExtremes.cheapest.name || nonVegExtremes.cheapest.dishName}>
                                      Budget: <span className="font-medium">{nonVegExtremes.cheapest.name || nonVegExtremes.cheapest.dishName || 'Dish'}</span>
                                    </span>
                                    <span className="font-bold text-slate-800 shrink-0">₹{nonVegExtremes.cheapest.price}</span>
                                 </div>
                               ) : mess.nonVegPrice ? (
                                 <div className="flex justify-between items-end text-xs mb-1">
                                    <span className="text-slate-600 truncate pr-2">Base Pricing per Meal</span>
                                    <span className="font-bold text-slate-800 shrink-0">₹{mess.nonVegPrice}</span>
                                 </div>
                               ) : null}

                               {nonVegExtremes.expensive && nonVegExtremes.expensive !== nonVegExtremes.cheapest && (
                                 <div className="flex justify-between items-end text-xs">
                                    <span className="text-slate-600 truncate pr-2" title={nonVegExtremes.expensive.name || nonVegExtremes.expensive.dishName}>
                                      Premium: <span className="font-medium">{nonVegExtremes.expensive.name || nonVegExtremes.expensive.dishName || 'Dish'}</span>
                                    </span>
                                    <span className="font-bold text-slate-800 shrink-0">₹{nonVegExtremes.expensive.price}</span>
                                 </div>
                               )}
                             </div>
                           )}
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action Bar (Only Button) */}
                  <div className="p-4 border-t sm:border-t-0 sm:border-l border-slate-100 flex flex-col justify-center shrink-0 sm:w-[180px] bg-white">
                    <Link href={`/mess/${mess._id}`} className="w-full no-underline! block">
                      <button className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3.5 px-4 rounded text-sm transition-colors shadow-sm flex items-center justify-center gap-2 group">
                        View Details
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                  </div>

                </article>
              );
            })}
          </div>
        )}

        {visibleMesses.length === 0 && (
          <div className="text-center bg-white p-12 rounded-2xl border border-slate-100 shadow-sm mt-10">
            <p className="text-slate-600 font-medium text-lg">
              No messes found matching your criteria.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
