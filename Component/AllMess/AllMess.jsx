"use client";

import React, { useMemo, useState } from "react";
import Navbar from "../Others/Navbar";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AllMesses({
  messes = [],
  filteredMesses: passedFiltered,
}) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter Logic
  const filteredMesses = useMemo(() => {
    if (passedFiltered) return passedFiltered;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return messes;

    return messes.filter((m) =>
      [m.name, m.description, m.address, m.ownerName, m.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [messes, searchQuery, passedFiltered]);

  const formattedCategory = (cat) =>
    cat === "Both" || "both" ? "Veg + Non-Veg" : cat;

  return (
    <>
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="py-10 px-6 mt-10">
        <h1 className="text-4xl font-extrabold text-center text-amber-800 mb-10 drop-shadow-md">
          🍱 All Mess Listings
        </h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMesses.map((mess) => {
            if (!mess.isVerified) return null;

            const {
              _id,
              name,
              description,
              address,
              image,
              owner,
              ownerName,
              category,
              isOpen,
              vegPrice,
              nonVegPrice,
            } = mess;

            return (
              <div
                key={_id}
                className="bg-white rounded-3xl mt-3 shadow-xl overflow-hidden hover:scale-105 hover:shadow-2xl transition duration-300 border-2 border-gray-200 flex flex-col"
              >
                <img
                  src={image?.url || "https://via.placeholder.com/400x250"}
                  alt={name}
                  className="h-56 w-full object-cover"
                />

                <div className="p-2 flex flex-col justify-between flex-1">
                  <div>
                    <h2 className="text-2xl font-semibold text-amber-900">
                      {name}
                    </h2>
                    <p className="text-sm text-gray-600 italic">
                      {formattedCategory(category)}
                    </p>

                    <p className="text-gray-700 text-sm mt-3 line-clamp-2">
                      {description}
                    </p>

                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm text-gray-500">
                        <p>
                          <span className="font-medium text-amber-700">
                            Owner:
                          </span>{" "}
                          {ownerName}
                        </p>
                        <p>📍 {address?.split(",")[0] || "Unknown"}</p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isOpen
                            ? "bg-green-200 text-green-700"
                            : "bg-red-200 text-red-700"
                        }`}
                      >
                        {isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {session?.user?.id === owner && (
                      <Link href={`/mess/${_id}/orders`}>
                        <button className="p-2 bg-gray-600 text-white hover:bg-black rounded">
                          See Orders
                        </button>
                      </Link>
                    )}

                    <Link href={`/mess/${_id}`}>
                      <button className="p-2 bg-gray-600 text-white hover:bg-black rounded">
                        Get More Info
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
