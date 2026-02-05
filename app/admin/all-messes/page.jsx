import AllMess from "@/Component/AllMess/AdminAllMess";
import MessNotFound from "@/Component/Others/MessNotFound";
import { getBaseUrl } from "@/lib/getBaseUrl";

export const dynamic = "force-dynamic";

const AllMessToAdmin = async () => {
  try {
    const res = await fetch(`${getBaseUrl()}/api/mess`, {
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
