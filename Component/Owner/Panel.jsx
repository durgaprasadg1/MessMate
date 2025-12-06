"use client";
import Botton from "../Others/Botton";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
const Panel = ({ mess }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const openClose = async () => {
    try {
      const userId = session?.user?.id?.toString?.() ?? session?.user?.id;
      const ownerId = mess?.owner?.toString?.() ?? mess?.owner;
      if (userId !== ownerId) {
        toast.error("U Are Not the Owner");
        return;
      }
      await fetch(`/api/mess/${mess._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "toggleOpen" }),
      });

      if (mess.isOpen){
        toast.success("Closed Successfully");
      } else {
        toast.success("Opened Successfully");
      }
      window.location.reload()

    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

 
  const deleteMess = async () => {
    if (!confirm("Are you sure you want to delete this mess?")) return;
    try {
      let res = await fetch(`/api/mess/${mess._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error("Error: " + err.message);
      } else {
        toast.success("Mess deleted successfully");
        router.push(`/owner/${session?.user?.id}/mess-details`);
      }
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const userId = session?.user?.id?.toString?.() ?? session?.user?.id;
  const ownerId = mess?.owner?.toString?.() ?? mess?.owner;

  if (userId && ownerId && userId === ownerId && !mess.isBlocked) {
    
    return (
        <div className="flex gap-1">
         
          <div className="flex items-center justify-around gap-1">
            <Botton
              text={mess.isOpen ? "Close" : "Open"}
              link={`/owner/${session?.user?.id}/mess-details`}
              mess={mess}
              functionAfterClick={openClose}
              className="w-full text-center bg-gray-700 text-white py-3 rounded  hover:bg-black transition font-medium"
            />
             
          </div>
          <div className="flex items-center justify-around gap-1" >
            <Botton
              text="Menu"
              link={`/mess/${mess._id}/update-menu`}
              className="w-full text-center bg-blue-600 text-white py-3 rounded  hover:bg-blue-800 transition font-medium"
            />
         

            <Botton
              text="Edit "
              link={`/mess/${mess._id}/edit-info`}
              mess={mess}
              className="w-full text-center bg-yellow-600 text-white py-3 rounded  hover:bg-yellow-700 transition font-medium"
            />
          </div>
          <Botton
              text="Delete"
              link={`/mess`}
              functionAfterClick={deleteMess}
              className="w-full text-center bg-red-600 text-white py-3 rounded-xl hover:bg-red-800 transition font-medium"
            />


           

        </div>                                                              

      
    );
  } else if(mess.isBlocked){
    return (
      <div className="flex gap-1">
        <h2 className="w-full text-center bg-red-600 text-white py-3 rounded-xl  font-medium">
          This Mess is Blocked wait for Owner's Action. It Will be Unblocked Soon.
        </h2>
      </div>
    )
  }
};

export default Panel;
