"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Menu,
  X,
  Home,
  PlusCircle,
  ClipboardList,
  User,
  BarChart3,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import ProfileComponent from "../Others/ProfileComponent";
import NotificationBell from "../Others/NotificationBell";
import Image from "next/image";

export default function OwnerNavbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const ownerId = session?.user?.id;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [session, router]);

  const startResizing = useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startX = mouseDownEvent.clientX;
    const startWidthStr = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--owner-sidebar-width");
    const startWidth = parseInt(startWidthStr) || 280;

    const doDrag = (mouseMoveEvent) => {
      const newWidth = Math.max(
        200,
        Math.min(600, startWidth + mouseMoveEvent.clientX - startX)
      );
      document.documentElement.style.setProperty(
        "--owner-sidebar-width",
        `${newWidth}px`
      );
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  }, []);

  const navLinks = [
    {
      href: `/owner/${ownerId}/mess-details`,
      label: "My Messes",
      icon: Home,
    },
    {
      href: `/owner/${ownerId}/new-mess`,
      label: "Add New Mess",
      icon: PlusCircle,
    },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-stone-800">
      {/* Brand */}
      <div className="h-20 flex items-center justify-center border-b border-emerald-100">
        <Link
          href="/owner"
          className="text-decoration-none !no-underline"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-emerald-50 p-2 rounded-full">
              <Image src="/Logo.png" alt="Logo" width={28} height={28} />
            </div>
            <span className="text-xl font-extrabold text-emerald-700 tracking-tight">
              MessMate
            </span>
          </div>
        </Link>
      </div>

      {/* Primary Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition !no-underline ${
              isActive(item.href)
                ? "bg-emerald-50 !text-emerald-700 font-semibold"
                : "!text-stone-600 hover:bg-emerald-50/50 hover:!text-emerald-600"
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Profile link — user icon */}
        <Link
          href={`/owner/${ownerId}`}
          onClick={() => setDrawerOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition !no-underline ${
            pathname === `/owner/${ownerId}`
              ? "bg-emerald-50 !text-emerald-700 font-semibold"
              : "!text-stone-600 hover:bg-emerald-50/50 hover:!text-emerald-600"
          }`}
        >
          <User size={20} />
          <span>Profile</span>
        </Link>
      </div>

      {/* Footer Profile & Logout */}
      {session && (
        <div className="p-4 border-t border-emerald-100 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <NotificationBell />
            <ProfileComponent closeDrawer={() => setDrawerOpen(false)} />
          </div>
          <button
            onClick={() => {
              handleLogout();
              setDrawerOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-600 px-4 py-3 rounded-xl font-medium hover:bg-emerald-100 hover:text-emerald-700 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:block fixed top-0 left-0 h-screen bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 border-r border-emerald-50"
        style={{ width: "var(--owner-sidebar-width, 280px)" }}
      >
        <SidebarContent />
        <div
          onMouseDown={startResizing}
          className="absolute top-0 -right-1.5 w-3 h-full cursor-col-resize hover:bg-emerald-400 active:bg-emerald-600 transition-colors z-50 opacity-0 hover:opacity-100"
          title="Drag to resize sidebar"
        />
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-40 flex items-center justify-between px-6 py-4">
        <Link href="/owner" className="flex items-center gap-2 !no-underline">
          <div className="bg-emerald-50 p-1.5 rounded-full">
            <Image src="/Logo.png" alt="Logo" width={20} height={20} />
          </div>
          <span className="text-lg font-extrabold text-emerald-700 tracking-tight">
            MessMate
          </span>
        </Link>
        <button
          className="text-stone-700 bg-emerald-50 p-2 rounded-xl"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={24} className="text-emerald-600" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 md:hidden"
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
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 transition"
                >
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
}
