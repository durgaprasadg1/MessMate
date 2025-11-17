"use client";

import AdminNavbar from "@/Component/Admin/AdminNavbar";
import SectionPart from "@/Component/Section/SectionPartLinks";
import SectionStats from "@/Component/Section/SectionStats";
import { useEffect, useState } from "react";
import TableBody from "@/Component/HTML_components/table_body";
import { tableContext } from "@/hooks/tableContext";
import ULs from "../../Component/HTML_components/uls";
import { useSession } from "next-auth/react";
import NotFound from "../not-found";

export default function AdminLandingPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMesses: 0,
    pendingCount: 0,
  });

  const { data: session } = useSession();
  const [recentSignups, setRecentSignups] = useState([]);
  const [pendingMesses, setPendingMesses] = useState([]);

  useEffect(() => {
    fetch("/api/admin/get-all-data")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecentSignups(data.recentSignups);
        setPendingMesses(data.pendingMesses);
      });
  }, []);

  if (!session?.user?.isAdmin) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview and quick access to admin panels.
          </p>
        </header>

        <SectionPart />

        <SectionStats
          totalUsers={stats.totalUsers}
          totalMesses={stats.totalMesses}
          pendingCount={stats.pendingCount}
        />

        <tableContext.Provider
          value={{ recentSignups, pendingMesses }}
        >
          <ULs />

          <TableBody
            tableName="Recent Signups"
            heading1="Name"
            heading2="Email"
            heading3="Joined"
          />
        </tableContext.Provider>
      </main>
    </div>
  );
}
