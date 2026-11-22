"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "./Navbar";
import OwnerNavbar from "../Owner/OwnerNavbar";
import AdminSidebar from "../Admin/AdminSidebar";
import { navKindFor, NAV } from "@/lib/navRouting";

/**
 * Persistent navigation. It lives in the root layout, so moving between pages
 * only swaps the page content: the sidebar is never unmounted, re-fetched or
 * re-animated (which is what used to make every click feel like a reload).
 */
export default function AppShell({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const kind = navKindFor(pathname, session?.user);

  return (
    <>
      {kind === NAV.CONSUMER && <Navbar />}
      {kind === NAV.OWNER && <OwnerNavbar />}
      {kind === NAV.ADMIN && <AdminSidebar />}
      {children}
    </>
  );
}
