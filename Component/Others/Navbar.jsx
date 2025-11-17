"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast } from "react-toastify";
import { usePathname, useRouter } from "next/navigation";
import ProfileComponent from "./ProfileComponent";
import ButtonComponent from "./Button";
import AdminLandingPage from '../../app/admin/page'
const Navbar = ({ searchQuery, setSearchQuery }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;
  const pathname = usePathname();

  const router = useRouter();
  const handleLogout = () => {
    signOut({ redirect: false })
      .then(() => {
        toast.success("Logged Out Successfully.")
        router.replace("/mess")
      
      })
      .catch((err) => {
        console.log("error While Logging out : ", err);
      });
  };

  const handleHistoryClick = async () => {
    router.push(`/consumer/${session?.user?.id}/history`);
  };
  const handlenewmess = async () => {
    router.push(`/consumer/${session?.user?.id}/new-mess`);
  };

  const handleLoginClick = async () => {
    router.push("/login");
    await signIn();

    router.refresh();
    
  };

  
 
  return (
   
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-2xl font-extrabold text-gray-700"
          >
            <Link href="/" className="  ">
              <button className="text-gray-600 transition-colors duration-300 hover:text-black">
                MessMate
              </button>
            </Link>
          </motion.div>
        {session?.user && !isAdmin && (

          <div className="hidden md:flex gap-6 text-gray-700 font-medium">
            <Link href="/" className="  ">
              <button className="text-gray-600 hover:text-black">Home</button>
            </Link>

           
              <button
                className="text-gray-600 hover:text-black"
                onClick={handleHistoryClick}
              >
                Your Orders
              </button>
              
              <button
                className="text-gray-600 hover:text-black"
                onClick={handlenewmess}
              >
                Add New Mess
              </button>
            </div>
            )}
          
        </div>


        {pathname === "/mess" ? (
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 shadow-sm w-80">
            <input
              type="text"
              value={searchQuery ?? ""}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Search Mess..."
              className="bg-transparent outline-none flex text-sm text-gray-700 placeholder-gray-500"
            />
            <button
              onClick={() => {
              }}
              className="bg-gray-600 hover:bg-black text-white px-3 py-1 rounded text-sm flex items-center gap-1  duration-300 hover:text-black"
            >
              <Search size={16} /> Search
            </button>
          </div>
        ) : (
          ""
        )}

        {session ? (
          <div className="flex items-center gap-4 rounded">
            <ProfileComponent  />
            <button
              onClick={() => handleLogout()}
              className="bg-gray-600 text-white px-2 py-2 rounded shadow-md hover:bg-black transition duration-300"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-4 rounded">
            <Link href="/signup">
              <button className="bg-gray-600 text-white px-2 py-2 rounded shadow-md hover:bg-black transition duration-200">
                Register
              </button>
            </Link>
            <Link href="/login">
              <button
                className="bg-gray-600 text-white px-2 py-2 rounded shadow-md hover:bg-black transition duration-200"
                onClick={() => handleLoginClick()}
              >
                Login
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
