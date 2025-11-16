"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from './Loading'
export default function EditUserInfoPage({ consumerid }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [ConsumerData, setConsumerData] = useState({
    username: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/consumer/${consumerid}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch user info");

        const data = await res.json();

        setConsumerData({
          username: data.username || "",
          address: data.address || "",
          phone: data.phone || "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Error fetching user data");
      }
    }

    if (consumerid) fetchUser();
  }, [consumerid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConsumerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/consumer/${consumerid}/edit-consumer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ConsumerData),
      });

      if (!res.ok) throw new Error("Failed to update info");

      toast.success("Information updated successfully!");
      router.push(`/consumer/${consumerid}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update information");
    } finally {
      setLoading(false);
    }
  };

  if(loading) return <Loading/>

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">Edit Your Info</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              name="username"
              value={ConsumerData.username}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring focus:ring-gray-400"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block mb-1 font-medium">Address</label>
            <textarea
              name="address"
              value={ConsumerData.address}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring focus:ring-gray-400"
              rows={3}
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-1 font-medium">Phone</label>
            <input
              type="text"
              name="phone"
              value={ConsumerData.phone}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring focus:ring-gray-400"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-600 hover:bg-black text-white py-2 rounded-lg font-semibold transition"
          >
            {loading ? "Updating..." : "Update Info"}
          </button>
        </form>
      </div>
    </div>
  );
}
