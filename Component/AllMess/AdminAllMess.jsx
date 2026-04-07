"use client";

import { useMemo, useState } from "react";
import AdminSidebar from "../Admin/AdminSidebar";
import { toast } from "react-toastify";
import { DataTable } from "../ShadCnUI/table";
import DialogBox from "../ShadCnUI/Dialog";
import ButtonComponent from "../Others/Button";
import Loading from "../Others/Loading";

export default function AdminAllMesses({
  messes = [],
  filteredMesses: passedFiltered,
}) {
  const [searchQuery] = useState("");
  const [messesState, setMessesState] = useState(messes);

  const [actionLoading, setActionLoading] = useState(false);

  const filteredMesses = useMemo(() => {
    if (passedFiltered) return passedFiltered;
    return messesState;
  }, [messesState, passedFiltered]);

  const visibleMesses = useMemo(
    () => filteredMesses.filter((m) => m.isVerified),
    [filteredMesses]
  );

  const formattedCategory = (c) =>
    c === "Both" || c === "both" ? "Veg + Non-Veg" : c;

  const handleBlockingOfMess = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/sendmsg/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) return toast.error("Failed to update mess status");

      setMessesState((prev) =>
        prev.map((m) => (m._id === id ? { ...m, isBlocked: !m.isBlocked } : m))
      );

      toast.success("Mess status updated");
    } catch {
      toast.error("Failed to update mess status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletingOfMess = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/mess/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) return toast.error("Failed to delete mess");

      setMessesState((prev) => prev.filter((m) => m._id !== id));
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete mess");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWarningMail = async (owner) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/warn-mess-owner/${owner}`, {
        method: "POST",
      });

      if (!res.ok) return toast.error("Failed to send warning");

      const data = await res.json();
      toast.success(data.message || "Warning sent");
    } catch {
      toast.error("Failed to send warning");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-semibold text-stone-900 text-sm sm:text-base">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "ownerName",
      header: "Owner",
      cell: ({ row }) => (
        <span className="text-stone-900 text-sm sm:text-base">
          {row.original.ownerName}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-stone-900 text-sm sm:text-base">
          {formattedCategory(row.original.category)}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-stone-900 text-sm sm:text-base">
          {row.original.phoneNumber}
        </span>
      ),
    },
    {
      accessorKey: "isOpen",
      header: "Status",
      cell: ({ row }) => {
        const isOpen = row.original.isOpen;
        return (
          <span
            className={
              isOpen
                ? "bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs"
                : "bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs"
            }
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const mess = row.original;

        return (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-stone-900">
            <ButtonComponent
              data="Reviews"
              link={`/admin/all-messes/${mess._id}/reviews`}
            />

            <DialogBox endpt={`/api/admin/sendmsg/${mess._id}`} />

            <button
              onClick={() => handleSendWarningMail(mess.owner)}
              className="px-2 sm:px-3 py-1 text-xs rounded bg-amber-200 font-semibold text-stone-900 whitespace-nowrap"
            >
              Warn
            </button>

            <button
              onClick={() => handleBlockingOfMess(mess._id)}
              className={
                mess.isBlocked
                  ? "bg-emerald-100 px-2 sm:px-3 py-1 rounded text-emerald-800 font-bold text-xs whitespace-nowrap"
                  : "bg-rose-100 px-2 sm:px-3 py-1 rounded text-rose-700 font-bold text-xs whitespace-nowrap"
              }
            >
              {mess.isBlocked ? "Unblock" : "Block"}
            </button>

            <button
              onClick={() => handleDeletingOfMess(mess._id)}
              className="px-2 sm:px-3 py-1 text-xs rounded bg-rose-200 font-semibold text-rose-800 whitespace-nowrap"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="relative role-shell">
      <AdminSidebar />

      {actionLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
          <Loading />
        </div>
      )}

      <main className="role-container">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-4 sm:mb-6 md:mb-8">
          All Mess Listings
        </h1>

        <div className="overflow-x-auto rounded-lg">
          <DataTable columns={columns} data={visibleMesses} colorVariant="stone" />
        </div>
      </main>
    </div>
  );
}
