"use client";

import { useMemo, useState } from "react";
import Navbar from "../Others/Navbar";
import { useSession } from "next-auth/react";
import AdminNavbar from "../Admin/AdminNavbar";
import ButtonComponent from "../Others/Button";
import DialogBox from "../ShadCnUI/Dialog";
import { toast } from "react-toastify";
import EmptynessShowBox from "../Others/EmptynessShowBox";
import { DataTable } from "../ShadCnUI/table";

export default function AllMesses({ messes = [], filteredMesses: passedFiltered }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;
  const [searchQuery, setSearchQuery] = useState("");
  const [messesState, setMessesState] = useState(messes);

  const filteredMesses = useMemo(() => {
    if (passedFiltered) return passedFiltered;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return messesState;

    return messesState.filter((m) =>
      [m.name, m.description, m.address, m.ownerName, m.category]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [messesState, searchQuery, passedFiltered]);

  const visibleMesses = useMemo(
    () => filteredMesses.filter((m) => m.isVerified),
    [filteredMesses]
  );

  const formattedCategory = (c) =>
    c === "Both" || c === "both" ? "Veg + Non-Veg" : c;

  const handleBlockingOfMess = async (id) => {
    try {
      const res = await fetch(`/api/admin/sendmsg/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        toast.error("Failed to update mess status");
        return;
      }

      setMessesState((prev) =>
        prev.map((m) => (m._id === id ? { ...m, isBlocked: !m.isBlocked } : m))
      );

      toast.success("Mess status updated");
    } catch {
      toast.error("Failed to update mess status");
    }
  };

  const handleDeletingOfMess = async (id) => {
    try {
      const res = await fetch(`/api/mess/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        toast.error("Failed to delete mess");
        return;
      }

      setMessesState((prev) => prev.filter((m) => m._id !== id));
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete mess");
    }
  };

  const handleSendWarningMail = async (owner) => {
    try {
      const res = await fetch(`/api/admin/warn-mess-owner/${owner}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        toast.error("Failed to send warning");
        return;
      }

      const data = await res.json();
      toast.success(data.message || "Warning sent");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send warning");
    }
  };

  // Table columns for admin
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-semibold text-white">{row.original.name}</span>,
    },
    {
      accessorKey: "ownerName",
      header: "Owner",
      cell: ({ row }) => <span className="text-white">{row.original.ownerName || "N/A"}</span>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span className="text-white">{formattedCategory(row.original.category)}</span>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <span className="text-white">
          {row.original.address ? row.original.address.split(",")[0] : "Unknown"}
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
                ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
                : "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
            }
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        );
      },
    },
    {
      accessorKey: "isBlocked",
      header: "Blocked",
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
        const mess = row.original;
        return (
          <div className="flex flex-wrap gap-2 text-white">
            <ButtonComponent data="Reviews" link={`/admin/all-messes/${mess._id}/reviews`} />

            <DialogBox endpt={`/api/admin/sendmsg/${mess._id}`} />

            <button
              onClick={() => handleSendWarningMail(mess.owner)}
              className="px-3 py-1 text-xs rounded bg-yellow-300 font-semibold text-black hover:bg-yellow-600 transition"
            >
              Send Warning
            </button>

            <button
              onClick={() => handleBlockingOfMess(mess._id)}
              className={
                mess.isBlocked
                  ? "px-3 py-1 text-xs rounded bg-green-300 font-semibold text-white hover:bg-green-400 transition"
                  : "px-3 py-1 text-xs rounded bg-red-600 font-semibold text-black hover:bg-red-400 transition"
              }
            >
              {mess.isBlocked ? "Unblock" : "Block"}
            </button>

            <button
              onClick={() => handleDeletingOfMess(mess._id)}
              className="px-3 py-1 text-xs rounded bg-red-600 font-semibold text-black hover:bg-red-400 transition"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  const headingClasses = "text-3xl sm:text-4xl font-extrabold mb-8 drop-shadow-md";

  // whether there are any visible messes to show in the list/table
  const hasVisibleMesses = visibleMesses.length > 0;

  return (
    <>
      {/* Navbar */}
      {isAdmin ? (
        <AdminNavbar />
      ) : (
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      )}

      {!hasVisibleMesses ? (
        <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-900">
          <EmptynessShowBox
            heading="No Messes Available Yet!"
            link={isAdmin ? "/admin" : "/"}
            linkmsg="Go to Home"
          />
        </main>
      ) : (

        <main
          className={
            isAdmin
              ? "py-8 px-4 sm:px-6 lg:px-8 bg-zinc-800 min-h-screen"
              : "py-8 px-4 sm:px-6 lg:px-8 mt-20"
          }
        >
          <h1 className={isAdmin ? `${headingClasses} text-white` : `${headingClasses} text-center`}>
            All Mess Listings
          </h1>

          {isAdmin ? (
            visibleMesses.length === 0 ? (
              <p className="text-center text-gray-300">No verified messes.</p>
            ) : (
              <div className="overflow-auto rounded-lg">
                <DataTable columns={columns} data={visibleMesses} />
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {visibleMesses.map((mess) => {
                if (mess.isBlocked) return null;

                const {
                  _id,
                  name,
                  description,
                  address,
                  image,
                  owner,
                  ownerName,
                  category,
                  isOpen,
                } = mess;

                return (
                  <article
                    key={_id}
                    className="flex flex-col overflow-hidden rounded-2xl border bg-white border-gray-200 shadow-sm hover:shadow-md transition-transform duration-300 hover:scale-[1.02]"
                    role="article"
                  >
                    <div className="w-full h-40 sm:h-48 md:h-56 overflow-hidden rounded-t-2xl">
                      <img
                        src={image?.url || "https://via.placeholder.com/800x500"}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-amber-900">{name}</h2>
                      <p className="text-sm text-gray-600 italic">{formattedCategory(category)}</p>
                      <p className="text-gray-700 text-sm line-clamp-3">{description}</p>

                      <div className="flex justify-between items-start mt-auto">
                        <div className="text-sm text-gray-600 leading-tight">
                          <p>
                            <span className="font-semibold text-amber-700">Owner:</span> {ownerName}
                          </p>
                          <p className="mt-1">📍 {address?.split(",")[0] || "Unknown"}</p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isOpen ? "Open" : "Closed"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      {session ? (
                        <div className="flex flex-col sm:flex-row items-stretch gap-3">
                          <ButtonComponent data="Get More Info" link={`/mess/${_id}`} />

                          {session.user.id === owner && (
                            <div className="flex flex-row gap-2 w-full sm:w-auto">
                              <ButtonComponent data="Messages" link={`/mess/${_id}/messages`} />
                              <ButtonComponent data="See Orders" link={`/mess/${_id}/orders`} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <ButtonComponent data="Get More Info" link={`/mess/${_id}`} />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}
    </>
  );
}
