"use client";

import { useMemo, useState } from "react";
import Navbar from "../Others/Navbar";
import { useSession } from "next-auth/react";
import AdminNavbar from "../Admin/AdminNavbar";
import ButtonComponent from "../Others/Button";

export default function AllMesses({
  messes = [],
  filteredMesses: passedFiltered,
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;
  const [searchQuery, setSearchQuery] = useState("");

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
      {isAdmin ? (
        <AdminNavbar />
      ) : (
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      )}
      <div
        className={
          isAdmin
            ? "py-8 px-4 sm:px-6 lg:px-8 bg-purple-200"
            : "py-8 px-4 sm:px-6 lg:px-8 mt-16"
        }
      >
        <h1 className="text-4xl font-extrabold text-center text-amber-800 mb-10 drop-shadow-md">
          🍱 All Mess Listings
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
            } = mess;

            return (
              <div
                key={_id}
                className={`flex flex-col overflow-hidden rounded-2xl border ${
                  isAdmin
                    ? "bg-purple-100 border-transparent"
                    : "bg-white border-gray-200"
                } shadow-sm hover:shadow-md transition-transform duration-300 hover:scale-[1.02]`}
              >
                <img
                  src={image?.url || "https://via.placeholder.com/400x250"}
                  alt={name}
                  className="w-full object-cover h-40 sm:h-48 md:h-56"
                />

                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h2 className="text-2xl font-semibold text-amber-900">
                      {name}
                    </h2>

                    <p className="text-sm text-gray-600 italic">
                      {formattedCategory(category)}
                    </p>

                    <p className="text-gray-700 text-sm mt-2 line-clamp-3">
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

                  {session ? (
                    <>
                      {!isAdmin ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-4 gap-2 sm:gap-3">
                          <ButtonComponent
                            data="Get More Info"
                            link={`/mess/${_id}`}
                          />
                          {session.user.id === owner && (
                            <ButtonComponent
                              data="See Orders"
                              link={`/mess/${_id}/orders`}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <ButtonComponent
                              data="Message"
                              link={`/admin/all-messes/${_id}/reviews`}
                            />

                            <ButtonComponent
                              data="Block Mess"
                              link={`/admin/all-messes/${_id}/reviews`}
                            />
                            <ButtonComponent
                              data="Delete Mess"
                              link={`/admin/all-messes/${_id}/reviews`}
                            />
                          </div>
                          <div className=" mt-2 flex flex-wrap items-center justify-between gap-2 ">
                            <ButtonComponent
                              data="See Reviews & Ratings"
                              link={`/admin/all-messes/${_id}/reviews`}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <ButtonComponent
                      data="Get More Info"
                      link={`/mess/${_id}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
