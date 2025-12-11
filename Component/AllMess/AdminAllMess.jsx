"use client";

import { useMemo, useState } from "react";
import AdminNavbar from "../Admin/AdminNavbar";
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
        <span className="font-semibold text-white text-sm sm:text-base">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "ownerName",
      header: "Owner",
      cell: ({ row }) => (
        <span className="text-white text-sm sm:text-base">
          {row.original.ownerName}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-white text-sm sm:text-base">
          {formattedCategory(row.original.category)}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-white text-sm sm:text-base">
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
          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-white">
            <ButtonComponent
              data="Reviews"
              link={`/admin/all-messes/${mess._id}/reviews`}
            />

            <DialogBox endpt={`/api/admin/sendmsg/${mess._id}`} />

            <button
              onClick={() => handleSendWarningMail(mess.owner)}
              className="px-2 sm:px-3 py-1 text-xs rounded bg-yellow-300 font-semibold text-black whitespace-nowrap"
            >
              Warn
            </button>

            <button
              onClick={() => handleBlockingOfMess(mess._id)}
              className={
                mess.isBlocked
                  ? "bg-green-400 px-2 sm:px-3 py-1 rounded text-white font-bold text-xs whitespace-nowrap"
                  : "bg-red-600 px-2 sm:px-3 py-1 rounded text-white font-bold text-xs whitespace-nowrap"
              }
            >
              {mess.isBlocked ? "Unblock" : "Block"}
            </button>

            <button
              onClick={() => handleDeletingOfMess(mess._id)}
              className="px-2 sm:px-3 py-1 text-xs rounded bg-red-600 font-semibold text-white whitespace-nowrap"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="relative">
      <AdminNavbar />

      {actionLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <Loading />
        </div>
      )}

      <main className="py-4 sm:py-6 md:py-8 px-3 sm:px-4 bg-zinc-800 min-h-screen">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 sm:mb-6 md:mb-8">
          All Mess Listings
        </h1>

        <div className="overflow-x-auto rounded-lg">
          <DataTable columns={columns} data={visibleMesses} />
        </div>
      </main>
    </div>
  );
}
