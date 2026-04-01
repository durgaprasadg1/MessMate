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
    const shaped = (messes || []).map((m) => ({
      _id: m.id,
      name: m.name,
      ownerName: m.owner_name,
      owner: m.owner_id,
      phoneNumber: m.phone_number,
      category: m.category,
      isOpen: m.is_open,
      isVerified: m.is_verified,
      isBlocked: m.is_blocked,
      adharNumber: m.adhar_number,
      lat: m.lat,
      lon: m.lon,
      image: { url: m.image_url },
      certificate: { url: m.certificate_url },
      createdAt: m.created_at,
    }));
    return <AllMess messes={shaped} />;
  } catch (error) {
    console.error("Error fetching messes:", error?.message || error);
    return <MessNotFound />;
  }
};

export default AllMessToAdmin;
