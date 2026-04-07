"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Home, Clock, LogOut, LayoutDashboard, UserX, UserPlus, LogIn, Bell } from "lucide-react";
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

  // The sidebar content to be reused in desktop & mobile drawer
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Brand */}
      <div className="h-20 flex items-center justify-center border-b border-orange-100">
        <Link href="/" className="text-decoration-none" onClick={() => setDrawerOpen(false)}>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-orange-100 p-2 rounded-full">
               <Image src="/Logo.png" alt="Logo" width={28} height={28} />
            </div>
            <span className="text-xl font-extrabold text-orange-600 tracking-tight">MessMate</span>
          </div>
        </Link>
      </div>

      {/* Primary Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {session?.user && !isAdmin && (
          <>
            <Link href="/mess" onClick={() => setDrawerOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition !no-underline ${pathname === '/mess' ? 'bg-orange-50 !text-orange-600 font-semibold' : '!text-slate-600 hover:bg-orange-50/50 hover:!text-orange-500'}`}>
              <Home size={20} />
              <span>Explore Mess</span>
            </Link>
            <button onClick={() => { handleHistoryClick(); setDrawerOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition !text-slate-600 hover:bg-orange-50/50 hover:!text-orange-500 border-none outline-none bg-transparent">
              <Clock size={20} />
              <span>Order History</span>
            </button>
            {!consumerData.haveMonthlyMess && (
              <Link href={`/consumer/${session?.user?.id}/daily-mess`} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl transition bg-orange-200 !text-white shadow-sm hover:bg-orange-300 font-medium !no-underline">
                <LayoutDashboard size={20} />
                <span>Your Daily Mess</span>
              </Link>
            )}
          </>
        )}

        {/* Global Search and Radius for Explore Page */}
        {pathname === "/mess" && (
          <div className="mt-6 flex flex-col gap-3 px-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filters</div>
            <div className="flex items-center bg-orange-50 rounded-xl px-4 py-3">
              <Search size={18} className="text-orange-400" />
              <input
                type="text"
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                placeholder="Search Mess..."
                className="bg-transparent outline-none flex-1 text-sm text-slate-700 ml-2 placeholder:text-orange-300"
              />
            </div>
            <select
              className="w-full bg-white border border-orange-100 px-4 py-3 rounded-xl text-sm text-slate-600 outline-none focus:border-orange-300 transition appearance-none"
              value={radius ? String(radius) : ""}
              onChange={handleRadiusChange}
            >
              <option value="">Radius: Any Distance</option>
              <option value="50">Within 50m</option>
              <option value="100">Within 100m</option>
              <option value="200">Within 200m</option>
              <option value="500">Within 500m</option>
              <option value="1000">Within 1km</option>
            </select>
          </div>
        )}

        {!session && (
          <div className="pt-4 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">Get Started</div>
            <Link href="/login" onClick={() => { handleLoginClick(); setDrawerOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl transition !text-slate-600 hover:bg-orange-50/50 hover:!text-orange-500 !no-underline">
              <LogIn size={20} />
              <span>Login</span>
            </Link>
            <Link href="/signup" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl transition !text-slate-600 hover:bg-orange-50/50 hover:!text-orange-500 !no-underline">
              <UserPlus size={20} />
              <span>Register Consumer</span>
            </Link>
            <Link href="/register-owner" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl transition !text-slate-600 hover:bg-orange-50/50 hover:!text-orange-500 !no-underline">
              <UserX size={20} />
              <span>Register Owner</span>
            </Link>
          </div>
        )}
      </div>

      {/* Footer Profile & Logout */}
      {session && (
        <div className="p-4 border-t border-orange-100 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <ProfileComponent closeDrawer={() => setDrawerOpen(false)} />
            <NotificationBell />
          </div>
          <button
            onClick={() => { handleLogout(); setDrawerOpen(false); }}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-medium hover:bg-orange-100 hover:text-orange-600 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}
    </div>
  );

  const startResizing = useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startX = mouseDownEvent.clientX;
    const startWidthStr = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width');
    const startWidth = parseInt(startWidthStr) || 280;

    const doDrag = (mouseMoveEvent) => {
      // Allow resizing between 200px and 600px
      const newWidth = Math.max(200, Math.min(600, startWidth + mouseMoveEvent.clientX - startX));
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, []);

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside 
        className="hidden md:block fixed top-0 left-0 h-screen bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 border-r border-orange-50"
        style={{ width: 'var(--sidebar-width, 280px)' }}
      >
        <SidebarContent />
        <div 
          onMouseDown={startResizing}
          className="absolute top-0 -right-1.5 w-3 h-full cursor-col-resize hover:bg-orange-400 active:bg-orange-600 transition-colors z-50 opacity-0 hover:opacity-100"
          title="Drag to resize sidebar"
        />
      </aside>

      {/* Mobile Top Header (only visible on mobile, shows hamburger) */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-40 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-orange-100 p-1.5 rounded-full">
            <Image src="/Logo.png" alt="Logo" width={20} height={20} />
          </div>
          <span className="text-lg font-extrabold text-orange-600 tracking-tight">MessMate</span>
        </Link>
        <button className="text-slate-700 bg-orange-50 p-2 rounded-xl" onClick={() => setDrawerOpen(true)}>
          <Menu size={24} className="text-orange-600" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setDrawerOpen(false)}
          >
             <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute top-0 left-0 h-full w-[80%] max-w-sm bg-white shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
             >
                <div className="absolute top-4 right-4 z-50">
                   <button onClick={() => setDrawerOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition">
                      <X size={20} />
                   </button>
                </div>
                <SidebarContent />
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
