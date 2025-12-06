"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import AllMesses from "@/Component/AllMess/AllMess";
import MessNotFound from "@/Component/Others/MessNotFound";
import Loader from "@/Component/Others/Loading";

export default function AllMessPage() {
  const [messes, setMesses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMesses = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/mess`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          setError(true);
          return;
        }

        const data = await res.json();
        setMesses(data);
      } catch (err) {
        console.error("Error fetching messes:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMesses();
  }, []);

  if (loading) return <Loader />;

  if (error || !messes) return <MessNotFound />;

  return <AllMesses messes={messes} />;
}
