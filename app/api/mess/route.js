import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "../../../lib/redis";

const TTL_SECONDS = 60 * 60 * 18;

export async function GET(request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "public";
    const cacheKey = `tenant:${tenantId}:messes:all`;
    const cached = await getJsonCache(cacheKey);

    if (cached !== null) {
      return NextResponse.json(cached, { status: 200 });
    }

    const { data: messes, error } = await supabase
      .from("mess")
      .select(
        "id,name,owner_name,owner_id,phone_number,category,is_open,is_verified,is_blocked,is_limited,adhar_number,lat,lon,veg_menu,non_veg_menu,veg_price,non_veg_price,image_url,certificate_url,created_at"
      );
    if (error) throw error;

    const shaped =
      messes?.map((m) => ({
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

    return NextResponse.json(shaped, { status: 200 });
  } catch (error) {
    console.log("Error fetching mess data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch mess data",
      },
      { status: 500 },
    );
  }
}
