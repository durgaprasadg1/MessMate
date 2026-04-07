"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import Loading from "../Others/Loading";

export default function OrderActionOwner({
  messId,
  orderId,
  messOwnerId,
  isTaken,
  done,
  refundInitiated,
  isCancelled,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [takenLocal, setTakenLocal] = useState(!!isTaken);
  const [refundedLocal, setRefundedLocal] = useState(!!refundInitiated);
  const [doneLocal, setDoneLocal] = useState(!!done);
  const [cancelledLocal, setCancelledLocal] = useState(!!isCancelled);

  useEffect(() => setTakenLocal(!!isTaken), [isTaken]);
  useEffect(() => setRefundedLocal(!!refundInitiated), [refundInitiated]);
  useEffect(() => setDoneLocal(!!done), [done]);
  useEffect(() => setCancelledLocal(!!isCancelled), [isCancelled]);

  if (!session || session.user.id !== messOwnerId) return null;

  const handleTake = async () => {
    setLoading(true);
    setActionDone(true);
    try {
      const res = await fetch(`/api/mess/${messId}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "take" }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Order taken");
        setTakenLocal(true);
        try {
          window.dispatchEvent(
            new CustomEvent("order-updated", {
              detail: { orderId, action: "take" },
            })
          );
        } catch (e) {}
        try {
          if (typeof window !== "undefined") {
            window.location.reload(true);
          } else {
            router.refresh();
          }
        } catch (e) {
          try {
            router.refresh();
          } catch (e) {}
        }
      } else {
        toast.error(data.message || "Failed to take order");
        setActionDone(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to take order");
      setActionDone(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm("Return payment for this order and mark it cancelled?"))
      return;
    setLoading(true);
    setActionDone(true);
    try {
      const res = await fetch(`/api/mess/${messId}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refund" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Refund initiated");
        setRefundedLocal(true);
        setCancelledLocal(true);
        try {
          router.refresh();
        } catch (e) {}
      } else {
        toast.error(data.message || "Failed to initiate refund");
        setActionDone(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate refund");
      setActionDone(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async () => {
    if (!confirm("Mark this order as completed?")) return;
    setLoading(true);
    setActionDone(true);
    try {
      const res = await fetch(`/api/mess/${messId}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markDone" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Order marked completed");
        setDoneLocal(true);
        try {
          router.refresh();
        } catch (e) {}
      } else {
        toast.error(data.message || "Failed to mark order completed");
        setActionDone(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark completed");
      setActionDone(false);
    } finally {
      setLoading(false);
    }
  };

  const disableTake =
    loading ||
    actionDone ||
    takenLocal ||
    refundedLocal ||
    doneLocal ||
    cancelledLocal;
  const disableRefund =
    loading ||
    actionDone ||
    refundedLocal ||
    doneLocal ||
    takenLocal ||
    cancelledLocal;
  const disableMarkDone =
    loading ||
    actionDone ||
    refundedLocal ||
    doneLocal ||
    !takenLocal ||
    cancelledLocal;

  if (loading) return <Loading />;

  return (
    <div className="flex gap-2 text-slate-800">
      {!done ? (
        <>
          <button
            onClick={handleTake}
            disabled={disableTake}
            className={`px-3 py-1 rounded text-white text-sm font-medium transition ${
              disableTake
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Processing..." : takenLocal ? "Taken" : "Mark Taken"}
          </button>

          <button
            onClick={handleRefund}
            disabled={disableRefund}
            className={`px-3 py-1 rounded text-white text-sm font-medium transition ${
              disableRefund
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {loading
              ? "Processing..."
              : refundedLocal
              ? "Refunded"
              : "Return Payment"}
          </button>

          <button
            onClick={handleMarkDone}
            disabled={disableMarkDone}
            className={`px-3 py-1 rounded text-white text-sm font-medium transition ${
              disableMarkDone
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {loading
              ? "Processing..."
              : doneLocal
              ? "Completed"
              : "Mark Completed"}
          </button>
        </>
      ) : (
        <div className="px-2 py-1 rounded bg-teal-50 text-teal-700 text-sm font-medium border border-teal-200">
          Completed
        </div>
      )}
    </div>
  );
}
