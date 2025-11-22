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
      className="w-full bg-gray-800 text-white shadow-lg px-6 py-4 flex justify-between items-center"
    >
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-xl sm:text-2xl font-extrabold text-gray-900"
      >
        <Link href="/owner">
          <button className="text-white transition-colors duration-300 hover:text-gray-700">
            MessMate
          </button>
        </Link>
      </motion.div>

      <div className="hidden md:flex gap-3 items-center text-gray-300 text-lg mr-2">

                <ButtonComponent data="Dashboard" link="/owner/dashboard" />

         <ButtonComponent
          data="Add Your Mess"
          link={`/owner/${session?.user?.id}/new-mess`}
        />
        <ButtonComponent
          data="Details"
          link={`/owner/${session?.user?.id}/mess-details`}
        />
      </div>
        
      <div className="ml-5 text-right">
          <ProfileComponent  />
      </div> 
      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleLogout()}
          className="bg-gray-600 hover:bg-black text-white flex items-center gap-2 px-5 py-2 rounded transition-colors duration-300  "
        >
          <LogOut size={18} /> Logout
        </Button>
        <button className="md:hidden ml-2" onClick={() => setDrawerOpen(true)}>
          <Menu size={22} />
        </button>
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg p-5 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button onClick={() => setDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <ButtonComponent data="Dashboard" link="/owner/dashboard" />
            <ButtonComponent
              data="Details"
              link={`/owner/${session?.user?.id}/mess-details`}
            />
            <ButtonComponent
              data="Add Your Mess"
              link={`/owner/${session?.user?.id}/new-mess`}
            />
            <div className="mt-auto">
              <Button
                onClick={() => {
                  handleLogout();
                  setDrawerOpen(false);
                }}
                className="w-full bg-gray-600 text-white"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
