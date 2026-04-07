"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../Others/Loading";
import { useSession } from "next-auth/react";
import OwnerNavbar from "../Owner/OwnerNavbar";
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
    <div className="role-shell flex items-start justify-center">
      <OwnerNavbar />
      <div className="role-container">
        <div className="role-section w-full max-w-3xl p-8 space-y-6 mx-auto">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Mess Profile
            </p>
            <h2 className="text-3xl font-extrabold text-emerald-900 mt-1">
              Edit Mess Info
            </h2>
            <p className="text-sm text-emerald-700 mt-2">
              Keep your listing consistent and trustworthy. Soft, clear inputs
              guide you through every field.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-emerald-900">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={messData.name}
                onChange={handleChange}
                className="w-full border border-emerald-100 rounded-xl px-3 py-2.5 bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-200 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-emerald-900">
                Description
              </label>
              <textarea
                name="description"
                value={messData.description}
                onChange={handleChange}
                className="w-full border border-emerald-100 rounded-xl px-3 py-2.5 bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-200 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-emerald-900">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={messData.address}
                onChange={handleChange}
                className="w-full border border-emerald-100 rounded-xl px-3 py-2.5 bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-200 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-emerald-900">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={messData.phoneNumber}
                onChange={handleChange}
                className="w-full border border-emerald-100 rounded-xl px-3 py-2.5 bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-200 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-emerald-900">
                  Category
                </label>
                <select
                  name="category"
                  value={messData.category}
                  onChange={handleChange}
                  required
                  className="w-full border border-emerald-100 rounded-xl px-3 py-2.5 bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-200 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Both">Both (Veg + Non-Veg)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-emerald-900">
                  Limits
                </label>
                <select
                  name="limits"
                  value={messData.limits}
                  onChange={handleChange}
                  required
                  className="w-full border border-emerald-100 rounded-xl px-3 py-2.5 bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-200 focus:border-transparent"
                >
                  <option value="">Select Limit</option>
                  <option value="Limited">Limited</option>
                  <option value="Unlimited">Unlimited</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition duration-300 shadow-md shadow-emerald-200 disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Info"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
