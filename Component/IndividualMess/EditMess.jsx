"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../Others/Loading";
import Label from "../Helper/Label";
import { useSession } from "next-auth/react";

export default function EditUserInfoPage({ messID }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [messData, setmessData] = useState({
    name: "",
    description: "",
    address: "",
    phoneNumber: "",
    category: "",
    limits: "",
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/mess/${messID}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch user info");

        const data = await res.json();
        setmessData({
          name: data.name || "",
          description: data?.description || "",
          address: data?.address || "",
          phoneNumber: data?.phoneNumber || "",
          category: data?.category || "",
          limits: data?.limits || "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Error fetching user data");
      }
    }

    if (messID) fetchUser();
  }, [messID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setmessData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/mess/${messID}/edit-info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messData),
      });

      if (!res.ok) toast.error("Failed to update information");

      toast.success("Information updated successfully!");
      router.push(`/owner/${session?.user?.id}/mess-details`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update information");
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <Loading />;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">

      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Edit Mess Info
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <Label labelName="Name" />
            <input
              type="text"
              name="name"
              value={messData.name}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring focus:ring-gray-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label labelName="Description" />
            <textarea
              name="description"
              value={messData.description}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring focus:ring-gray-400"
              rows={3}
              required
            />
          </div>

          {/* Address */}
          <div>
            <Label labelName="Address" />
            <input
              type="text"
              name="address"
              value={messData.address}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring focus:ring-gray-400"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <Label labelName="Phone Number" />
            <input
              type="tel"
              name="phone"
              value={messData.phoneNumber}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <Label labelName="Category" />
            <select
              name="category"
              value={messData.category}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded-md px-3 py-2"
            >
              <option value="">Select Category</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Both">Both (Veg + Non-Veg)</option>
            </select>
          </div>

          <div>
            <Label labelName="Limits" />
            <select
              name="limits"
              value={messData.limits}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded-md px-3 py-2"
            >
              <option value="">Select Limit</option>
              <option value="Limited">Limited</option>
              <option value="Unlimited">Unlimited</option>
            </select>
          </div>

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
