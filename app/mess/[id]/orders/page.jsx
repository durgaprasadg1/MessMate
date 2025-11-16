"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import OrderActionOwner from "@/Component/Owner/OrderActionOwner";
import { useSession } from "next-auth/react";
import LoadingComponent from "../../../../Component/Others/Loading";

export default function OrdersPage() {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [messOwnerId, setMessOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`/api/mess/${id}/orders`);
        const data = await res.json();

        if (res.ok) {
          setOrders(data.orders || []);
          setMessOwnerId(data.messOwnerId);

          console.log(orders);
        } else {
          console.error("Failed:", data.message);
        }
      } catch (err) {
        console.error("Error fetching:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [id]);

  useEffect(() => {
    if (!messOwnerId || !session?.user) return;
    if (session.user.id !== String(messOwnerId)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mess/${id}/orders`);
        const data = await res.json();
        if (res.ok) {
          const list = (data.orders || [])
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(list);
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, messOwnerId, session]);

  const handleClickOfDelete = async () => {
    if (
      !confirm(
        "Delete ALL completed orders for this mess? This cannot be undone."
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`/api/mess/${id}/orders`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Deleted completed orders");
        router.refresh();
      } else {
        alert(data.message || "Failed to delete completed orders");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete completed orders");
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <LoadingComponent />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="mb-6 text-2xl font-semibold">Orders for this Mess</h2>

      {session && session.user && session.user.id === messOwnerId && (
        <div className="mb-4">
          {orders.length === 0 ? (
            ""
          ) : (
            <button
              onClick={handleClickOfDelete}
              className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete All Completed Orders
            </button>
          )}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="p-6 bg-white rounded shadow-sm text-gray-600">
          No orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-sm">
          <table className="min-w-full text-sm divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Consumer</th>
                <th className="px-4 py-3 text-left">Dish</th>
                <th className="px-4 py-3 text-center">Plates</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    {String(o._id).slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    
                      {o.consumer
                        ? o.consumer.username || o.consumer.email
                        : "Unknown"}
                   
                  </td>
                  <td className="px-4 py-3">{o.selectedDishName || "-"}</td>
                  <td className="px-4 py-3 text-center">{o.noOfPlate}</td>
                  <td className="px-4 py-3 text-right">
                    ₹{((o.totalPrice || 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        o.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : o.status === "refunded" || o.isCancelled
                          ? "bg-red-100 text-red-700"
                          : o.status === "paid"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {o.status === "paid" && !o.done
                        ? "pending"
                        : o.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <OrderActionOwner
                      messId={id}
                      orderId={String(o._id)}
                      messOwnerId={messOwnerId ? String(messOwnerId) : ""}
                      isTaken={!!o.isTaken}
                      refundInitiated={!!o.refundInitiated}
                      done={!!o.done}
                      isCancelled={!!o.isCancelled}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
