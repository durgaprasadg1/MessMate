"use client";
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "./Loading";
import Navbar from "./Navbar";

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <Navbar />
      <h1 className="text-2xl font-bold mb-6 text-center">
        Mess Verification Panel
      </h1>

      {pendingMesses.length === 0 ? (
        <p className="text-center text-gray-600">
          No pending messes for verification.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingMesses.map((mess) =>
            mess.isVerified ? (
              ""
            ) : (
              <div
                key={mess._id}
                className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition duration-200"
              >
                <h2 className="text-xl font-semibold mb-2">{mess.name}</h2>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>Owner:</strong> {mess.ownerName}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>Contact:</strong> {mess.contact}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>Description :</strong> {mess.description}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>Image URL :</strong> {mess.image.url}
                </p>

                <p className="text-gray-600 text-sm mb-2">
                  <strong>Category:</strong> {mess.category}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>IsLimited:</strong> {mess.isLimited}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>Adhar Number:</strong> {mess.adharNumber}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>Location : </strong> {mess.lat}, {mess.lon}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <strong>isVerified:</strong> {mess.isVerified}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  <strong>Submitted On:</strong>{" "}
                  {new Date(mess.createdAt).toLocaleDateString()}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify(mess._id)}
                    className="flex-1 bg-green-600 hover:bg-black text-white font-semibold py-2 rounded-xl transition"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleDeny(mess._1d)}
                    className="flex-1 bg-gray-600 hover:bg-black text-white font-semibold py-2 rounded-xl transition"
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
