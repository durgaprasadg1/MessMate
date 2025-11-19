"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import ProfileComponent from "../Others/ProfileComponent";
import { toast } from "react-toastify";
import ButtonComponent from "../Others/Button";

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
  const handleLogout = () => {
    signOut({ redirect: false })
      .then(() => {
        toast.success("Logged Out Successfully.");
        router.replace("/");
      })
      .catch((err) => {
        console.log("error While Logging out : ", err);
      });
  };

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


            <ButtonComponent data= "Pending Verification" link='/admin/pending-verification'/>
            <ButtonComponent data= "Analytics" link='/admin/analytics'/>
            <ButtonComponent data= "All Users" link='/admin/all-users'/>
            <ButtonComponent data= "All Messes" link='/admin/all-messes'/>
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
    </nav>
  );
};

export default AdminNavbar;
