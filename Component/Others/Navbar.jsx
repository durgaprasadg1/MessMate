"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import ProfileComponent from "./ProfileComponent";
import Button from "../../Component/Others/Button";
import { toast } from "react-toastify";
import NotificationBell from "./NotificationBell";
import Image from "next/image";

const Navbar = ({ searchQuery, setSearchQuery, radius, setRadius }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;
  const isOwner = session?.user?.isOwner;
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [consumerData, setConsumerData] = useState({});
  const consumerid = session?.user?.id;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace("/");
  };

  const handleHistoryClick = () =>
    router.push(`/consumer/${session?.user?.id}/history`);

  const handleLoginClick = async () => {
    router.push("/login");
    await signIn();
    router.refresh();
  };

  const fetchUser = useCallback(async () => {
    if (!consumerid || isOwner || isAdmin) return;
    try {
      const res = await fetch(`/api/consumer/${consumerid}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        toast.error("Something went wrong");
        console.log(res.text);
      }
      const data = await res.json();
      setConsumerData({
        haveMonthlyMess: data.consumer.haveMonthlyMess ?? false,
      });
    } catch {
      toast.error("Error fetching user data");
    }
  }, [consumerid, isOwner, isAdmin]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!consumerid || isOwner || isAdmin) return;
    const interval = setInterval(fetchUser, 10000);
    return () => clearInterval(interval);
  }, [fetchUser, consumerid, isOwner, isAdmin]);

  const handleRadiusChange = (event) => {
    const value = event.target.value;
    const parsed = value ? parseInt(value, 10) : null;

    if (parsed) {
      if (!navigator?.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setRadius(parsed);
        },
        () => {
          alert("Please allow location access to filter by distance.");
          event.target.value = "";
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setRadius(null);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4 sm:gap-6">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-xl sm:text-2xl font-extrabold text-gray-700"
          >
            <Link href="/" className="text-decoration-none">
            <div className="flex items-center  ">
              <Image src="/Logo.png" alt="Logo" width={30} height={50}></Image>
              <button className="text-gray-600 hover:text-black transition">
                MessMate
              </button>
            </div>
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

        <div className="hidden md:flex items-center gap-3">
          {pathname === "/mess" && (
            <>
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 shadow-sm w-56 sm:w-72 lg:w-80">
                <input
                  type="text"
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery?.(e.target.value)}
                  placeholder="Search Mess..."
                  className="bg-transparent outline-none flex-1 text-sm text-gray-700"
                />
                <Search size={18} className="text-gray-600" />
              </div>

              <select
                className="border bg-white px-2 py-1 rounded text-sm"
                value={radius ? String(radius) : ""}
                onChange={handleRadiusChange}
              >
                <option value="">All Messes</option>
                <option value="50">Within 50m</option>
                <option value="100">Within 100m</option>
                <option value="200">Within 200m</option>
                <option value="500">Within 500m</option>
                <option value="1000">Within 1km</option>
              </select>
            </>
          )}
        </div>

        {session ? (
          <div className="hidden md:flex items-center gap-3">
            {consumerData.haveMonthlyMess && (
              <Button
                data="Your Daily Mess"
                classes="bg-pink-300 rounded p-1.5 hover:bg-pink-400 transition-colors text-white duration-300"
                link={`/consumer/${session?.user?.id}/daily-mess`}
              />
            )}
            <NotificationBell />
            <ProfileComponent />
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-3 py-2 rounded shadow hover:bg-black"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link href="/register-owner">
              <button className="bg-gray-600 text-white px-3 py-2 rounded shadow hover:bg-black">
                Register Owner
              </button>
            </Link>

            <Link href="/signup">
              <button className="bg-gray-600 text-white px-3 py-2 rounded shadow hover:bg-black">
                Register Consumer
              </button>
            </Link>

            <Link href="/login">
              <button
                onClick={handleLoginClick}
                className="bg-gray-600 text-white px-3 py-2 rounded shadow hover:bg-black"
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
          className="fixed inset-0 bg-opacity-40 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-64 bg-gray-200 border shadow-lg p-5 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
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

                {consumerData.haveMonthlyMess && (
                  <Button
                    data="Your Daily Mess"
                    classes="bg-pink-300 rounded p-1.5 hover:bg-pink-400 transition-colors text-white duration-300"
                    link={`/consumer/${session?.user?.id}/daily-mess`}
                  />
                )}
              </>
            )}

            {pathname === "/mess" && (
              <>
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 shadow-sm w-full">
                  <input
                    type="text"
                    value={searchQuery || ""}
                    onChange={(e) => setSearchQuery?.(e.target.value)}
                    placeholder="Search Mess..."
                    className="bg-transparent outline-none flex-1 text-sm text-gray-700"
                  />
                  <Search size={18} />
                </div>

                <select
                  className="border bg-white px-2 py-2 rounded text-sm"
                  value={radius ? String(radius) : ""}
                  onChange={handleRadiusChange}
                >
                  <option value="">All Messes</option>
                  <option value="50">Within 50m</option>
                  <option value="100">Within 100m</option>
                  <option value="200">Within 200m</option>
                  <option value="500">Within 500m</option>
                  <option value="1000">Within 1km</option>
                </select>
              </>
            )}

            {session ? (
              <>
                <NotificationBell />
                <ProfileComponent closeDrawer={() => setDrawerOpen(false)} />
                <button
                  onClick={() => {
                    handleLogout();
                    setDrawerOpen(false);
                  }}
                  className="bg-gray-600 text-white px-3 py-2 rounded shadow hover:bg-black"
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
