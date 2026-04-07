"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, ShieldCheck, Users, Building2, BarChart3, LogOut } from "lucide-react";
import { useState } from "react";
import ProfileComponent from "../Others/ProfileComponent";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: ShieldCheck },
  { href: "/admin/pending-verification", label: "Pending Verification", icon: Building2 },
  { href: "/admin/all-users", label: "All Users", icon: Users },
  { href: "/admin/all-messes", label: "All Messes", icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const LinkItem = ({ item }) => {
    const active =
      pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
          active
            ? "bg-stone-200 text-stone-900 shadow-sm"
            : "text-stone-600 hover:bg-stone-100"
        }`}
        onClick={() => setOpen(false)}
      >
        <item.icon size={18} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white/95 backdrop-blur border-r border-stone-200 shadow-sm z-40"
        style={{ width: "var(--sidebar-width, 280px)" }}
      >
        <div className="h-16 px-5 flex items-center border-b border-stone-200">
          <div className="text-xl font-extrabold text-stone-900 tracking-tight">Admin</div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-2">
          {navItems.map((item) => (
            <LinkItem key={item.href} item={item} />
          ))}
        </div>
        <div className="border-t border-stone-200 p-4 space-y-3">
          <ProfileComponent />
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-stone-800 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-white/95 backdrop-blur border-b border-stone-200 z-40 flex items-center justify-between px-4 py-3">
        <div className="text-lg font-extrabold text-stone-900">Admin</div>
        <button
          className="text-stone-800 p-2 rounded-lg hover:bg-stone-100"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 24 }}
              className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
                <div className="text-lg font-bold text-stone-900">Admin Menu</div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-stone-100 text-stone-700"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                {navItems.map((item) => (
                  <LinkItem key={item.href} item={item} />
                ))}
              </div>
              <div className="p-4 border-t border-stone-200 space-y-3">
                <ProfileComponent />
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-stone-800 transition"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
