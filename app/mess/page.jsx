import AllMesses from "../../Component/AllMess";
import MessNotFound from "../../Component/MessNotFound";

export default async function AllMessPage() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mess`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return <MessNotFound />;
    }
    const messes = await res.json();
    return <AllMesses messes={messes} />;
  } catch (error) {
    // Server-side: avoid client-only APIs like toast during prerender.
    console.error("Error fetching messes:", error?.message || error);
    return <MessNotFound />;
  }
}
