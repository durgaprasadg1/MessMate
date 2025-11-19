"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {  LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import ButtonComponent from "../Others/Owner/Button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default  function OwnerNavbar() {
    const {data : session} = useSession();
    const router = useRouter();

    const handleLogout = async()=>{
        await signOut({ redirect: false });
        router.push("/");
    }
    console.log("Current User : ",session?.user?.id)

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

      <div className="hidden md:flex gap-8 items-center text-gray-300 text-lg">
        <ButtonComponent data="Dashboard" link='/owner/dashboard'/>
        <ButtonComponent data="Details" link={`/owner/${session?.user?.id}/mess-details`}/>
        <ButtonComponent data="Add Your Mess" link={`/owner/${session?.user?.id}/new-mess`}/>
        
      </div>

      <Button onClick={() => handleLogout()} className="bg-gray-600 hover:bg-black text-white flex items-center gap-2 px-5 py-2 rounded transition-colors duration-300  ">

            <LogOut size={18} /> Logout

        
      </Button>
    </motion.nav>
  );
}
