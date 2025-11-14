"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast } from "react-toastify";
import { FaRegUser } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";

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

  const handleLoginClick = async () => {
    router.push("/login");
    await signIn();

    router.refresh();
    toast.info("Opening login...");
  };

  const handleUserProfileClick = () => {
    let endpt = "";
    if (!isAdmin) endpt = `/consumer/${session.user.id}`;
    else {
      endpt = `/admin/${session.user.id}`;
    }
    router.push(endpt);
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

          <div className="hidden md:flex gap-6 text-gray-700 font-medium">
            <Link href="/" className="  ">
              <button className="text-gray-600 hover:text-black">Home</button>
            </Link>

           {session?.user && !isAdmin && (
              <button
                className="text-gray-600 hover:text-black"
                onClick={handleHistoryClick}
              >
                History
              </button>
            )}

          </div>
        </div>

        {/* Search Bar st */}

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
                /* optional: could trigger something else */
              }}
              className="bg-gray-600 hover:bg-black text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition"
            >
              <Search size={16} /> Search
            </button>
          </div>
        ) : (
          ""
        )}
        {/* Search Bar Exit */}

        {session ? (
          <div className="flex items-center gap-4 rounded">
            <div
              className="flex items-center gap-2 hover:cursor-pointer"
              onClick={handleUserProfileClick}
            >
              <FaRegUser />
              <span className="text-sm font-medium text-gray-700 hover:text-black">
                {session.user?.username ||
                  session.user?.name ||
                  session.user?.email}
              </span>
            </div>
            <button
              onClick={() => handleLogout()}
              className="bg-gray-600 text-white px-2 py-2 rounded shadow-md hover:bg-black transition duration-200"
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
