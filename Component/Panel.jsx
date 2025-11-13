"use client";
import Botton from "./Botton";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
const Panel = ({ mess }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  console.log("Mess : ", mess);

  const openClose = async () => {
    try {
      const userId = session?.user?.id?.toString?.() ?? session?.user?.id;
      const ownerId = mess?.owner?.toString?.() ?? mess?.owner;
      if (userId !== ownerId) {
        console.log(session?.user);
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

      router.refresh();
      toast.success("Updated");
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const moveToUpdateInfoPage = () => {
    router.push(`mess/${mess._id}/edit-info`);
  };
  const moveToAddMenuPage = () => {
    router.push(`mess/${mess._id}/update-menu`);
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
        router.push("/mess");
      }
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const userId = session?.user?.id?.toString?.() ?? session?.user?.id;
  const ownerId = mess?.owner?.toString?.() ?? mess?.owner;

  if (userId && ownerId && userId === ownerId) {
    return (
      <div className="p-2 bg-transparent mt-4 flex items-center gap-3 justify-center ">
        <div className="max-w-5xl mx-auto mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap justify-center gap-4">
          <Botton
            text={mess.isOpen ? "🔒 Close" : "🔓 Open"}
            link={`/mess/${mess._id}`}
            mess={mess}
            functionAfterClick={openClose}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition px-4 py-2 rounded-lg font-medium"
          />
          <Botton
            text="📝 Update Menu"
            link={`/mess/${mess._id}/update-menu`}
            functionAfterClick={moveToAddMenuPage}
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 transition px-4 py-2 rounded-lg font-medium"
          />
          <Botton
            text="⚙️ Edit Mess Info"
            link={`/mess/${mess._id}/edit-info`}
            functionAfterClick={moveToUpdateInfoPage}
            mess={mess}
            className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition px-4 py-2 rounded-lg font-medium"
          />
          <Botton
            text="🗑️ Delete Mess"
            link={`/mess`}
            functionAfterClick={deleteMess}
            className="bg-red-100 text-red-700 hover:bg-red-200 transition px-4 py-2 rounded-lg font-medium"
          />
        </div>
      </div>
    );
  } else {
  }
};

export default Panel;
