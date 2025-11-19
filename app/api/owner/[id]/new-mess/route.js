import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { id } = await params; 

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.id !== id) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    await connectDB();

    const Mess = (await import("../../../../../models/mess")).default;
    const Owner = (await import("../../../../../models/owner")).default;
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
    const certificate = formData.get("certificate");

    if (!name || !file || !certificate) {
      return NextResponse.json(
        {
          message:
            "Make sure you have given name and uploaded banner and certificate",
        },
        { status: 400 }
      );
    }

    
    const bannerBuffer = Buffer.from(await file.arrayBuffer());
    const bannerUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "MessImage" }, (err, result) =>
          err ? reject(err) : resolve(result)
        )
        .end(bannerBuffer);
    });

    const certBuffer = Buffer.from(await certificate.arrayBuffer());
    const certificateUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "Mess_certificate" }, (err, result) =>
          err ? reject(err) : resolve(result)
        )
        .end(certBuffer);
    });

    const imageObj = {
      url: bannerUpload.secure_url,
      filename: file.name,
      public_id: bannerUpload.public_id,
    };

    const certification = {
      url: certificateUpload.secure_url,
      filename: certificate.name,
      public_id: certificateUpload.public_id,
    };

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
      certificate: certification,
      vegMenu: [],
      nonVegMenu: [],
      vegMenuRef: null,
      nonVegMenuRef: null,
      owner: session.user.id,
    };
    const created = await Mess.create(messData);
    let owner = await Owner.findById(id);
    if (!owner) {
      return NextResponse.json(
        { message: "Failed to get Mess Owner" },
        { status: 500 }
      );
    }
    owner.messes.push(created._id);
    await owner.save(); 
    return NextResponse.json({ id: created._id }, { status: 201 });
  } catch (error) {
    console.error("Error creating mess:", error);
    return NextResponse.json(
      { error: "Failed to create mess", details: error?.message },
      { status: 500 }
    );
  }
}
