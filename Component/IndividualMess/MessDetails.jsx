"use client";

import { useSession } from "next-auth/react";
import Panel from "../Owner/Panel";
import ReviewSection from "./ReviewComponent";
import ShowReviewComponent from "@/Component/IndividualMess/showReviewComponent";
import BookingForm from "./PlateBookingComponent";
import Link from "next/link";
export default function MessDetails({ mess }) {
  if (!mess) return null;

  const { data: session } = useSession();

  return (
    <div className="min-h-screen py-10 px-6 mt-5">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-[1.01]">
        <div className="w-full h-64 overflow-hidden">
          <img
            src={mess.image?.url}
            alt={mess.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{mess.name}</h1>
              <p className="text-gray-500 mt-1 text-md">
                Type :{" "}
                {mess.category === "both" ? "Veg + Non-Veg" : mess.category}
              </p>
              <p className="text-gray-500 mt-1 text-md font-medium">
                {" "}
                {mess.isLimited ? "Limited" : "Unlimited"}
              </p>

              <p
                className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  mess.isOpen
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {mess.isOpen ? "Open" : "Closed"}
              </p>
            </div>

            <div className="text-right mt-4 sm:mt-0">
              <p className="text-gray-700">
                <span className="font-medium">Owner:</span> {mess.ownerName}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Phone:</span> {mess.phoneNumber}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Aadhaar:</span> {mess.adharNumber}
              </p>
            </div>
          </div>

          <div className="mt-4 text-gray-600">
            <p>
              <span className="font-medium">📍 Address:</span> {mess.address}
            </p>

            {mess.lat && mess.lon && (
              <p className="text-sm mt-1 flex items-center gap-2">
                <span className="font-medium">🌐 Location:</span>
                <Link
                  href={`https://www.google.com/maps?q=${mess.lat},${mess.lon}`}
                  target="_blank"
                >
                  <button className="py-1 rounded text-black">
                    See On Map
                  </button>
                </Link>
              </p>
            )}

            {mess.mealTime && (
              <p className="mt-2 text-gray-600">
                🍽️ <span className="font-medium">Meal Time:</span>{" "}
                {mess.mealTime}
              </p>
            )}
          </div>

          <p className="mt-6 text-gray-700 leading-relaxed border-l-4 border-blue-500 pl-4">
            {mess.description}
          </p>
          {/* VEG MENU */}
          {mess.vegMenu?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-green-700 mb-3">
                🌿 Veg Menu
              </h2>

              {mess.vegMenu.map((menu, i) => (
                <div
                  key={i}
                  className="mb-6 border rounded-xl p-4 bg-green-50 border-green-100"
                >
                  <h3 className="text-lg font-medium text-green-800 mb-2">
                    {menu.name} — ₹{menu.price}
                  </h3>

                  <ul className="space-y-1 text-gray-700">
                    {menu.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex justify-between items-center text-sm border-b pb-1"
                      >
                        <span>{item.name}</span>
                        <span>
                          ₹{item.price ?? "-"}{" "}
                          {item.isLimited && (
                            <span className="ml-2 text-xs text-red-600">
                              (Limit: {item.limitCount})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {mess.nonVegMenu?.length > 0 && (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold text-red-700 mb-3">
                🍗 Non-Veg Menu
              </h2>

              {mess.nonVegMenu.map((menu, i) => (
                <div
                  key={i}
                  className="mb-6 border rounded-xl p-4 bg-red-50 border-red-100"
                >
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    {menu.name} — ₹{menu.price}
                  </h3>

                  <ul className="space-y-1 text-gray-700">
                    {menu.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex justify-between items-center text-sm border-b pb-1"
                      >
                        <span>{item.name}</span>
                        <span>
                          ₹{item.price ?? "-"}{" "}
                          {item.isLimited && (
                            <span className="ml-2 text-xs text-red-600">
                              (Limit: {item.limitCount})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Panel mess={mess} />

      {session && (mess.vegMenu?.length > 0 || mess.nonVegMenu?.length > 0) ? (
        <div className="flex flex-col md:flex-row items-start gap-6 mt-6">
          <div className="w-full md:w-1/2">
            <BookingForm mess={mess} />
          </div>
          <div className="w-full md:w-1/2">
            <ReviewSection messID={mess._id} />
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <ReviewSection messID={mess._id} />
        </div>
      )}

      <ShowReviewComponent reviews={mess.reviews} mess={mess} />
    </div>
  );
}
