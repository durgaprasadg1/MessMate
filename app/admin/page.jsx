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
import EmptynessShowBox from "@/Component/Others/EmptynessShowBox";
import { Loader2, Users, Utensils, Clock } from "lucide-react";

export default function AdminLandingPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMesses: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const { data: session, status } = useSession();
  const [recentSignups, setRecentSignups] = useState([]);
  const [pendingMesses, setPendingMesses] = useState([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/admin/get-all-data")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecentSignups(data.recentSignups);
        setPendingMesses(data.pendingMesses);
      })
      .catch((err) => {
        console.error("Failed to fetch admin data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto p-6 sm:p-8">
        <header className="mb-10 pt-4 border-b border-gray-800 pb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
            Admin Control Center
          </h1>
          <p className="text-gray-400 mt-1 text-base">
            Overview and quick access to core operational panels.
          </p>
        </header>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          </div>
        ) : (
          <>
            <SectionPart />

            <h2 className="text-2xl font-bold text-gray-200 mb-6 mt-10 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Users className="w-6 h-6 text-amber-500" />
              Platform Metrics
            </h2>

            <SectionStats
              totalUsers={stats.totalUsers}
              totalMesses={stats.totalMesses}
              pendingCount={stats.pendingCount}
            />

            <tableContext.Provider
              value={{ recentSignups, pendingMesses }}
            >

              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-2 border-b border-gray-800 pb-2">
                  <Clock className="w-6 h-6 text-amber-500" />
                  Recent User Signups
                </h2>
                {recentSignups && recentSignups.length > 0 ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto shadow-2xl">
                    <TableBody
                      tableName=""
                      heading1="Name"
                      heading2="Email"
                      heading3="Joined"
                    />
                  </div>
                ) : (
                  <EmptynessShowBox
                    heading="No New Signups Found"
                    linkmsg="Go to User Management"
                    link="/admin/users"
                  />
                )}
              </div>

              {/* Pending Messes Section - Assuming ULs or TableBody renders this, but often helpful to be explicit */}
             
            </tableContext.Provider>
          </>
        )}
      </main>
    </div>
  );
}