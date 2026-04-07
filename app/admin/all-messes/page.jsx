"use client";

import { useEffect, useState } from "react";
import AllMess from "@/Component/AllMess/AdminAllMess";
import MessNotFound from "@/Component/Others/MessNotFound";
import Loading from "@/Component/Others/Loading";
import { getBaseUrl } from "@/lib/getBaseUrl";

export default function AllMessToAdmin() {
  const [messes, setMesses] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/mess`, { cache: "no-store" });
        if (!res.ok) {
          setError(true);
          return;
        }
        const text = await res.text();
        const data = text ? JSON.parse(text) : [];
        const shaped = (data || []).map((m) => ({
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
        setMesses(shaped);
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
