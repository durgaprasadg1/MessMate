"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerNavbar from "@/Component/Owner/OwnerNavbar";
import { useParams, useRouter } from "next/navigation";
import OrderActionOwner from "@/Component/Owner/OrderActionOwner";
import { useSession } from "next-auth/react";
import LoadingComponent from "../../../../Component/Others/Loading";

import DataTable from "@/Component/ShadCnUI/table";

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
          const list = (data.orders || [])
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          setOrders(list);
          setMessOwnerId(data.messOwnerId ? String(data.messOwnerId) : null);
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
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          setOrders(list);
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, messOwnerId, session?.user?.id]);

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

  const isOwner =
    session?.user && messOwnerId && session.user.id === messOwnerId;

  const columns = useMemo(
    () => [
      {
        id: "orderId",
        header: "Order",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-emerald-900">
            {String(row.original._id).slice(0, 8)}
          </span>
        ),
      },
      {
        id: "consumer",
        header: "Consumer",
        accessorFn: (row) =>
          (row.consumer && (row.consumer.username || row.consumer.email)) ||
          "Unknown",
        cell: ({ getValue }) => (
          <span className="text-emerald-900">{getValue()}</span>
        ),
      },
      {
        accessorKey: "selectedDishName",
        header: "Dish",
        cell: ({ getValue }) => (
          <span className="text-emerald-900">{getValue() || "-"}</span>
        ),
      },
      {
        accessorKey: "noOfPlate",
        header: "Plates",
        cell: ({ getValue }) => (
          <span className="block text-center text-emerald-900 font-semibold">
            {getValue() ?? 0}
          </span>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        accessorFn: (row) => (row.totalPrice || 0) / 100,
        cell: ({ getValue }) => (
          <span className="block text-right text-emerald-900 font-semibold">
            Rs. {(getValue() || 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status || "unknown",
        cell: ({ row }) => {
          const o = row.original;
          const isCancelled = !!o.isCancelled;
          const status = o.status || "unknown";

          let label = status;
          if (status === "paid" && !o.done) label = "pending";

          let classes =
            "inline-block px-2 py-1 rounded-full text-xs font-semibold ";
          if (status === "completed") {
            classes += "bg-emerald-100 text-emerald-800";
          } else if (status === "refunded" || isCancelled) {
            classes += "bg-rose-100 text-rose-700";
          } else if (status === "paid") {
            classes += "bg-amber-100 text-amber-800";
          } else {
            classes += "bg-stone-200 text-stone-800";
          }

          return <span className={classes}>{label}</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) => {
          const val = getValue();
          return (
            <span className="whitespace-nowrap text-emerald-900">
              {val ? new Date(val).toLocaleString() : "-"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const o = row.original;
          return (
            <OrderActionOwner
              messId={String(id)}
              orderId={String(o._id)}
              messOwnerId={messOwnerId ? String(messOwnerId) : ""}
              isTaken={!!o.isTaken}
              refundInitiated={!!o.refundInitiated}
              done={!!o.done}
              isCancelled={!!o.isCancelled}
            />
          );
        },
      },
    ],
    [id, messOwnerId]
  );

  const data = useMemo(
    () =>
      (orders || [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [orders]
  );

  if (loading) return <LoadingComponent />;

  return (
    <div className="role-shell text-emerald-900">
      <OwnerNavbar />

      <div className="role-container space-y-4">
        <div className="role-section p-5 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Live Orders
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
              Orders for this Mess
            </h2>
            <p className="text-sm text-emerald-700 mt-1">
              Recent orders first, clean pastel table, quick bulk cleanup.
            </p>
          </div>

          {isOwner && data.length > 0 && (
            <button
              onClick={handleClickOfDelete}
              className="px-4 py-2 rounded-lg text-sm bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors font-semibold border border-rose-200"
            >
              Delete All Completed Orders
            </button>
          )}
        </div>

        {data.length === 0 ? (
          <div className="role-section p-6 text-emerald-700 text-center">
            No orders yet.
          </div>
        ) : (
          <>
            <div className="role-section p-6 text-emerald-800 text-center">
              Delete completed orders at the end of each day to keep your queue
              clean and focused.
            </div>
            <div className="mt-2">
              <DataTable columns={columns} data={data} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
