"use client";

import AdminNavbar from "@/Component/Admin/AdminNavbar";
import SectionPart from "@/Component/Section/SectionPartLinks";
import SectionStats from "@/Component/Section/SectionStats";
import AdminActionCard from "@/Component/Admin/AdminActionCard";
import { useEffect, useState } from "react";

export default function AdminLandingPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMesses: 0,
    pendingCount: 0,
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview and quick access to admin panels.
          </p>
        </header>

        

        <SectionPart/>
        <SectionStats totalUsers={stats.totalUsers} totalMesses={stats.totalMesses} pendingCount={stats.pendingCount}/>
        

        {/* Recent signups & pending */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Recent Signups</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((c) => (
                  <tr key={c._id} className="border-t">
                    <td className="py-2">{c.username}</td>
                    <td className="py-2">{c.email}</td>
                    <td className="py-2">
                      {new Date(c.joined).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">
              Pending Verifications
            </h3>

            <ul className="text-sm text-gray-700 space-y-2">
              {pendingMesses.map((m) => (
                <li key={m._id} className="flex items-center justify-between">
                  <span>{m.name}</span>
                  <button
                    onClick={() =>
                      (window.location.href = "/admin/pending-verification")
                    }
                    className="px-3 py-1 bg-yellow-500 text-white rounded-md"
                  >
                    Review
                  </button>
                </li>
              ))}

              {pendingMesses.length === 0 && (
                <li className="text-gray-500">No pending verifications</li>
              )}
            </ul>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-sm text-gray-500">
          <p>
            Quick Links:{" "}
            <button
              className="text-indigo-600 underline"
              onClick={() => (window.location.href = "/admin/analytics")}
            >
              Analytics
            </button>{" "}
            ·{" "}
            <button
              className="text-indigo-600 underline"
              onClick={() =>
                (window.location.href = "/admin/pending-verification")
              }
            >
              Pending Verification
            </button>
          </p>
        </footer>
      </main>
    </div>
  );
}
