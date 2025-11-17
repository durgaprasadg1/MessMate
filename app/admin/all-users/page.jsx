"use client";

import { useEffect, useState } from "react";
import AdminNavbar from "@/Component/Admin/AdminNavbar";
import NotFound from "../../not-found";

export default function AllUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        const data = await res.json();

        if (!data.success) {
          setError(true);
          return;
        }

        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    loadUsers();
  }, []);

  if (error) return <NotFound />;

  return (
    <div className="min-h-screen bg-purple-50">
      <AdminNavbar />
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">All Users</h1>

        {users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u._id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 align-top">{i + 1}</td>
                    <td className="px-4 py-2 align-top">{u.username}</td>
                    <td className="px-4 py-2 align-top">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
