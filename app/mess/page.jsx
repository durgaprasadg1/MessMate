"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/apiFetch";
import AllMesses from "@/Component/AllMess/AllMess";
import MessNotFound from "@/Component/Others/MessNotFound";
import PageSkeleton from "@/Component/Others/PageSkeleton";

const fetcher = async (url) => {
  const res = await apiFetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load messes");
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
};

export default function AllMessPage() {
  // Cached: coming back to this page shows the list instantly and refreshes quietly in the background.
  const { data: messes, error, isLoading } = useSWR("/api/mess", fetcher, { revalidateOnMount: true });

  if (isLoading && !messes) return <PageSkeleton />;
  if (error || !messes) return <MessNotFound />;

  return <AllMesses messes={messes} />;
}
