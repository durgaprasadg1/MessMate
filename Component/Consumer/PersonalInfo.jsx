"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "@/Component/Others/Loading";
import { useSession } from "next-auth/react";
import { Pencil, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PersonalInfo({ consumerid }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.isAdmin;
  const isOwner = session?.user?.isOwner;

  useEffect(() => {
    if (!consumerid || !session) return;

    const fetchUser = async () => {
      try {
        const adminFlag = session.user?.isAdmin;
        const ownerFlag = session.user?.isOwner;

        const domain = adminFlag ? "admin" : ownerFlag ? "owner" : "consumer";

        const res = await fetch(`/api/${domain}/${consumerid}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Error fetching user");
          return;
        }

        const pickedUser = data.consumer || data.admin || data.owner;
        setUser(pickedUser);
      } catch (err) {
        console.error("Error fetching user:", err);
        toast.error("Failed to fetch user info");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [consumerid, session]);

  const EditInfo = () => {
    router.push(`/consumer/${consumerid}/edit-info`);
  };

  if (loading) return <Loading />;
  if (!user) return null;

  const getRoleDisplay = () => {
    if (isAdmin) return { text: "System Administrator" };
    if (isOwner) return { text: "Mess Owner" };
    return { text: "Registered Consumer" };
  };

  const roleDisplay = getRoleDisplay();

  const rawName = isAdmin || isOwner ? user.name : user.username;
  const nameParts = rawName ? rawName.trim().split(" ") : ["Unknown"];
  const firstName = nameParts[0] || "-";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "-";
  const userPhone = isAdmin || isOwner ? user.phoneNumber : user.phone;

  return (
    <div className="min-h-screen bg-slate-50 md:pl-[25vw] flex flex-col transition-[padding] duration-0 ease-linear">
      <div className="p-6 sm:p-10 w-full max-w-4xl mx-auto flex-1 mt-16 md:mt-0 space-y-6">
        
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">
          My Profile
        </h2>

        <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
           className="space-y-6"
        >
          {/* CARD 1: Avatar Header */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_2px_24px_-4px_rgba(0,0,0,0.04)] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="w-24 h-24 shrink-0 rounded-full bg-slate-100 border-4 border-slate-50 overflow-hidden shadow-sm flex items-center justify-center text-4xl font-black text-slate-300">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">{rawName || "Unknown User"}</h3>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{roleDisplay.text}</p>
                <p className="text-sm font-semibold text-slate-500 mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                  <MapPin size={14} className="text-orange-500" /> 
                  {user.address || "No address provided"}
                </p>
              </div>
            </div>
            
            {!isAdmin && !isOwner && (
              <button
                onClick={EditInfo}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                Edit <Pencil size={12} />
              </button>
            )}
          </div>

          {/* CARD 2: Personal Information */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_2px_24px_-4px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800">Personal information</h3>
              {!isAdmin && !isOwner && (
                 <button
                   onClick={EditInfo}
                   className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                 >
                   Edit <Pencil size={12} />
                 </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">First Name</p>
                <p className="text-sm font-bold text-slate-800">{firstName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Last Name</p>
                <p className="text-sm font-bold text-slate-800">{lastName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email address</p>
                <p className="text-sm font-bold text-slate-800">{user.email || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone</p>
                <p className="text-sm font-bold text-slate-800">{userPhone || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bio / Role</p>
                <p className="text-sm font-bold text-slate-800">{roleDisplay.text}</p>
              </div>
            </div>
          </div>

          {/* CARD 3: Address & Account Info */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_2px_24px_-4px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800">Address & Account</h3>
              {!isAdmin && !isOwner && (
                 <button
                   onClick={EditInfo}
                   className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                 >
                   Edit <Pencil size={12} />
                 </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Address</p>
                <p className="text-sm font-bold text-slate-800">{user.address || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">System Account ID</p>
                <p className="text-sm font-bold text-slate-600 font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded inline-block">{user._id || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Account Status</p>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                </p>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}