"use client";

import { useMemo, useState } from "react";
import Navbar from "../Others/Navbar";
import ButtonComponent from "../Others/Button";

export default function ConsumerAllMesses({ messes = [], filteredMesses: passedFiltered }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [messesState] = useState(messes);

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

  const visibleMesses = filteredMesses.filter((m) => m.isVerified && !m.isBlocked);

  const formattedCategory = (c) =>
    c === "Both" || c === "both" ? "Veg + Non-Veg" : c;

  return (
    <>
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="py-8 px-4 mt-20">
        <h1 className="text-3xl text-center font-extrabold mb-8">All Mess Listings</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleMesses.map((mess) => {
            const { _id, name, description, address, image, ownerName, category, isOpen } = mess;

            return (
              <article
                key={_id}
                className="rounded-2xl border bg-white shadow hover:scale-105 transition"
              >
                <img
                  src={image?.url || "https://via.placeholder.com/800x500"}
                  className="w-full h-48 object-cover"
                />

                <div className="p-4">
                  <h2 className="text-xl font-bold text-amber-900">{name}</h2>
                  <p className="text-sm italic text-gray-600">{formattedCategory(category)}</p>
                  <p className="text-gray-700 text-sm mt-2 line-clamp-3">{description}</p>
                  <p className="text-sm mt-2 text-gray-600">{address?.split(",")[0]}</p>

                  <span
                    className={`px-3 py-1 mt-2 inline-block rounded-full text-xs ${
                      isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isOpen ? "Open" : "Closed"}
                  </span>

                  <div className="mt-4">
                    <ButtonComponent data="Get More Info" link={`/mess/${_id}`} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </>
  );
}
