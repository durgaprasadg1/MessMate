"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "../Others/Loading";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "../ShadCnUI/table";

const VerificationComponent = () => {
  const [pendingMesses, setPendingMesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingMesses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mess/pending", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch pending messes");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      setPendingMesses(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMesses();
  }, []);

  const handleVerify = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/mess/${id}/make-verified`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Verification failed");
      setPendingMesses((prev) => prev.filter((m) => m._id !== id));
      toast.success("Mess verified successfully!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/mess/${id}/deny-verification`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Denial failed");
      setPendingMesses((prev) => prev.filter((m) => m._id !== id));
      toast.info("Mess request denied.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formattedCategory = (c) =>
    c === "Both" || c === "both" ? "Veg + Non-Veg" : c;

  const columns = [
    {
      accessorKey: "name",
      header: "Mess Name",
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
      accessorKey: "phoneNumber",
      header: "Contact",
      cell: ({ row }) => (
        <span className="text-stone-900 text-sm sm:text-base">
          {row.original.phoneNumber}
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
      accessorKey: "isLimited",
      header: "Limited",
      cell: ({ row }) => (
        <span className="text-stone-900 text-sm sm:text-base">
          {row.original.isLimited ? "Yes" : "No"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-stone-900 text-sm sm:text-base">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "links",
      header: "Documents",
      cell: ({ row }) => {
        const mess = row.original;
        return (
          <div className="flex flex-wrap gap-2">
            <Link href={mess.image?.url || "#"} target="_blank">
              <button className="px-2 py-1 text-xs rounded bg-stone-900 text-white hover:bg-stone-800">
                Banner
              </button>
            </Link>
            <Link href={mess.certificate?.url || "#"} target="_blank">
              <button className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                Certificate
              </button>
            </Link>
            <Link
              href={`https://www.google.com/maps?q=${mess.lat},${mess.lon}`}
              target="_blank"
            >
              <button className="px-2 py-1 text-xs rounded bg-stone-100 text-stone-800 hover:bg-stone-200">
                Map
              </button>
            </Link>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const mess = row.original;
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleVerify(mess._id)}
              className="px-3 py-1 text-xs rounded bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
            >
              Verify
            </button>
            <button
              onClick={() => handleDeny(mess._id)}
              className="px-3 py-1 text-xs rounded bg-rose-500 font-semibold text-white hover:bg-rose-600"
            >
              Deny
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="relative p-3 sm:p-4 md:p-6 bg-transparent">
      {actionLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
          <Loading />
        </div>
      )}

      <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-4 sm:mb-6 md:mb-8">
        Mess Verification Panel
      </h1>

      {loading ? (
        <div className="flex justify-center py-12 sm:py-16 md:py-20">
          <Spinner />
        </div>
      ) : pendingMesses.length === 0 ? (
        <p className="text-center text-stone-500 text-base sm:text-lg py-8 sm:py-10">
          No pending messes for verification.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <DataTable
            columns={columns}
            data={pendingMesses.filter((m) => !m.isVerified)}
            colorVariant="stone"
          />
        </div>
      )}
    </div>
  );
};

export default VerificationComponent;
