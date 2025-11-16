"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import ConsumerHistoryUI from "../../../../Component/Consumer/ConsumerHistory";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import Loading from "@/Component/Others/Loading";

export default function ConsumerHistory({ params }) {
  const { consumerid } = use(params);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/consumer/${consumerid}/history`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch consumer order history");

      const data = await res.json();
      setOrders(data.orders || []);
      setError(null);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [consumerid]);

  const { data: session } = useSession();
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    if (
      !confirm(
        "Clear completed and cancelled orders from your history? This cannot be undone."
      )
    )
      return;
    setClearing(true);
    try {
      const res = await fetch(`/api/consumer/${consumerid}/history`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "History cleared");
        try {
          window.dispatchEvent(
            new CustomEvent("order-updated", { detail: { action: "clear" } })
          );
        } catch (e) {}
        await fetchHistory();
      } else {
        toast.error(data.message || "Failed to clear history");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear history");
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    const onUpdate = (e) => {
      try {
        const detail = e?.detail || {};
        fetchHistory();
      } catch (err) {
        fetchHistory();
      }
    };

    window.addEventListener("order-updated", onUpdate);
    return () => window.removeEventListener("order-updated", onUpdate);
  }, [consumerid, fetchHistory]);

  if (loading) return <Loading />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div>
      <div className="p-6 max-w-4xl mx-auto mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Order History</h1>
        {session && session.user && session.user.id === consumerid && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className={`px-3 py-2 rounded ${
              clearing
                ? "bg-gray-300 text-gray-600"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {clearing ? "Clearing..." : "Clear History"}
          </button>
        )}
      </div>
      <ConsumerHistoryUI orders={orders} consumerid={consumerid} />
    </div>
  );
}
