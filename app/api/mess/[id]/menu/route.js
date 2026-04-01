import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "Mess ID missing" }, { status: 400 });
    }

    const {
      mealTime,
      menutype,
      dishes = [],
      price,
      replace = false,
      deletedDishIds = [],
    } = await request.json();

    const { data: mess } = await supabase
      .from("mess")
      .select("*")
      .eq("id", id)
      .single();
    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const ownerId = mess.owner_id;
    if (!ownerId || ownerId !== session.user.id) {
      return NextResponse.json({ message: "Not the owner" }, { status: 403 });
    }

    const cleanedDishes = dishes
      .map((dish) => ({
        _id: dish?._id || dish?.id || undefined,
        name: (dish?.name || "").trim(),
        price: Number(dish?.price) || null,
        items: (dish?.items || [])
          .filter((it) => it?.name?.trim())
          .map((it) => ({
            name: it.name.trim(),
            price: Number(it.price) || null,
            isLimited: Boolean(it.isLimited),
            limitCount: Number(it.limitCount) || null,
          })),
      }))
      .filter((d) => d.name || d.items.length > 0);

    mess.mealTime = mealTime || "";
    if (menutype === "vegMenu") {
      if (price) mess.vegPrice = Number(price);
    } else if (menutype === "nonVegMenu") {
      if (price) mess.nonVegPrice = Number(price);
    } else {
      return NextResponse.json(
        { message: "Invalid menu type" },
        { status: 400 }
      );
    }

    const { data: existingMenu } = await supabase
      .from("menu")
      .select("*")
      .eq("mess_id", id)
      .eq("menutype", menutype)
      .single();

    const menuPayload = {
      mess_id: id,
      menutype,
      meal_time: mealTime || "",
      dishes: cleanedDishes,
    };

    let menuDoc = existingMenu;
    if (existingMenu) {
      const { data, error } = await supabase
        .from("menu")
        .update(menuPayload)
        .eq("id", existingMenu.id)
        .select()
        .single();
      if (error) throw error;
      menuDoc = data;
    } else {
      const { data, error } = await supabase
        .from("menu")
        .insert(menuPayload)
        .select()
        .single();
      if (error) throw error;
      menuDoc = data;
    }

    if (menutype === "vegMenu") {
      await supabase
        .from("mess")
        .update({
          veg_price: price ? Number(price) : mess.veg_price,
          veg_menu_ref_id: menuDoc.id,
          veg_menu: cleanedDishes,
          meal_time: mealTime || mess.meal_time,
        })
        .eq("id", id);
    } else if (menutype === "nonVegMenu") {
      await supabase
        .from("mess")
        .update({
          non_veg_price: price ? Number(price) : mess.non_veg_price,
          non_veg_menu_ref_id: menuDoc.id,
          non_veg_menu: cleanedDishes,
          meal_time: mealTime || mess.meal_time,
        })
        .eq("id", id);
    }

    return NextResponse.json(
      { message: "Menu added successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding/updating menu:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id)
      return NextResponse.json({ message: "Missing mess id" }, { status: 400 });

    const url = new URL(request.url);
    const menutype = url.searchParams.get("menutype");

    if (menutype) {
      const { data: menuDoc } = await supabase
        .from("menu")
        .select("*")
        .eq("mess_id", id)
        .eq("menutype", menutype)
        .maybeSingle();
      if (!menuDoc)
        return NextResponse.json(
          { message: "Menu not found" },
          { status: 404 }
        );
      return NextResponse.json(menuDoc, { status: 200 });
    }

    // if menutype not specified return all menus for this mess
    const { data: menus = [] } = await supabase
      .from("menu")
      .select("*")
      .eq("mess_id", id);
    return NextResponse.json(menus, { status: 200 });
  } catch (e) {
    console.error("Error fetching menu", e);
    return NextResponse.json(
      { message: "Server error", error: e.message },
      { status: 500 }
    );
  }
}
