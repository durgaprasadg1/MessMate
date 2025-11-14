"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "./Loading";
import Navbar from "./Navbar";
import Link from "next/link";

const VerificationComponent = () => {
  const [pendingMesses, setPendingMesses] = useState([]);
  const [loading, setLoading] = useState(false);

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
    try {
      const res = await fetch(`/api/mess/${id}/make-verified`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Verification failed");

      toast.success("Mess verified successfully!");
      setPendingMesses((prev) => prev.filter((m) => m._id !== id));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeny = async (id) => {
    try {
      const res = await fetch(`/api/mess/${id}/deny-verification`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Denial failed");

      toast.info("Mess request denied.");
      setPendingMesses((prev) => prev.filter((m) => m._id !== id));
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Navbar />

      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 tracking-wide">
        Mess Verification Panel
      </h1>

      {pendingMesses.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">
          No pending messes for verification.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {pendingMesses.map((mess) =>
            !mess.isVerified && (
              <div
                key={mess._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 flex flex-col justify-between border border-gray-200"
              >
                {/* Header */}
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                  {mess.name}
                </h2>

                {/* Content Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">

                  {/* LEFT SIDE */}
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">Owner:</span> {mess.ownerName}
                    </p>

                    <p className="text-gray-700">
                      <span className="font-semibold">Contact:</span>{" "}
                      {mess.phoneNumber}
                    </p>

                    <p className="text-gray-700">
                      <span className="font-semibold">Category:</span>{" "}
                      {mess.category === "both" ? "Veg + Non-Veg" : mess.category}
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
                      <Link href={`https://www.google.com/maps?q=${mess.lat},${mess.lon}`} target="_blank">
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

                <p className="text-gray-700 text-sm mt-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="font-semibold">Description:</span>{" "}
                  {mess.description}
                </p>

                <div className="mt-6 flex justify-between gap-3">
                  <button
                    onClick={() => handleVerify(mess._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl transition-all shadow-sm"
                  >
                    Verify
                  </button>

                  <button
                    onClick={() => handleDeny(mess._id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl transition-all shadow-sm"
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
