"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import OrderActionConsumer from "./OrderActionConsumer";
import ReceiptDownloader from "@/Component/Consumer/ReceiptDownloader";

import DataTable from "@/Component/ShadCnUI/table";

export default function ConsumerHistoryUI({ orders, consumerid }) {
  const data = useMemo(
    () =>
      (orders || []).slice().sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  );

  const columns = useMemo(
    () => [
      {
        id: "orderId",
        header: "Order",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {String(row.original._id).slice(0, 8)}
          </span>
        ),
      },
      {
        id: "mess",
        header: "Mess",
        accessorFn: (row) =>
          row.mess && row.mess.name ? row.mess.name : "Unknown Mess",
        cell: ({ row }) => {
          const o = row.original;
          if (o.mess && o.mess._id) {
            return (
              <Link
                href={`/mess/${o.mess._id}`}
                className="text-blue-600 hover:underline"
              >
                {o.mess.name}
              </Link>
            );
          }
          return <span className="text-gray-600">Unknown Mess</span>;
        },
      },
      {
        accessorKey: "selectedDishName",
        header: "Dish",
        cell: ({ getValue }) => <span>{getValue() || "-"}</span>,
      },
      {
        accessorKey: "noOfPlate",
        header: "Plates",
        cell: ({ getValue }) => (
          <span className="block text-center">{getValue() ?? 0}</span>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        accessorFn: (row) => (row.totalPrice || 0) / 100,
        cell: ({ getValue }) => (
          <span className="block text-right">
            ₹{(getValue() || 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status || "Unknown",
        cell: ({ row }) => {
          const o = row.original;
          const status = o.status || "Unknown";
          const isDone = !!o.done;
          const isCancelled = !!o.isCancelled;

          let label;
          if (isDone) label = "Completed";
          else if (isCancelled) label = "Cancelled";
          else if (status === "paid") label = "Pending";
          else label = status || "Unknown";

          let classes =
            "inline-block px-2 py-1 rounded-full text-xs font-medium ";
          if (isDone) {
            classes += "bg-green-100 text-green-700";
          } else if (isCancelled) {
            classes += "bg-red-100 text-red-700";
          } else if (status === "paid") {
            classes += "bg-yellow-100 text-yellow-700";
          } else {
            classes += "bg-gray-100 text-gray-700";
          }

          return <span className={classes}>{label}</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Placed",
        cell: ({ getValue }) => {
          const val = getValue();
          return (
            <span className="whitespace-nowrap">
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

          const consumerIdToUse =
            o.consumer && o.consumer._id
              ? String(o.consumer._id)
              : String(consumerid);

          const canDownloadReceipt =
            o.status === "paid" || o.status === "completed" || o.done;

          return (
            <div className="flex gap-2 items-center">
              <OrderActionConsumer
                orderId={String(o._id)}
                consumerId={consumerIdToUse}
                isTaken={!!o.isTaken}
                isCancelled={!!o.isCancelled}
                refundInitiated={!!o.refundInitiated}
                done={!!o.done}
                messId={o.mess && o.mess._id ? String(o.mess._id) : null}
              />
              {canDownloadReceipt && <ReceiptDownloader order={o} />}
            </div>
          );
        },
      },
    ],
    [consumerid]
  );

  if (!data || data.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-6 bg-white rounded shadow-sm text-gray-600">
          No past orders.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="mb-4 text-xl font-semibold">Your Order History</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
