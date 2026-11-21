"use client";

import { apiFetch } from "@/lib/apiFetch";
import { useEffect, useState } from "react";
import AllMess from "@/Component/AllMess/AdminAllMess";
import MessNotFound from "@/Component/Others/MessNotFound";
import Loading from "@/Component/Others/Loading";

export default function AllMessToAdmin() {
  const [messes, setMesses] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // The server already returns the admin view in the shape the UI needs.
        const res = await apiFetch(`/api/admin/messes`, { cache: "no-store" });
        if (!res.ok) {
          setError(true);
          return;
        }
        const text = await res.text();
        setMesses(text ? JSON.parse(text) : []);
      } catch (err) {
        console.error("Error fetching messes:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading)
    return (
      <div className="role-shell flex items-center justify-center">
        <Loading />
      </div>
    );

  if (error) return <MessNotFound />;

  return <AllMess messes={messes} />;
}
