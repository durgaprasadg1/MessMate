"use client";

import Link from "next/link";
import OrderActionConsumer from "@/Component/OrderActionConsumer";
import ReceiptDownloader from "@/Component/ReceiptDownloader";

export default function ConsumerHistoryUI({ orders, consumerid }) {
  const list = (orders || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {list.length === 0 ? (
        <div className="p-6 bg-white rounded shadow-sm text-gray-600">
          No past orders.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-sm">
          <table className="min-w-full text-sm divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Mess</th>
                <th className="px-4 py-3 text-left">Dish</th>
                <th className="px-4 py-3 text-center">Plates</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Placed</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((o) => (
                <tr key={String(o._id)} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    {String(o._id).slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    {o.mess ? (
                      <Link
                        href={`/mess/${o.mess._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {o.mess.name}
                      </Link>
                    ) : (
                      <span className="text-gray-600">Unknown Mess</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{o.selectedDishName || "-"}</td>
                  <td className="px-4 py-3 text-center">{o.noOfPlate}</td>
                  <td className="px-4 py-3 text-right">
                    ₹{((o.totalPrice || 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        o.done
                          ? "bg-green-100 text-green-700"
                          : o.isCancelled
                          ? "bg-red-100 text-red-700"
                          : o.status === "paid"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {o.done
                        ? "Completed"
                        : o.isCancelled
                        ? "Cancelled"
                        : o.status === "paid"
                        ? "Pending"
                        : o.status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 flex gap-2 items-center">
                    <OrderActionConsumer
                      orderId={String(o._id)}
                      consumerId={
                        o.consumer && o.consumer._id
                          ? String(o.consumer._id)
                          : String(consumerid)
                      }
                      isTaken={!!o.isTaken}
                      isCancelled={!!o.isCancelled}
                      refundInitiated={!!o.refundInitiated}
                      done={!!o.done}
                      messId={o.mess && o.mess._id ? String(o.mess._id) : null}
                    />
                    {/* Show receipt download for paid/completed orders */}
                    {(o.status === "paid" ||
                      o.status === "completed" ||
                      o.done) && <ReceiptDownloader order={o} />}
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
