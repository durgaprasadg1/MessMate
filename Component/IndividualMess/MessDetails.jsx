"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import ReviewSection from "./ReviewComponent";
import ShowReviewComponent from "@/Component/IndividualMess/showReviewComponent";
import BookingForm from "./PlateBookingComponent";
import MenuComponent from "./MenuComponent";
import Link from "next/link";
import ButtonComponent from "../Others/Button";
export default function MessDetails({ mess }) {
  if (!mess) return null;

  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(!!mess.isOpen);

  useEffect(() => {
    const handler = (e) => {
      try {
        const d = e?.detail || {};
        if (d?.id === mess._id) {
          setIsOpen(!!d.isOpen);
        }
      } catch (err) {
        console.log("ERROR in Fetching Individual Mess", err?.message);
      }
    };
  }, [mess._id]);

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
                {mess.category === "both" || "Both"
                  ? "Veg + Non-Veg"
                  : mess.category}
              </p>
              <p className="text-gray-500 mt-1 text-md font-medium">
                {" "}
                {mess.isLimited ? "Limited" : "Unlimited"}
              </p>

              <p
                className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  isOpen
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {isOpen ? "Open" : "Closed"}
              </p>
            </div>

            <div className="text-right mt-4 sm:mt-0">
              <p className="text-gray-700">
                <span className="font-medium">Owner:</span> {mess.ownerName}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Phone:</span> {mess.phoneNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
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
                <p className="mt-2 text-gray-600 ">
                  🍽️ <span className="font-medium">Meal Time:</span>{" "}
                  {mess.mealTime}
                </p>
              )}
              <p className="mt-6 text-gray-700 leading-relaxed border-l-4 border-blue-500 pl-4">
                {mess.description}
              </p>
            </div>

            <div className="p-6">
              {mess.monthlyMessDuration > 0 && mess.monthlyMessFee > 0 && (
                <div className=" bg-white p-4 rounded-lg shadow-md text-center">
                  <div className="flex items-center justify-around">
                    <p className="text-gray-500 text-md">
                      Get delicious taste and satisfaction for{" "}
                      {mess.monthlyMessDuration} days — starting at only ₹
                      {mess.monthlyMessFee}!{" "}
                    </p>
                    <br />
                  </div>

                  <div>
                    <ButtonComponent
                      data="Join Monthly Mess Now!"
                      link={`/mess/${mess._id}/new-customer`}
                      classes="bg-pink-500 text-white rounded px-4 py-2 hover:bg-pink-600 transition"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <MenuComponent mess={mess} isOwner={false} />
        </div>
      </div>

      {session &&
      (mess.vegMenu?.length > 0 || mess.nonVegMenu?.length > 0) &&
      mess.isOpen ? (
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
      <br />
      <ShowReviewComponent reviews={mess.reviews} mess={mess} />
    </div>
  );
}
