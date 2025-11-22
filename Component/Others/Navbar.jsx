"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ProfileComponent from "./ProfileComponent";

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async() => {
    await signOut({ redirect: false });
      router.replace('/')
  };

  const handleHistoryClick = () =>
    router.push(`/consumer/${session?.user?.id}/history`);

  const handleLoginClick = async () => {
    router.push("/login");
    await signIn();
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-4 sm:gap-8">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-xl sm:text-2xl font-extrabold text-gray-700"
          >
            <Link href="/">
              <button className="text-gray-600 transition-colors duration-300 hover:text-black">
                MessMate
              </button>
            </Link>
          </motion.div>

          {session?.user && !isAdmin && (
            <div className="hidden md:flex gap-4 lg:gap-6 text-gray-700 font-medium">
              <Link href="/mess">
                <button className="text-gray-600 hover:text-black">Home</button>
              </Link>

              <button
                className="text-gray-600 hover:text-black"
                onClick={handleHistoryClick}
              >
                Your Order History
              </button>

              
            </div>
          )}
        </div>

        {pathname === "/mess" && (
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 shadow-sm w-56 sm:w-72 md:w-80">
            <input
              type="text"
              value={searchQuery ?? ""}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Search Mess..."
              className="bg-transparent outline-none flex text-sm text-gray-700 placeholder-gray-500"
            />
            <button className="bg-gray-600 hover:bg-black text-white px-3 py-1 rounded text-sm flex items-center gap-1">
              <Search size={16} /> Search
            </button>
          </div>
        )}

        {session ? (
          <div className="hidden md:flex items-center gap-3 sm:gap-4 rounded">
            <ProfileComponent />
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-2 py-2 rounded shadow-md hover:bg-black transition duration-300"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="hidden md:flex gap-3 sm:gap-4 rounded">
            <Link href="/register-owner">
              <button className="bg-gray-600 text-white px-2 py-2 rounded shadow-md hover:bg-black transition duration-200">
               Register Owner 
              </button>
            </Link>
            <Link href="/signup">
              <button className="bg-gray-600 text-white px-2 py-2 rounded shadow-md hover:bg-black transition duration-200">
               Register Consumer
              </button>
            </Link>
            <Link href="/login">
              <button
                className="bg-gray-600 text-white px-2 py-2 rounded shadow-md hover:bg-black transition duration-200"
                onClick={handleLoginClick}
              >
                Login
              </button>
            </Link>
          </div>
        )}

        <button
          className="md:hidden text-gray-700"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={28} />
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Menu</h2>
              <button onClick={() => setDrawerOpen(false)}>
                <X size={24} />
              </button>
            </div>

            {session?.user && !isAdmin && (
              <>
                <Link href="/" onClick={() => setDrawerOpen(false)}>
                  <p className="py-2 text-gray-700 hover:text-black">Home</p>
                </Link>

                <p
                  className="py-2 text-gray-700 hover:text-black"
                  onClick={() => {
                    setDrawerOpen(false);
                    handleHistoryClick();
                  }}
                >
                  Your Orders
                </p>

                
              </>
            )}

            {pathname === "/mess" && (
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 shadow-sm w-full">
                <input
                  type="text"
                  value={searchQuery ?? ""}
                  onChange={(e) =>
                    setSearchQuery && setSearchQuery(e.target.value)
                  }
                  placeholder="Search Mess..."
                  className="bg-transparent outline-none flex-1 text-sm text-gray-700"
                />
                <Search size={18} />
              </div>
            )}

            {session ? (
              <>
                <ProfileComponent closeDrawer={() => setDrawerOpen(false)} />
                <button
                  onClick={() => {
                    handleLogout();
                    setDrawerOpen(false);
                  }}
                  className="bg-gray-600 text-white px-3 py-2 rounded shadow-md hover:bg-black"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/signup" onClick={() => setDrawerOpen(false)}>
                  <p className="py-2 text-gray-700 hover:text-black">
                    Register
                  </p>
                </Link>
                <Link
                  href="/login"
                  onClick={() => {
                    handleLoginClick();
                    setDrawerOpen(false);
                  }}
                >
                  <p className="py-2 text-gray-700 hover:text-black">Login</p>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
