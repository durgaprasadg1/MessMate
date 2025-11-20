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
    <nav className="bg-purple-300 border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-6 gap-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-2xl font-extrabold text-gray-700"
            >
              <Link href="/admin" className="  ">
                <button className="text-gray-600 transition-colors duration-300 hover:text-black">
                  MessMate
                </button>
              </Link>
            </motion.div>

            <div className="hidden md:flex items-center gap-3">
              <ButtonComponent
                data="Pending Verification"
                link="/admin/pending-verification"
              />
              <ButtonComponent data="Analytics" link="/admin/analytics" />
              <ButtonComponent data="All Users" link="/admin/all-users" />
              <ButtonComponent data="All Messes" link="/admin/all-messes" />
            </div>
            <button
              className="md:hidden text-gray-700"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <ProfileComponent />
            <button
              onClick={() => handleLogout()}
              className="bg-white text-black px-2 py-2 rounded shadow-md hover:bg-[#60D19B] transition duration-300"
            >
              Logout
            </button>
          </div>
        </div>
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
            <ButtonComponent
              data="Pending Verification"
              link="/admin/pending-verification"
            />
            <ButtonComponent data="Analytics" link="/admin/analytics" />
            <ButtonComponent data="All Users" link="/admin/all-users" />
            <ButtonComponent data="All Messes" link="/admin/all-messes" />
            <div className="mt-auto">
              <ProfileComponent />
              <button
                onClick={() => {
                  handleLogout();
                  setDrawerOpen(false);
                }}
                className="w-full bg-gray-600 text-white px-3 py-2 rounded mt-3"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
