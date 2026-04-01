import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";

export async function GET(request, { params }) {
  try {
    const { id } = (await params) || {};

    const { data: mess } = await supabase
      .from("mess")
      .select(
        "*, alerts:message(*), vegMenuRef:veg_menu_ref_id(*), nonVegMenuRef:non_veg_menu_ref_id(*), reviews:review(*, author:author_id(*))"
      )
      .eq("id", id)
      .single();

    if (!mess) {
      console.warn("[API GET /mess/:id] Mess not found for id:", id);
      const debug = request.nextUrl.searchParams.get("debug") === "1";
      if (debug) {
        const count = await Mess.countDocuments();
        const sample = await Mess.find({}, { _id: 1 }).limit(5);
        return NextResponse.json(
          {
            message: "Mess not found",
            id,
            collectionCount: count,
            sampleIds: sample.map((d) => String(d._id)),
            dbName: process.env.MONGODB_DBNAME || "messmate",
            uriHost:
              (process.env.MONGODB_URI || "").split("@").pop()?.split("/")[0] ||
              null,
          },
          { status: 404 },
        );
      }
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const shaped = {
      _id: mess.id,
      name: mess.name,
      description: mess.description,
      email: mess.email,
      upi: mess.upi,
      address: mess.address,
      mealTime: mess.meal_time,
      vegMenu: mess.veg_menu,
      vegPrice: mess.veg_price,
      nonVegPrice: mess.non_veg_price,
      nonVegMenu: mess.non_veg_menu,
      vegMenuRef: mess.vegMenuRef,
      nonVegMenuRef: mess.nonVegMenuRef,
      owner: mess.owner_id,
      category: mess.category,
      isOpen: mess.is_open,
      ownerName: mess.owner_name,
      adharNumber: mess.adhar_number,
      phoneNumber: mess.phone_number,
      lat: mess.lat,
      lon: mess.lon,
      isLimited: mess.is_limited,
      isVerified: mess.is_verified,
      createdAt: mess.created_at,
      certificate: { url: mess.certificate_url },
      image: { url: mess.image_url },
      isBlocked: mess.is_blocked,
      alerts: mess.alerts,
      reviews: mess.reviews,
    };

    console.log("[API GET /mess/:id] Found mess:", mess.id, mess.name);
    return NextResponse.json(shaped, { status: 200 });
  } catch (error) {
    console.error("[API GET /mess/:id] Error fetching mess by ID:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = (await params) || {};
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: mess } = await supabase
      .from("mess")
      .select("id, owner_id, is_open")
      .eq("id", id)
      .single();
    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });

    const ownerId = mess.owner_id;
    if (!ownerId || ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden: not the owner" },
        { status: 403 },
      );
    }
    const { data: updatedMess, error } = await supabase
      .from("mess")
      .update({ is_open: !mess.is_open })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(
      {
        message: updatedMess.isOpen ? "Mess Opened" : "Mess Closed",
        mess: updatedMess,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = (await params) || {};
    await supabase.from("mess").delete().eq("id", id);

    if (!deletedMess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Mess Deleted Successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching mess by ID:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
