import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function POST(request, { params }) {
  try {
    const { id } = await params; 
    const session = await getServerSession(authOptions);

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.id !== id)
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );

    await connectDB();

    const Mess = (await import("../../../../../models/mess")).default;
    const Owner = (await import("../../../../../models/owner")).default;

    const formData = await request.formData();

    const name = formData.get("name") || "";
    const upi = formData.get("upi") || "";
    const email = formData.get("email") || "";
    const description = formData.get("description") || "";
    const address = formData.get("address") || "";
    const category = formData.get("category") || "";
    const limits = formData.get("limits") || "true";
    const ownerName = formData.get("ownerName") || "";
    const adharNumber = formData.get("adharNumber") || "";
    const phoneNumber = formData.get("phoneNumber") || "";
    const monthlyMessFee = Number(formData.get("monthlyMessFee") || 0);
    const monthlyMessDuration = Number(
      formData.get("monthlyMessDuration") || 0
    );

    console.log(monthlyMessDuration + "   " + monthlyMessFee);

    const lat = parseFloat(formData.get("lat") || "0");
    const lon = parseFloat(formData.get("lon") || "0");

    const file = formData.get("image");
    const certificate = formData.get("certificate");

    if (!name || !upi || !email || !file || !certificate) {
      return NextResponse.json(
        {
          message:
            "Make sure you have given name and uploaded banner and certificate",
        },
        { status: 400 }
      );
    }

    const upiRegex = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const aadharRegex = /^[0-9]{12}$/;

    if (!emailRegex.test(email))
      return NextResponse.json({ message: "Invalid Email" }, { status: 400 });

    if (!upiRegex.test(upi))
      return NextResponse.json({ message: "Invalid UPI" }, { status: 400 });

    if (!phoneRegex.test(phoneNumber))
      return NextResponse.json(
        { message: "Phone must be 10 digits" },
        { status: 400 }
      );

    if (!aadharRegex.test(adharNumber))
      return NextResponse.json(
        { message: "Aadhaar must be 12 digits" },
        { status: 400 }
      );

    const bannerBuffer = Buffer.from(await file.arrayBuffer());
    const bannerUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "MessImage" }, (err, res) =>
          err ? reject(err) : resolve(res)
        )
        .end(bannerBuffer);
    });

    const certBuffer = Buffer.from(await certificate.arrayBuffer());
    const certificateUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "Mess_certificate" }, (err, res) =>
          err ? reject(err) : resolve(res)
        )
        .end(certBuffer);
    });

    const messData = {
      name,
      email,
      upi,
      description,
      address,
      category,
      isLimited: limits === "true",
      ownerName,
      adharNumber,
      phoneNumber,
      lat: isNaN(lat) ? null : lat,
      lon: isNaN(lon) ? null : lon,
      image: {
        url: bannerUpload.secure_url,
        filename: file.name,
        public_id: bannerUpload.public_id,
      },
      certificate: {
        url: certificateUpload.secure_url,
        filename: certificate.name,
        public_id: certificateUpload.public_id,
      },
      vegMenu: [],
      nonVegMenu: [],
      vegMenuRef: null,
      nonVegMenuRef: null,
      owner: id,
      monthlyMessFee: monthlyMessFee,
      monthlyMessDuration : monthlyMessDuration,
    };

    let owner = await Owner.findById(id);
    if (!owner)
      return NextResponse.json(
        { message: "Failed to get Mess Owner" },
        { status: 500 }
      );

    const recipientName = messData.ownerName || "User";

    await transporter.sendMail({
      from: `"MessMate Support" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Mess Verification Request Received - MessMate",
      html: `
        <h3>Hello ${recipientName},</h3>
        <p>Your mess verification request has been received.</p>
        <p>Our team will verify your documents within 24 hours.</p>
        <p>We will notify you once verification is complete.</p>
        <br />
        <p>Regards,<br>MessMate Team</p>
      `,
    });

    const created = await Mess.create(messData);
    owner.messes.push(created._id);
    await owner.save();

    return NextResponse.json({ id: created._id }, { status: 201 });
  } catch (error) {
    console.error("Error creating mess:", error);
    return NextResponse.json(
      { error: "Failed to create mess", details: error.message },
      { status: 500 }
    );
  }
}
