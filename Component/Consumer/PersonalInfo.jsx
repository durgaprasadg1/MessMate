"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "@/Component/Others/Loading";
import { useSession } from "next-auth/react";
import {
  Pencil,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  UserCheck,
  Building,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PersonalInfo({ consumerid }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.isAdmin;
  const isOwner = session?.user?.isOwner;

  const role = isAdmin ? "admin" : isOwner ? "owner" : "user";

  const themeConfig = {
    user: {
      bgClass: "min-h-screen  flex items-center justify-center py-14",
      cardClass:
        "bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-4xl border border-gray-100",
      titleColor: "text-gray-900",
      labelColor: "text-gray-500",
      fieldBg: "bg-gray-100 text-gray-800 border-gray-200",
      accentColor: "text-indigo-600",
    },
    owner: {
      bgClass: "min-h-screen  flex items-center justify-center py-14",
      cardClass:
        "bg-gray-800 rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-4xl border border-gray-700",
      titleColor: "text-white",
      labelColor: "text-gray-400",
      fieldBg: "bg-gray-700 text-white border-gray-600",
      accentColor: "text-teal-400",
    },
    admin: {
      bgClass:
        "min-h-screen flex items-center justify-center py-14",
      cardClass:
        "bg-white rounded-2xl shadow-xl p-8 sm:p-10 w-full max-w-4xl border border-purple-200",
      titleColor: "text-purple-800",
      labelColor: "text-gray-600",
      fieldBg: "bg-purple-100 text-purple-900 border-purple-300",
      accentColor: "text-purple-600",
    },
  };

  const currentTheme = themeConfig[role];

  useEffect(() => {
  if (!consumerid || !session) return; 

  const fetchUser = async () => {
    try {
      const isAdmin = session.user?.isAdmin;
      const isOwner = session.user?.isOwner;
      
      const domain = isAdmin ? "admin" : isOwner ? "owner" : "consumer";

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

  const dataFields = [
    {
      label: "Full Name",
      value: isAdmin || isOwner ? user.name : user.username,
      icon: User,
    },
    { label: "Email Address", value: user.email, icon: Mail },
    {
      label: "Phone Number",
      value: isAdmin || isOwner ? user.phoneNumber : user.phone,
      icon: Phone,
    },
    { label: "Residential Address", value: user.address, icon: MapPin },
  ];

  const getRoleDisplay = () => {
    if (isAdmin)
      return {
        text: "System Administrator",
        icon: UserCheck,
        color: "bg-red-500/20 text-red-400",
      };
    if (isOwner)
      return {
        text: "Mess Owner",
        icon: Building,
        color: "bg-teal-500/20 text-teal-400",
      };
    return {
      text: "Registered User",
      icon: Briefcase,
      color: "bg-indigo-500/20 text-indigo-400",
    };
  };

  const roleDisplay = getRoleDisplay();

  const FieldCard = ({ label, value, icon: Icon }) => ( 
    <div className="">
      <label className={`${currentTheme.labelColor} font-semibold text-xs flex items-center mb-1`}>
        <div className="flex items-center gap-0">
        <Icon size={14} className={`mr-2 ${currentTheme.accentColor}`} />
         {label}
       </div>
      </label>
      <div
        className={`mt-1 p-3 rounded-xl border font-medium text-sm ${currentTheme.fieldBg} transition duration-200`}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div className={currentTheme.bgClass}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={currentTheme.cardClass}
      >
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <h1
              className={`text-3xl font-extrabold ${currentTheme.titleColor} flex items-center gap-3`}
            >
              <User size={28} className={currentTheme.accentColor} />
              <span>Personal Information</span>
            </h1>
            {!isOwner && !isAdmin && (
              <p className="text-gray-400 text-sm mt-1">
                View your current account details. Use the edit button to update.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isAdmin && !isOwner && (
              <button
                className={`flex items-center justify-center p-2 rounded-full border transition duration-300 ${
                  currentTheme.bgClass.includes("dark")
                    ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
                onClick={EditInfo}
                title="Edit Personal Information"
              >
                <Pencil size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {dataFields.map((field) => (
              <FieldCard key={field.label} {...field} />
            ))}
          </div>

          <div>
            <label className={`${currentTheme.labelColor} font-semibold text-xs flex items-center mb-1`}>
              <Briefcase size={14} className={`mr-2 ${currentTheme.accentColor}`} />
              Account Role
            </label>
            <div
              className={`mt-1 p-3 rounded-xl border font-medium text-sm ${currentTheme.fieldBg} flex items-center justify-between`}
            >
              <span>{roleDisplay.text}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${roleDisplay.color}`}
              >
                {roleDisplay.text.split(" ").pop()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}