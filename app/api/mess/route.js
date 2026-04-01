import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET() {
  try {
    const { data: messes, error } = await supabase.from("mess").select("*");
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
    return NextResponse.json(shaped, { status: 200 });
  } catch (error) {
    console.log("Error fetching mess data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch mess data",
      },
      { status: 500 }
    );
  }
}


