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

    const {
      mealTime,
      menutype,
      dishes = [],
      price,
      replace = false,
      deletedDishIds = [],
    } = await request.json();

    const mess = await Mess.findById(id);
    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const ownerId = mess.owner ? mess.owner.toString() : null;
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

    // Update mess metadata
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

    // Find existing menu doc (if any)
    let menuDoc = await Menu.findOne({ mess: id, menutype });

    if (!menuDoc || replace) {
      // Replace entire menu (or create new)
      menuDoc = await Menu.findOneAndUpdate(
        { mess: id, menutype },
        { mess: id, menutype, mealTime: mealTime || "", dishes: cleanedDishes },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      // Merge/update existing menu doc instead of replacing
      // Remove any dishes explicitly deleted
      if (Array.isArray(deletedDishIds) && deletedDishIds.length) {
        menuDoc.dishes = menuDoc.dishes.filter(
          (d) =>
            !deletedDishIds.some((del) => del.toString() === d._id.toString())
        );
      }

      // Update or add incoming dishes
      for (const incoming of cleanedDishes) {
        // if incoming has an _id (client should send existing dish _id when editing)
        if (incoming._id) {
          const idx = menuDoc.dishes.findIndex(
            (d) => d._id.toString() === incoming._id.toString()
          );
          if (idx > -1) {
            // replace fields for that dish
            menuDoc.dishes[idx].name = incoming.name;
            menuDoc.dishes[idx].price = incoming.price;
            menuDoc.dishes[idx].items = incoming.items;
          } else {
            // fallback: push as new
            menuDoc.dishes.push(incoming);
          }
        } else {
          // try match by name (case-insensitive)
          const match = menuDoc.dishes.find(
            (d) =>
              d.name &&
              incoming.name &&
              d.name.trim().toLowerCase() === incoming.name.trim().toLowerCase()
          );
          if (match) {
            match.price = incoming.price;
            match.items = incoming.items;
          } else {
            menuDoc.dishes.push(incoming);
          }
        }
      }

      menuDoc.mealTime = mealTime || menuDoc.mealTime || "";
      await menuDoc.save();
    }

    // Store reference on Mess and keep a lightweight copy for quick access
    if (menuDoc) {
      if (menutype === "vegMenu") {
        mess.vegMenuRef = menuDoc._id;
        mess.vegMenu = menuDoc.dishes.map((d) => ({
          name: d.name,
          price: d.price,
          items: d.items,
        }));
      }
      if (menutype === "nonVegMenu") {
        mess.nonVegMenuRef = menuDoc._id;
        mess.nonVegMenu = menuDoc.dishes.map((d) => ({
          name: d.name,
          price: d.price,
          items: d.items,
        }));
      }
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

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    if (!id)
      return NextResponse.json({ message: "Missing mess id" }, { status: 400 });

    const url = new URL(request.url);
    const menutype = url.searchParams.get("menutype");

    if (menutype) {
      const menuDoc = await Menu.findOne({ mess: id, menutype });
      if (!menuDoc)
        return NextResponse.json(
          { message: "Menu not found" },
          { status: 404 }
        );
      return NextResponse.json(menuDoc, { status: 200 });
    }

    // if menutype not specified return all menus for this mess
    const menus = await Menu.find({ mess: id });
    return NextResponse.json(menus, { status: 200 });
  } catch (e) {
    console.error("Error fetching menu", e);
    return NextResponse.json(
      { message: "Server error", error: e.message },
      { status: 500 }
    );
  }
}
