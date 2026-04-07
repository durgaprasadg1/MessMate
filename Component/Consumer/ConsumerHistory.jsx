"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import OrderActionConsumer from "./OrderActionConsumer";
import ReceiptDownloader from "@/Component/Consumer/ReceiptDownloader";
import { Search } from "lucide-react";

export default function ConsumerHistoryUI({ orders, consumerid, onClear, clearing, showClear }) {
  const [searchTerm, setSearchTerm] = useState("");
  

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

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((o) =>
      o.mess?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.selectedDishName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const renderStatusBadge = (o) => {
    const status = o.status || "Unknown";
    const isDone = !!o.done;
    const isCancelled = !!o.isCancelled;

    let label, colors;
    if (isDone) {
      label = "Completed";
      colors = "text-emerald-700 bg-emerald-50 border-emerald-200 outline-emerald-600";
    } else if (isCancelled) {
      label = "Cancelled";
      colors = "text-rose-700 bg-rose-50 border-rose-200 outline-rose-600";
    } else if (status === "paid") {
      label = "Active";
      colors = "text-blue-700 bg-blue-50 border-blue-200 outline-blue-600";
    } else {
      label = status;
      colors = "text-slate-700 bg-slate-50 border-slate-200 outline-slate-600";
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ${colors}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
        {label}
      </span>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 md:pl-[25vw] flex flex-col transition-[padding] duration-0 ease-linear">
        <div className="p-6 sm:p-10 w-full max-w-7xl mx-auto flex-1">
          <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] text-slate-500 text-center text-lg font-medium">
            No past orders found. Time to grab a delicious meal!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 md:pl-[25vw] flex flex-col transition-[padding] duration-0 ease-linear">
      <div className="p-6 sm:p-10 w-full max-w-7xl mx-auto flex-1 mt-16 md:mt-0">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              Transaction History
              <span className="text-sm font-semibold text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full border border-slate-200/50">
                {data.length} Total
              </span>
            </h2>
            <p className="text-slate-500 mt-2 font-medium">Manage and review your past mess orders and invoices.</p>
          </div>

          {showClear && (
            <button
               onClick={onClear}
               disabled={clearing}
               className={`shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded text-sm font-bold shadow-sm transition-colors ${clearing ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 cursor-pointer'}`}
             >
                {clearing ? "Clearing..." : "Clear History"}
             </button>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] overflow-hidden w-full flex flex-col">
          {/* Top Controls Bar */}
          <div className="p-5 border-b border-slate-100 flexitems-center justify-between bg-white text-slate-800">
            <div className="relative w-full max-w-xs">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                placeholder="Search mess or dish..."
                className="w-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl pl-11 pr-4 py-2.5 outline-none focus:border-slate-300 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Order ID</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Mess Facility</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Menu Item</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Amount</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Placed On</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.length === 0 ? (
                   <tr>
                     <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">No results matched your search.</td>
                   </tr>
                ) : (
                  filteredData.map((o) => {
                    const consumerIdToUse = o.consumer?._id ? String(o.consumer._id) : String(consumerid);
                    const canDownloadReceipt = o.status === "paid" || o.status === "completed" || o.done;

                    return (
                      <tr key={o._id} className="hover:bg-slate-50/60 transition-colors group">
                        
                        {/* Order ID */}
                        <td className="py-4 px-6">
                            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100/50 border border-slate-100 px-2 py-1 rounded-md">
                              {String(o._id).slice(0, 8)}
                            </span>
                        </td>
                        
                        {/* Mess Name */}
                        <td className="py-4 px-6">
                          {o.mess?._id ? (
                              <Link href={`/mess/${o.mess._id}`} className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors !no-underline flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 relative overflow-hidden group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                  {o.mess?.image?.url ? (
                                    <img src={o.mess.image.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                  ) : (
                                    o.mess.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                {o.mess.name}
                              </Link>
                          ) : (
                              <span className="text-sm font-medium text-slate-400">Unknown Mess</span>
                          )}
                        </td>

                        {/* Dish & Plates */}
                        <td className="py-4 px-6">
                            <p className="text-sm font-bold text-slate-700">{o.selectedDishName || "-"}</p>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              {o.noOfPlate ?? 0} {o.noOfPlate === 1 ? 'Plate' : 'Plates'}
                            </p>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-6 text-right">
                            <span className="text-sm font-black text-slate-800">
                              ₹{((o.totalPrice || 0) / 100).toFixed(2)}
                            </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-6">
                            {renderStatusBadge(o)}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 whitespace-nowrap">
                            <span className="text-sm font-bold text-slate-600 block">
                              {o.createdAt ? new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                              {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) : "-"}
                            </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                            <div className="flex gap-2 items-center justify-end scale-90 origin-right opacity-80 group-hover:opacity-100 transition-opacity">
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
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Footer stats if needed */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
             <span>Showing {filteredData.length} records</span>
          </div>
        </div>
      </div>
    </div>
  );
}
