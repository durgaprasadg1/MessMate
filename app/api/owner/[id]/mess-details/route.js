import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "@/lib/redis";

const TTL_SECONDS = 60 * 60 * 18;

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.id !== id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const tenantId = req.headers.get("x-tenant-id") || "public";
    const cacheKey = `tenant:${tenantId}:owner:${id}:messes`;
    const cached = await getJsonCache(cacheKey);
    if (cached !== null) {
      return NextResponse.json({ messes: cached }, { status: 200 });
    }

    const { data: owner, error } = await supabase
      .from("owner")
      .select("messes:mess(*)")
      .eq("id", id)
      .single();
    if (error) throw error;

    const shaped =
      owner?.messes?.map((m) => ({
        _id: m.id,
        name: m.name,
        ownerName: m.owner_name,
        owner: m.owner_id,
        phoneNumber: m.phone_number,
        category: m.category,
        isOpen: m.is_open,
        isVerified: m.is_verified,
        isBlocked: m.is_blocked,
        isLimited: m.is_limited,
        adharNumber: m.adhar_number,
        lat: m.lat,
        lon: m.lon,
        vegMenu: m.veg_menu,
        nonVegMenu: m.non_veg_menu,
        vegPrice: m.veg_price,
        nonVegPrice: m.non_veg_price,
        image: { url: m.image_url },
        certificate: { url: m.certificate_url },
        createdAt: m.created_at,
      })) || [];

    await setJsonCache(cacheKey, shaped, TTL_SECONDS);

    return NextResponse.json({ messes: shaped });
  } catch (err) {
    console.error("ERROR in /api/owner/[id]/mess-details:", err);
    return NextResponse.json(
      { error: "Server Error", details: err?.message },
      { status: 500 },
    );
  }
}
