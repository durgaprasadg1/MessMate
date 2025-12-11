"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminNavbar from "@/Component/Admin/AdminNavbar";
import NotFound from "../../not-found";
import { DataTable } from "../../../Component/ShadCnUI/table";
import { toast } from "react-toastify";
import Loading from "../../../Component/Others/Loading";

export default function AllUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("/api/consumer", { cache: "no-store" });

        if (!res.ok) {
          setError("Some Error Occured");
          return;
        }

        const data = await res.json();
        setUsers(data || []);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleToggleBlock = async (user) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/blockings/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleOpen" }),
      });

      if (!res.ok) {
        toast.error("Something error occurred while blocking the user");
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isBlocked: !u.isBlocked } : u
        )
      );

      toast.success(!user.isBlocked ? "User Blocked" : "User Unblocked");
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWarningMail = async (user) => {
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/warn-user/${user._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        toast.error("Failed to send warning");
        return;
      }

      const data = await res.json();
      toast.success(data.message);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send warning");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "username",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-white text-sm sm:text-base">
          {row.original.username}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-medium text-white text-sm sm:text-base">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-medium text-white text-sm sm:text-base">
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: "orders",
      header: "Orders",
      cell: ({ row }) => (
        <span className="font-medium text-white text-sm sm:text-base">
          {row.original.orders?.length || 0}
        </span>
      ),
    },
    {
      accessorKey: "reviews",
      header: "Reviews",
      cell: ({ row }) => (
        <span className="font-medium text-white text-sm sm:text-base">
          {row.original.reviews?.length || 0}
        </span>
      ),
    },
    {
      accessorKey: "isBlocked",
      header: "Status",
      cell: ({ row }) => {
        const blocked = row.original.isBlocked;
        return (
          <span
            className={
              blocked
                ? "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
                : "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
            }
          >
            {blocked ? "Blocked" : "Active"}
          </span>
        );
      },
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {user.reviews?.length > 0 && (
              <Link
                href={`/consumer/${user._id}/reviews`}
                className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap"
              >
                Reviews
              </Link>
            )}

            <button
              className="text-xs px-2 py-1 rounded bg-yellow-300 text-black hover:bg-yellow-400 whitespace-nowrap"
              onClick={() => handleSendWarningMail(user)}
            >
              Warn
            </button>

            <button
              className={
                !user.isBlocked
                  ? "text-xs px-2 py-1 rounded bg-red-300 text-black hover:bg-red-400 whitespace-nowrap"
                  : "text-xs px-2 py-1 rounded bg-green-300 text-black hover:bg-green-400 whitespace-nowrap"
              }
              onClick={() => handleToggleBlock(user)}
            >
              {user.isBlocked ? "Unblock" : "Block"}
            </button>
          </div>
        );
      },
    },
  ];

  if (error) return <NotFound />;

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-900">
        <AdminNavbar />
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <Loading />
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen bg-zinc-900">
      <AdminNavbar />

      {actionLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <Loading />
        </div>
      )}

      <main className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6">
        <h1 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-white">
          All Users
        </h1>

        {users.length === 0 ? (
          <p className="text-gray-400 text-sm sm:text-base">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <DataTable columns={columns} data={users} />
          </div>
        )}
      </main>
    </div>
  );
}
