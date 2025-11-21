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
    console.log("Request Received For ID ",id)
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
    const upi = formData.get("upi")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
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

    if (!name || !upi || !email || !file || !certificate) {
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
      email,
      upi,
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
    
  
    let owner = await Owner.findById(id);
    if (!owner) {
      return NextResponse.json(
        { message: "Failed to get Mess Owner" },
        { status: 500 }
      );
    }
    const recipientName = messData?.ownerName || "User";
    
    try {
        await transporter.sendMail({
        from: `"MessMate Support" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Password Reset Request - MessMate",

        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e5e5e5;">
              <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px;">
                Mess Verification Request Received
              </h2>

              <p style="margin: 0 0 12px 0;">Hello <b>${recipientName}</b>,</p>

              <p style="margin: 0 0 12px 0;">
                We have successfully received your <b>mess verification request</b> on MessMate.
              </p>

              <p style="margin: 0 0 12px 0;">
                Our team will now review the details and documents you have submitted. 
                This verification process may take up to <b>24 hours</b>.
              </p>

              <p style="margin: 0 0 12px 0;">
                Once the verification is completed, you will receive a follow-up email informing you whether 
                your mess has been <b>approved</b> or if any further information is required.
              </p>

              <p style="margin: 0 0 12px 0;">
                If you have submitted this request by mistake or need to update your details, 
                please contact our support team at your earliest convenience.
              </p>

              <p style="margin: 16px 0 0 0;">
                Regards,<br/>
                <b>MessMate Support Team</b>
              </p>
            </div>
          </div>
        `
      });
      const created = await Mess.create(messData);
      owner.messes.push(created._id);
      await owner.save(); 
      return NextResponse.json({ id: created._id }, { status: 201 });
    } catch (error) {
      
    }
    
  } catch (error) {
    console.error("Error creating mess:", error);
    return NextResponse.json(
      { error: "Failed to create mess", details: error?.message },
      { status: 500 }
    );
  }
}
