"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "../Others/Loading";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

const VerificationComponent = () => {
  const [pendingMesses, setPendingMesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingMesses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mess/pending", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch pending messes");
      const data = await res.json();
      setPendingMesses(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMesses();
  }, []);

  const handleVerify = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/mess/${id}/make-verified`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Verification failed");
      setPendingMesses((prev) => prev.filter((m) => m._id !== id));
      toast.success("Mess verified successfully!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/mess/${id}/deny-verification`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Denial failed");
      setPendingMesses((prev) => prev.filter((m) => m._id !== id));
      toast.info("Mess request denied.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="relative p-6 bg-zinc-900 min-h-screen">
      {actionLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loading />
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8 text-center text-white tracking-wide">
        Mess Verification Panel
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : pendingMesses.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">
          No pending messes for verification.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pendingMesses.map(
            (mess) =>
              !mess.isVerified && (
                <div
                  key={mess._id}
                  className="bg-amber-300 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 flex flex-col justify-between border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                    {mess.name}
                  </h2>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <span className="font-semibold">Owner:</span>{" "}
                        {mess.ownerName}
                      </p>

                      <p className="text-gray-700">
                        <span className="font-semibold">Contact:</span>{" "}
                        {mess.phoneNumber}
                      </p>

                      <p className="text-gray-700">
                        <span className="font-semibold">Category:</span>{" "}
                        {mess.category === "both"
                          ? "Veg + Non-Veg"
                          : mess.category}
                      </p>

                      <p className="text-gray-700">
                        <span className="font-semibold">Limited:</span>{" "}
                        {mess.isLimited ? "Yes" : "No"}
                      </p>

                      <p className="text-gray-700">
                        <span className="font-semibold">Aadhar:</span>{" "}
                        {mess.adharNumber}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <span className="font-semibold">Banner:</span>{" "}
                        <Link href={mess.image.url} target="_blank">
                          <button className="text-gray-600 cursor-pointer">
                            View
                          </button>
                        </Link>
                      </p>

                      <p className="text-gray-700">
                        <span className="font-semibold">Certificate:</span>{" "}
                        <Link href={mess.certificate?.url} target="_blank">
                          <button className="text-gray-600 cursor-pointer">
                            View
                          </button>
                        </Link>
                      </p>

                      <p className="text-gray-700">
                        <span className="font-semibold">Location:</span>{" "}
                        <Link
                          href={`https://www.google.com/maps?q=${mess.lat},${mess.lon}`}
                          target="_blank"
                        >
                          <button className="text-gray-600 cursor-pointer">
                            Open Map
                          </button>
                        </Link>
                      </p>

                      <p className="text-gray-700">
                        <span className="font-semibold">Submitted:</span>{" "}
                        {new Date(mess.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-white text-sm mt-4 bg-black p-3 rounded-xl">
                    <span className="font-semibold">Description:</span>{" "}
                    {mess.description}
                  </p>

                  <div className="mt-6 flex justify-between gap-3">
                    <button
                      onClick={() => handleVerify(mess._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition-all shadow-sm"
                    >
                      Verify
                    </button>

                    <button
                      onClick={() => handleDeny(mess._id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded transition-all shadow-sm"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
};

export default VerificationComponent;
