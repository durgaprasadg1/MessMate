import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "../../../../lib/redis";

const TTL_SECONDS = 60 * 2;

export async function GET() {
  try {
    const tenantId = "public";
    const cacheKey = `tenant:${tenantId}:messes:pending`;
    const cached = await getJsonCache(cacheKey);
    if (cached !== null) {
      return NextResponse.json(cached, { status: 200 });
    }

    const { data: messes, error } = await supabase
      .from("mess")
      .select(
        "id,name,owner_name,phone_number,category,adhar_number,is_limited,is_verified,created_at,image_url,certificate_url,lat,lon",
      )
      .eq("is_verified", false);
    if (error) throw error;

    const shaped = (messes || []).map((m) => ({
      _id: m.id,
      name: m.name,
      ownerName: m.owner_name,
      phoneNumber: m.phone_number,
      category: m.category,
      adharNumber: m.adhar_number,
      isLimited: m.is_limited,
      isVerified: m.is_verified,
      createdAt: m.created_at,
      lat: m.lat,
      lon: m.lon,
      image: { url: m.image_url },
      certificate: { url: m.certificate_url },
    }));

    await setJsonCache(cacheKey, shaped, TTL_SECONDS);

    return NextResponse.json(shaped);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch messes" },
      { status: 500 },
    );
  }
}
