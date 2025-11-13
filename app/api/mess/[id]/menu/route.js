import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import Mess from "../../../../../models/mess";
import Menu from "../../../../../models/menu";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    } 
    console.log(session);

    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "Mess ID missing" }, { status: 400 });
    }

    const { mealTime, menutype, dishes = [], price } = await request.json();

    const mess = await Mess.findById(id);
    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const ownerId = mess.owner ? mess.owner.toString() : null;
    if (!ownerId || ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "Not the owner" },
        { status: 403 }
      );
    }

    const cleanedDishes = dishes
      .map((dish) => ({
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

    if (menutype === "vegMenu") {
      mess.vegMenu = cleanedDishes;
      if (price) mess.vegPrice = Number(price);
    } else if (menutype === "nonVegMenu") {
      mess.nonVegMenu = cleanedDishes;
      if (price) mess.nonVegPrice = Number(price);
    } else {
      return NextResponse.json(
        { message: "Invalid menu type" },
        { status: 400 }
      );
    }

    mess.mealTime = mealTime || "";

    await mess.save();

    const menuDoc = await Menu.findOneAndUpdate(
      { mess: id, menutype },
      { mess: id, menutype, mealTime: mealTime || "", dishes: cleanedDishes },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Store reference on Mess
    if (menuDoc) {
      if (menutype === "vegMenu") mess.vegMenuRef = menuDoc._id;
      if (menutype === "nonVegMenu") mess.nonVegMenuRef = menuDoc._id;
      await mess.save();
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
