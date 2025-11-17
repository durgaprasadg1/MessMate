import AllMess from "@/Component/AllMess/AllMess";
import MessNotFound from "@/Component/Others/MessNotFound";

export const dynamic = "force-dynamic";

const AllMessToAdmin = async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mess`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return <MessNotFound />;
    }
    const messes = await res.json();
    return <AllMess messes={messes} />;
  } catch (error) {
    console.error("Error fetching messes:", error?.message || error);
    return <MessNotFound />;
  }
};

export default AllMessToAdmin;
