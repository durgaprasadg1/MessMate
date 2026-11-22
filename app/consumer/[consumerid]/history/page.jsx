"use client";

import { apiFetch } from "@/lib/apiFetch";
import PageSkeleton from "@/Component/Others/PageSkeleton";
import { use, useEffect, useState, useCallback } from "react";
import ConsumerHistoryUI from "../../../../Component/Consumer/ConsumerHistory";
import { useSession } from "next-auth/react";
import { useRouter  } from "next/navigation";
import { toast } from "react-toastify";

export default function ConsumerHistory({ params }) {
  const { consumerid } = use(params);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/consumer/${consumerid}/history`, {
        cache: "no-store",
      });

      if (!res.ok) {
        toast.error("Failed to fetch order history");
        router.push("/mess");
      }

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
      const res = await apiFetch(`/api/consumer/${consumerid}/history`, {
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

  if (loading) return <PageSkeleton />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="bg-slate-50 min-h-screen">
      <ConsumerHistoryUI 
          orders={orders} 
          consumerid={consumerid}
          onClear={handleClear}
          clearing={clearing}
          showClear={session && session.user && session.user.id === consumerid && orders.length > 0}
      />
    </div>
  );
}
