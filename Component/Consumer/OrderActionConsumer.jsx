"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import Loading from '../Others/Loading';
export default function OrderActionConsumer({
  orderId,
  consumerId,
  isTaken,
  isCancelled,
  refundInitiated,
  done,
  messId,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  if (!session || session.user.id !== consumerId) return null;
  if (isCancelled) return <div className="text-sm text-red-600">Cancelled</div>;
  if (refundInitiated)
    return <div className="text-sm text-orange-600">Refund initiated</div>;
  if (done) return <div className="text-sm text-gray-600">Completed</div>;

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this order? Refund will be started soon."
      )
    )
      return;
    if (isTaken) {
      toast.error("Order already taken. Cannot cancel.");
      return;
    }
    if (refundInitiated) {
      toast.error("Refund already initiated. Cannot cancel.");
      return;
    }
    setLoading(true);
    try {
      const endpoint = `/api/mess/${messId}/orders/${orderId}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Order cancelled");
        // notify any listening parent/page to refresh their order list
        try {
          window.dispatchEvent(
            new CustomEvent("order-updated", {
              detail: { orderId, action: "cancel" },
            })
          );
        } catch (e) {
          // ignore if window not available
        }
        // also refresh Next.js cache
        router.refresh();
      } else {
        toast.error(data.message || "Failed to cancel");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel order");
    } finally {
      setLoading(false);
    }
  };

    if(loading) return <Loading/>
  

  return (
    <div>
      <button
        disabled={loading || isTaken || refundInitiated || done}
        onClick={handleCancel}
        className={`px-3 py-1 rounded ${
          isTaken || refundInitiated || done
            ? "bg-gray-300 text-gray-600"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
      >
        {loading ? "Cancelling..." : "Cancel Order"}
      </button>
    </div>
  );
}
