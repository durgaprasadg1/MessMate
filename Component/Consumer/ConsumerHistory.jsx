"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import OrderActionConsumer from "./OrderActionConsumer";
import ReceiptDownloader from "@/Component/Consumer/ReceiptDownloader";
import DataTable from "@/Component/ShadCnUI/table";

export default function ConsumerHistoryUI({ orders, consumerid }) {
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

  const columns = useMemo(
    () => [
      {
        id: "orderId",
        header: "Order",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-gray-700 ">
            {String(row.original._id).slice(0, 8)}
          </span>
        ),
      },
      {
        id: "mess",
        header: "Mess",
        accessorFn: (row) =>
          row.mess?.name ? row.mess.name : "Unknown Mess",
        cell: ({ row }) => {
          const o = row.original;
          if (o.mess?._id) {
            return (
              <Link
                href={`/mess/${o.mess._id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {o.mess.name}
              </Link>
            );
          }
          return <span className="text-gray-700">Unknown Mess</span>;
        },
      },
      {
        accessorKey: "selectedDishName",
        header: "Dish",
        cell: ({ getValue }) => (
          <span className="text-gray-800">{getValue() || "-"}</span>
        ),
      },
      {
        accessorKey: "noOfPlate",
        header: "Plates",
        cell: ({ getValue }) => (
          <span className="block text-center text-gray-800">
            {getValue() ?? 0}
          </span>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        accessorFn: (row) => (row.totalPrice || 0) / 100,
        cell: ({ getValue }) => (
          <span className="block text-right text-gray-900 font-semibold">
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
          else label = status;

          let classes =
            "inline-block px-2 py-1 rounded-full text-xs font-medium border ";
          if (isDone) {
            classes += "bg-green-50 text-green-700 border-green-200";
          } else if (isCancelled) {
            classes += "bg-red-50 text-red-700 border-red-200";
          } else if (status === "paid") {
            classes += "bg-yellow-50 text-yellow-700 border-yellow-200";
          } else {
            classes += "bg-gray-50 text-gray-700 border-gray-200";
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
            <span className="whitespace-nowrap text-gray-700">
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
            o.consumer?._id ? String(o.consumer._id) : String(consumerid);

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
                messId={o.mess?._id ? String(o.mess._id) : null}
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
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600">
          No past orders.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Your Order History
      </h2>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}
