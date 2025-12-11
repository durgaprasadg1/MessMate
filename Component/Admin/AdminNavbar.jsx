"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import ProfileComponent from "../Others/ProfileComponent";
import { toast } from "react-toastify";
import ButtonComponent from "../Others/Button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const AdminNavbar = () => {
  const router = useRouter();
  const pathname = usePathname() || "";
  const linkClass = (p) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      pathname === p
        ? "bg-gray-800 text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  const handleClick = (path) => {
    router.push(path);
  };
  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Logged Out Successfully.");
    router.push("/");
  };

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <nav className="bg-zinc-900 border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-lg sm:text-xl md:text-2xl font-extrabold"
            >
              <Link href="/admin">
                <button className="text-amber-400 transition-colors duration-300 hover:text-amber-500">
                  MessMate
                </button>
              </Link>
            </motion.div>

            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              <ButtonComponent
                data="Pending Verification"
                link="/admin/pending-verification"
              />
              <ButtonComponent data="All Users" link="/admin/all-users" />
              <ButtonComponent data="All Messes" link="/admin/all-messes" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-3">
              <ProfileComponent />
              <button
                onClick={() => handleLogout()}
                className="bg-amber-300 text-black px-3 py-2 rounded shadow-md hover:bg-amber-400 transition duration-300 text-sm font-medium"
              >
                Logout
              </button>
            </div>

            <button
              className="md:hidden text-white p-1"
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
          className="fixed inset-0  bg-opacity-50 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b bg-zinc-900">
              <h2 className="text-lg font-bold text-gray-800">Admin Menu</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-amber-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} className="text-gray-600 ml-1" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-800">
              <div className="pb-3 border-b">
                <ProfileComponent />
              </div>

              <div className="space-y-2">
                <ButtonComponent
                  data="Pending Verification"
                  link="/admin/pending-verification"
                />
                <ButtonComponent data="All Users" link="/admin/all-users" />
                <ButtonComponent data="All Messes" link="/admin/all-messes" />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-950">
              <button
                onClick={() => {
                  handleLogout();
                  setDrawerOpen(false);
                }}
                className="w-full bg-amber-400 hover:bg-amber-500 text-black font-medium px-3 py-3 rounded shadow-md transition duration-300"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
