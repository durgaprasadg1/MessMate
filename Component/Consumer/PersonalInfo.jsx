"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "@/Component/Others/Loading";
import { useSession } from "next-auth/react";
import { Pencil} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PersonalInfo({ consumerid }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.isAdmin;

  
  useEffect(() => {
    if (!consumerid) return;
    if (session === undefined) return;

    const fetchUser = async () => {
      try {
        const domain = session?.user?.isAdmin ? "admin" : "consumer";

        const res = await fetch(`/api/${domain}/${consumerid}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Error fetching user");
          return;
        }

        const pickedUser = data.consumer || data.admin;
        setUser(pickedUser);
        console.log("Fetched user:", user);
      } catch (err) {
        console.error("Error fetching user:", err);
        toast.error("Failed to fetch user info");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [consumerid, session]);
  
  const EditInfo = () =>{
    router.push(`/consumer/${consumerid}/edit-info`);
  }

  if (loading) return <Loading />;
  if (!user) return null;

  return (
    <div className={isAdmin? "min-h-screen bg-violet-100 flex items-center justify-center py-14" :"min-h-screen bg-gray-50 flex items-center justify-center py-14"}>
      <div className={isAdmin?"bg-purple-50 rounded-2xl shadow-xl p-8 w-full max-w-3xl border border-gray-100": "bg-white rounded-2xl shadow-xl p-8 w-full max-w-3xl border border-gray-100"}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>Personal Information</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Update your personal information and manage your account settings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            
              {isAdmin? "" :
              (<>
              <button className="text-black" onClick={EditInfo}><div className="flex items-center justify-center"><Pencil size={16} /> </div> </button>
              </>)}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-600 font-medium text-sm">Name</label>
            <div className="mt-1 p-3 bg-gray-100 rounded-lg border border-gray-200">
              {isAdmin ? user.name : user.username}
            </div>
          </div>

          <div>
            <label className="text-gray-600 font-medium text-sm">Email</label>
            <div className="mt-1 p-3 bg-gray-100 rounded-lg border border-gray-200">
              {user.email}
            </div>
          </div>

          <div>
            <label className="text-gray-600 font-medium text-sm">Phone</label>
            <div className="mt-1 p-3 bg-gray-100 rounded-lg border border-gray-200">
              {isAdmin ? user.phoneNumber : user.phone}
            </div>
          </div>

          <div>
            <label className="text-gray-600 font-medium text-sm">Address</label>
            <div className="mt-1 p-3 bg-gray-100 rounded-lg border border-gray-200">
              {user.address}
            </div>
          </div>

          <div>
            <label className="text-gray-600 font-medium text-sm">
              Account Role
            </label>
            <div className="mt-1 p-3 bg-gray-100 rounded-lg border border-gray-200 flex items-center gap-2">
              <span>{isAdmin ? "Admin" : "User"}</span>
              <span className="px-2 py-1 bg-gray-200 rounded-full text-xs">
                {isAdmin ? "Admin" : "User"}
              </span>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}
