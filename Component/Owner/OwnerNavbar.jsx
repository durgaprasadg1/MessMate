"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ButtonComponent from "../Others/Owner/Button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import ProfileComponent from "../Others/ProfileComponent";
import NotificationBell from "../Others/NotificationBell";

export default function OwnerNavbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-gray-900 text-white shadow-lg px-3 py-3 sm:px-6 sm:py-4"
    >
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-lg sm:text-xl md:text-2xl font-extrabold"
        >
          <Link href="/owner">
            <button className="text-white transition-colors duration-300 hover:text-gray-400">
              MessMate
            </button>
          </Link>
        </motion.div>

        <div className="hidden md:flex gap-3 items-center text-gray-300 text-base lg:text-lg">
          <ButtonComponent data="About" link="/owner/dashboard" />
          <ButtonComponent
            data="Add Your Mess"
            link={`/owner/${session?.user?.id}/new-mess`}
          />
          <ButtonComponent
            data="Details"
            link={`/owner/${session?.user?.id}/mess-details`}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-3">
            <NotificationBell />
            <ProfileComponent />
            <Button
              onClick={() => handleLogout()}
              className="bg-gray-600 hover:bg-black text-white flex items-center gap-2 px-4 py-2 rounded transition-colors duration-300"
            >
              <LogOut size={18} /> Logout
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <NotificationBell />
            <button
              className="text-white p-1"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 bg-opacity-50 z-50 md:hidden "
          onClick={() => setDrawerOpen(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-gray-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b bg-gray-800">
              <h2 className="text-lg font-bold text-gray-100">Menu</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded  hover:bg-gray-200  transition-colors "
                aria-label="Close menu"
              >
                <X size={20} className="text-gray-600 ml-1" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-700">
              <div className="pb-3 border-b">
                <ProfileComponent />
              </div>

              <div className="space-y-2">
                <ButtonComponent data="About" link="/owner/dashboard" />
                <ButtonComponent
                  data="Details"
                  link={`/owner/${session?.user?.id}/mess-details`}
                />
                <ButtonComponent
                  data="Add Your Mess"
                  link={`/owner/${session?.user?.id}/new-mess`}
                />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-700">
              <Button
                onClick={() => {
                  handleLogout();
                  setDrawerOpen(false);
                }}
                className="w-full bg-gray-600 hover:bg-gray-800 text-white flex items-center justify-center gap-2 py-3 rounded"
              >
                <LogOut size={18} /> Logout
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.nav>
  );
}
