"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import ReviewSection from "./ReviewComponent";
import ShowReviewComponent from "@/Component/IndividualMess/showReviewComponent";
import BookingForm from "./PlateBookingComponent";
import MenuComponent from "./MenuComponent";
import Link from "next/link";
import { MapPin, Clock, ChefHat, ExternalLink, Info } from "lucide-react";

export default function MessDetails({ mess }) {
  if (!mess) return null;

  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(!!mess.isOpen);
  const isConsumer =
    session && !session.user?.isOwner && !session.user?.isAdmin;
  const showMonthlyJoinCta = isConsumer && Number(mess.monthlyMessFee) > 0;

  useEffect(() => {
    const handler = (e) => {
      try {
        const d = e?.detail || {};
        if (d?.id === mess._id) {
          setIsOpen(!!d.isOpen);
        }
      } catch (err) {
        console.log("Error handling mess status update:", err);
      }
    };
    window.addEventListener("messStatusUpdate", handler);
    return () => window.removeEventListener("messStatusUpdate", handler);
  }, [mess._id]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8 mt-16 md:mt-0 bg-slate-50 md:pl-[25vw] flex flex-col transition-[padding] duration-0 ease-linear">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 mt-6 pb-20">
        <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
          <div className="w-full lg:w-[40%] rounded-3xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-200 bg-white relative shrink-0 min-h-[300px]">
            <img
              src={mess.image?.url || "https://via.placeholder.com/800x600"}
              alt={mess.name}
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>

            <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
              <div>
                <span className="text-white/80 font-medium text-xs uppercase tracking-widest drop-shadow-md">
                  {mess.category === "both" ? "Veg + Non-Veg" : mess.category}
                </span>
                <h2 className="text-2xl font-black text-white drop-shadow-lg leading-tight mt-1">
                  {mess.name}
                </h2>
              </div>
            </div>

            <div className="absolute top-5 left-5">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest shadow-md uppercase backdrop-blur-md ${
                  isOpen
                    ? "bg-white/90 text-emerald-600"
                    : "bg-white/90 text-rose-600"
                }`}
              >
                {isOpen ? "Currently Open" : "Closed Now"}
              </span>
            </div>
          </div>

          {/* Right: Mess Details block */}
          <div className="w-full lg:w-[60%] bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-200 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <h1 className="text-3xl font-extrabold text-slate-800">
                  {mess.name}
                </h1>
                <div className="text-right shrink-0 ml-4 hidden sm:block">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                    Owner
                  </p>
                  <p className="text-sm text-slate-700 font-semibold">
                    {mess.ownerName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <MapPin
                    size={20}
                    className="text-orange-500 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Address
                    </p>
                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                      {mess.address}
                    </p>
                    {mess.lat && mess.lon && (
                      <Link
                        href={`https://www.google.com/maps?q=${mess.lat},${mess.lon}`}
                        target="_blank"
                        className="no-underline!"
                      >
                        <p className="text-xs font-semibold text-orange-500 hover:text-orange-600 mt-1 flex items-center gap-1">
                          See on Map <ExternalLink size={12} />
                        </p>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock
                    size={20}
                    className="text-orange-500 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Meal Times
                    </p>
                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                      {mess.mealTime || "Standard Hours"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl border-l-4 border-orange-500 bg-orange-50 text-slate-700 text-sm leading-relaxed font-medium flex items-start gap-3 relative">
                <ChefHat
                  size={20}
                  className="text-orange-400 shrink-0 mt-0.5"
                />
                <p>
                  {mess.description ||
                    "Fresh and delicious daily meals prepared locally."}
                </p>
              </div>
            </div>

            {/* Bottom Actions / Join Monthly */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
                <Info size={14} className="text-slate-400" />
                {mess.isLimited ? "Limited Serving" : "Unlimited Thali"}
              </div>

              {mess.monthlyMessFee > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-orange-200 shadow-sm rounded-xl py-3 px-4 shrink-0 sm:w-auto w-full justify-between">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Monthly Plan
                    </span>
                    <span className="text-lg font-black text-slate-800 leading-none">
                      ₹{mess.monthlyMessFee}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Duration: {mess.monthlyMessDuration || 30} days
                    </span>
                  </div>
                  {isConsumer ? (
                    <Link
                      href={`/mess/${mess._id}/new-customer`}
                      className="no-underline! shrink-0"
                    >
                      <button className="bg-orange-500 text-white shadow-md text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-orange-600 active:bg-orange-700 transition w-full sm:w-auto">
                        Join Monthly Mess
                      </button>
                    </Link>
                  ) : (
                    <button
                      onClick={() =>
                        (window.location.href = `/login?redirect=/mess/${mess._id}/new-customer`)
                      }
                      className="bg-slate-900 text-white shadow-md text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition w-full sm:w-auto"
                    >
                      Login to Join
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Menus Details (Split into two columns if both exist inside component) */}
        <div className=" w-full bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden p-6 sm:p-8">
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            Our Menu
          </h2>
          <MenuComponent mess={mess} isOwner={false} />

          {/* ROW 3: Plate Booking & Review Add Split Side-by-Side */}
          {session &&
          (mess.vegMenu?.length > 0 || mess.nonVegMenu?.length > 0) &&
          mess.isOpen ? (
            <div className="mt-4 flex flex-col lg:flex-row w-full gap-6 items-stretch">
              <div className="w-full lg:w-1/2 bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden p-6 sm:p-8">
                <BookingForm mess={mess} />
              </div>
              <div className="mt-4 w-full lg:w-1/2 bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden p-6 sm:p-8">
                <ReviewSection
                  messID={mess._id}
                  showJoinMonthly={showMonthlyJoinCta}
                  joinMonthlyHref={`/mess/${mess._id}/new-customer`}
                  monthlyFee={mess.monthlyMessFee}
                  monthlyDuration={mess.monthlyMessDuration || 30}
                />
              </div>
            </div>
          ) : (
            <ReviewSection
              messID={mess._id}
              showJoinMonthly={showMonthlyJoinCta}
              joinMonthlyHref={`/mess/${mess._id}/new-customer`}
              monthlyFee={mess.monthlyMessFee}
              monthlyDuration={mess.monthlyMessDuration || 30}
            />
          )}

          {/* ROW 4: All Reviews */}
          <div className="mt-4 w-full bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden p-6 sm:p-8">
            <ShowReviewComponent reviews={mess.reviews} mess={mess} />
          </div>
        </div>
      </div>
    </div>
  );
}
