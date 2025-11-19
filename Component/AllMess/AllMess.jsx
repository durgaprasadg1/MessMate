"use client";

import { useMemo, useState } from "react";
import Navbar from "../Others/Navbar";
import { useSession } from "next-auth/react";
import AdminNavbar from "../Admin/AdminNavbar";
import ButtonComponent from "../Others/Button";
import DialogBox from "../ShadCnUI/Dialog";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import EmptynessShowBox from "../Others/EmptynessShowBox";

export default function AllMesses({ messes = [], filteredMesses: passedFiltered }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMesses = useMemo(() => {
    if (passedFiltered) return passedFiltered;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return messes;
    return messes.filter((m) =>
      [m.name, m.description, m.address, m.ownerName, m.category]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [messes, searchQuery, passedFiltered]);

  const formattedCategory = (c) => (c === "Both" || c === "both" ? "Veg + Non-Veg" : c);

  const handleBlockingOfMess = async (id) => {
    try {
      const res = await fetch(`/api/admin/sendmsg/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        toast.error("Failed to block mess");
        return;
      }
      toast.success("Mess status updated");
      router.refresh();
    } catch {
      toast.error("Failed to block mess");
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
      toast.success("Deleted successfully");
      router.refresh();
    } catch {
      toast.error("Failed to delete mess");
    }
  };


 
  return (
    
    <>
    
      {isAdmin ? <AdminNavbar /> : <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
       {messes.length === 0 ?  
      ( 
        <EmptynessShowBox heading="No Messes Available Yet!" link={isAdmin ? "/admin" : "/"} linkmsg="Go to Home" />
      
    ):("")}

      <div className={isAdmin ? "py-8 px-4 sm:px-6 lg:px-8 bg-purple-200" : "py-8 px-4 sm:px-6 lg:px-8 mt-16"}>
        <h1 className="text-4xl font-extrabold text-center text-amber-800 mb-10 drop-shadow-md">
          🍱 All Mess Listings
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredMesses.map((mess) => {
            if (!mess.isVerified) return null;
            const { _id, name, description, address, image, owner, ownerName, category, isOpen } = mess;

            return (
              <div
                key={_id}
                className={`flex flex-col overflow-hidden rounded-2xl border ${
                  isAdmin ? "bg-purple-50 border-purple-200" : "bg-white border-gray-200"
                } shadow-sm hover:shadow-md transition-transform duration-300 hover:scale-[1.02]`}
              >
                <img
                  src={image?.url || "https://via.placeholder.com/400x250"}
                  alt={name}
                  className="w-full object-cover h-40 sm:h-48 md:h-56"
                />

                {!isAdmin && (
                  <div className="p-4 flex flex-col gap-3">
                    <h2 className="text-2xl font-bold text-amber-900">{name}</h2>
                    <p className="text-sm text-gray-600 italic">{formattedCategory(category)}</p>
                    <p className="text-gray-700 text-sm line-clamp-3">{description}</p>

                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-600 leading-tight">
                        <p>
                          <span className="font-semibold text-amber-700">Owner:</span> {ownerName}
                        </p>
                        <p>📍 {address?.split(",")[0] || "Unknown"}</p>
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
                )}

                <div className="p-4">
                  {session ? (
                    !isAdmin ? (
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
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <ButtonComponent
                            data="See Reviews & Ratings"
                            link={`/admin/all-messes/${_id}/reviews`}
                          />
                          
                          <button
                            onClick={() => handleBlockingOfMess(_id)}
                            className={mess.isBlocked ? "w-full px-4 py-1.5 bg-green-300 font-semibold  rounded text-white hover:bg-green-400 transition" : "bg-red-600 w-50 px-4 py-1.5 font-semibold text-black rounded hover:bg-red-400 transition"}
                          >
                            {mess.isBlocked ? "Unblock" : "Block"}
                          </button>

                          
                        </div>

                        <div className="flex items-center justify-around">
                          <DialogBox endpt={`/api/admin/sendmsg/${_id}`} />
                          <button
                            onClick={() => handleDeletingOfMess(_id)}
                            className="w-50 px-4 py-1.5  bg-red-600 font-semibold text-black rounded hover:bg-red-400 transition"
                          >
                            Delete
                          </button>

                        </div>
                      </div>
                    )
                  ) : (
                    <ButtonComponent data="Get More Info" link={`/mess/${_id}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
