"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Panel from "@/Component/Owner/Panel";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import OwnerNavbar from "@/Component/Owner/OwnerNavbar";
import { useSession } from "next-auth/react";
import Loading from "@/Component/Others/Loading";
import EmptynessShowBox from "@/Component/Others/EmptynessShowBox";
import MenuComponent from "@/Component/IndividualMess/MenuComponent";
import {
  MapPin,
  Users,
  Utensils,
  Phone,
  CreditCard,
  MessageSquare,
  ClipboardList,
  BarChart,
} from "lucide-react";

export default function OwnedMessPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messes, setMesses] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  const { data: session, status } = useSession();
  const isOwner = session?.user?.isOwner;

  useEffect(() => {
    const fetchMesses = async () => {
      try {
        setIsFetching(true);
        const res = await fetch(`/api/owner/${id}/mess-details`, {
          cache: "no-store",
        });

        if (!res.ok) {
          console.error("Failed to fetch mess details: ", res.statusText);
          setMesses([]);
          return;
        }

        const data = await res.json();
        setMesses(data.messes || []);
      } catch (err) {
        console.error(err);
        setMesses([]);
      } finally {
        setIsFetching(false);
      }
    };

    if (id) fetchMesses();
  }, [id]);

  const handleClick = (link) => {
    router.push(link);
  };

  if (status === "loading") {
    return <Loading />;
  }

  if (!session || !isOwner) {
    return (
      <div className="min-h-screen bg-gray-950 pb-10">
        <OwnerNavbar />
        <div className="pt-20">
          <EmptynessShowBox
            heading="You are not authorized to view this page."
            link="/"
            linkmsg="Go to Home"
          />
        </div>
      </div>
    );
  }

  const verifiedMesses = messes.filter((m) => m.isVerified);
  const hasVerified = verifiedMesses.length > 0;
  const hasAnyMess = messes.length > 0;

  const renderDetailItem = (Icon, label, value) => (
    <div className="flex items-center text-sm text-gray-400">
      <Icon className="w-4 h-4 mr-2 text-indigo-400" />
      <span className="font-semibold text-white mr-1">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 pb-16">
      <OwnerNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
          🍽️ Mess Management Dashboard
        </h1>
        <p className="text-gray-400 text-base">
          View and control all aspects of your verified mess operations.
        </p>
      </div>

      {isFetching && (
        <div className="mt-20 flex justify-center">
          <Loading />
        </div>
      )}

      {!isFetching && !hasAnyMess && (
        <div className="mt-16">
          <EmptynessShowBox
            heading="No Mess Registered Yet"
            link={`/owner/${session?.user?.id}/new-mess`}
            linkmsg="Register Your First Mess Now"
          />
        </div>
      )}

      {!isFetching && hasAnyMess && !hasVerified && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto px-4 mt-10"
        >
          <div className="flex items-start p-4 rounded-xl border border-amber-500/30 bg-gray-900 shadow-xl">
            <BarChart className="w-6 h-6 text-amber-400 mt-0.5 shrink-0" />
            <div className="ml-3">
              <p className="text-lg font-bold text-amber-300">
                Mess Under Verification
              </p>
              <p className="text-sm mt-1 text-amber-200">
                Your registered mess is currently being reviewed. Once approved,
                it will appear here for management. Thank you for your patience.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {!isFetching &&
        hasVerified &&
        verifiedMesses.map((mess, index) => {
          const hasVeg = mess.vegMenu && mess.vegMenu.length > 0;
          const hasNonVeg = mess.nonVegMenu && mess.nonVegMenu.length > 0;
          const hasAnyMenu = hasVeg || hasNonVeg;

          return (
            <motion.div
              key={mess._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12"
            >
              <div className="bg-gray-800 border border-gray-700/70 rounded-2xl p-6 shadow-2xl">
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  <div className="space-y-6">
                    <div className="border-b border-gray-700 pb-4">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <Utensils className="w-6 h-6 mr-2" />
                        {mess.name}
                      </h2>
                      <div className="flex items-center mt-2 space-x-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            mess.isOpen
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {mess.isOpen ? "Open Now" : "Currently Closed"}
                        </span>
                        <span className="text-sm text-gray-300">
                          {mess.isLimited ? "Limited Service" : "Unlimited Service"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white">
                        Operational Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {renderDetailItem(
                          Users,
                          "Owner",
                          mess.ownerName
                        )}
                        {renderDetailItem(
                          Phone,
                          "Phone",
                          mess.phoneNumber
                        )}
                        {renderDetailItem(
                          CreditCard,
                          "Aadhaar",
                          mess.adharNumber
                        )}
                        {renderDetailItem(
                          Utensils,
                          "Category",
                          mess.category === "both"
                            ? "Veg + Non-Veg"
                            : mess.category
                        )}
                      </div>
                      {mess.lat && mess.lon && (
                        <div className="flex items-center pt-2">
                          <MapPin className="w-4 h-4 mr-2 text-indigo-400 shrink-0" />
                          <span className="font-semibold text-white mr-3">
                            Location:
                          </span>
                          <Link
                            href={`https://maps.google.com/?q=${mess.lat},${mess.lon}`}
                            target="_blank"
                            className="text-xs font-medium text-indigo-300 hover:text-indigo-400 transition duration-150"
                          >
                            <button className="flex items-center px-3 py-1 rounded bg-indigo-700/50 hover:bg-indigo-700 text-white text-xs transition duration-200">
                              <MapPin className="w-3 h-3 mr-1.5" /> Open in Maps
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>

                    <Panel mess={mess} />

                    <div className="pt-2 space-y-2">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          className="flex items-center justify-center w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition duration-200 shadow-md"
                          onClick={() =>
                            handleClick(`/mess/${mess._id}/messages`)
                          }
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                           Messages
                        </button>
                        <button
                          className="flex items-center justify-center w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition duration-200 shadow-md"
                          onClick={() =>
                            handleClick(`/mess/${mess._id}/orders`)
                          }
                        >
                          <ClipboardList className="w-4 h-4 mr-2" />
                          Manage Orders
                        </button>
                      </div>
                      <button
                        className="flex items-center justify-center w-full py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium text-sm transition duration-200 shadow-md"
                        onClick={() =>
                          handleClick(`/owner/${mess._id}/analytics`)
                        }
                      >
                        <BarChart className="w-4 h-4 mr-2" />
                        View Performance Analytics
                      </button>
                      <button
                        className="flex items-center justify-center mt-2 w-full py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium text-sm transition duration-200 shadow-md"
                        onClick={() =>
                          handleClick(`/owner/${mess._id}/all-registered-customers`)
                        }
                      >
                        <Users className="w-4 h-4 mr-2" />
                        View All Registered Customers
                      </button>
                     
                    </div>
                  </div>

                  <div className="h-full w-full bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-inner">
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                      🍽️ Current Menu
                    </h3>
                    {hasAnyMenu ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-full"
                      >
                        <MenuComponent mess={mess} isOwner={isOwner} />
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <EmptynessShowBox
                          heading="Menu Incomplete"
                          description="Your mess must have at least one menu type."
                          link={`/owner/${session?.user?.id}/mess/${mess._id}/add-menu`}
                          linkmsg="Set Up Your Menu Now"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
    </div>
  );
}