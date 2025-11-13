"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function useOrderActions({
  messId,
  orderId,
  setTakenLocal,
  setDoneLocal,
  setRefundLocal,
  setCancelLocal,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const patchOrder = async (action) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mess/${messId}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      toast.success(data.message);
      router.refresh();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleTake = async () => {
    const ok = await patchOrder("take");
    if (ok) setTakenLocal(true);
  };

  const handleRefund = async () => {
    if (!confirm("Return payment?")) return;
    const ok = await patchOrder("refund");
    if (ok) {
      setRefundLocal(true);
      setCancelLocal(true);
    }
  };

  const handleDone = async () => {
    if (!confirm("Mark completed?")) return;
    const ok = await patchOrder("markDone");
    if (ok) setDoneLocal(true);
  };

  return { loading, handleTake, handleRefund, handleDone };
}
