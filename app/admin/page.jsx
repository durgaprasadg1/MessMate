"use client";

import AdminSidebar from "@/Component/Admin/AdminSidebar";
import SectionPart from "@/Component/Section/SectionPartLinks";
import SectionStats from "@/Component/Section/SectionStats";
import { useEffect, useState } from "react";
import TableBody from "@/Component/HTML_components/table_body";
import { tableContext } from "@/hooks/tableContext";
import { useSession } from "next-auth/react";
import EmptynessShowBox from "@/Component/Others/EmptynessShowBox";
import { Loader2, Users, Utensils, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
export default function AdminLandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMesses: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { data: session, status } = useSession();
  const [recentSignups, setRecentSignups] = useState([]);
  const [pendingMesses, setPendingMesses] = useState([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user?.isAdmin) {
      router.replace("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/get-all-data", { cache: "no-store" });
        if (!res.ok) {
          console.error("Failed to fetch admin data:", res.status);
          setError(true);
          return;
        }
        const text = await res.text();
        if (!text) {
          setError(true);
          return;
        }
        const data = JSON.parse(text);
        setStats(data.stats || { totalUsers: 0, totalMesses: 0, pendingCount: 0 });
        setRecentSignups(data.recentSignups || []);
        setPendingMesses(data.pendingMesses || []);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="role-shell flex items-center justify-center text-stone-800">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="w-8 h-8 animate-spin text-stone-800" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="role-shell text-stone-900"
    >
      <AdminSidebar />

      <main className="role-container">
        <motion.header
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="role-section p-5 sm:p-6 border-0"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
            Admin Control Center
          </h1>
          <p className="text-stone-600 mt-1 text-sm sm:text-base">
            Overview and quick access to core operational panels.
          </p>
        </motion.header>

        {loading ? (
          <div className="mt-6 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-stone-800" />
          </div>
        ) : error ? (
          <div className="role-section p-6 mt-4 text-stone-700">
            <p className="text-lg font-semibold text-rose-700">Unable to load admin data.</p>
            <p className="text-sm text-stone-600 mt-1">Please try again or refresh. If the issue persists, check the admin API.</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="role-section p-5 sm:p-6"
            >
              <SectionPart />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold text-stone-900 mb-4 mt-6 flex items-center gap-2"
            >
              <Users className="w-6 h-6 text-stone-700" />
              Platform Metrics
            </motion.h2>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.15 },
                },
              }}
              className="role-section p-5 sm:p-6"
            >
              <SectionStats
                totalUsers={stats.totalUsers}
                totalMesses={stats.totalMesses}
                pendingCount={stats.pendingCount}
              />
            </motion.div>

            {/* Table Context Provider */}
            <tableContext.Provider value={{ recentSignups, pendingMesses }}>
              {/* Recent Signups */}
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="role-section p-5 sm:p-6 mt-6"
              >
                <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-stone-700" />
                  Recent User Signups
                </h2>

                {recentSignups && recentSignups.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <TableBody
                      tableName=""
                      heading1="Name"
                      heading2="Email"
                      heading3="Joined"
                    />
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <EmptynessShowBox
                      heading="No New Signups Found"
                      linkmsg="Go to User Management"
                      link="/admin/users"
                    />
                  </motion.div>
                )}
              </motion.div>
            </tableContext.Provider>
          </>
        )}
      </main>
    </motion.div>
  );
}
