import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB();
    const mod = await import("../../../../../models/mess");
    const Mess = mod.default || mod;

    const formData = await request.formData();

    const name = formData.get("name")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const address = formData.get("address")?.toString() || "";
    const category = formData.get("category")?.toString() || "";
    const limits = formData.get("limits")?.toString() || "true";
    const ownerName = formData.get("ownerName")?.toString() || "";
    const adharNumber = formData.get("adharNumber")?.toString() || "";
    const phoneNumber = formData.get("phoneNumber")?.toString() || "";
    const lat = parseFloat(formData.get("lat")?.toString() || "0");
    const lon = parseFloat(formData.get("lon")?.toString() || "0");

    const file = formData.get("image");

    if (!name || !file) {
      return NextResponse.json(
        { message: "Name and image are required" },
        { status: 400 }
      );
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "mess_images",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    let url = uploadResult.secure_url;
    let fileName = "MessImage";
    let imageObj = { url, filename: fileName };

    // Ensure menus are initialized as empty arrays and refs are null on creation
    const messData = {
      name,
      description,
      address,
      category,
      isLimited: limits === "true",
      ownerName,
      adharNumber,
      phoneNumber,
      lat: isNaN(lat) ? undefined : lat,
      lon: isNaN(lon) ? undefined : lon,
      image: imageObj,
      vegMenu: [],
      nonVegMenu: [],
      vegMenuRef: null,
      nonVegMenuRef: null,
      owner: session.user.id
    };

    // TODO :  Mess Owner Addition


    const created = await Mess.create(messData);
    return NextResponse.json({ id: created._id }, { status: 201 });
  } catch (error) {
    console.error("Error creating mess:", error);
    return NextResponse.json(
      { error: "Failed to create mess", details: error?.message },
      { status: 500 }
    );
  }
}
