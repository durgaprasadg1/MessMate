import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb.js";
import Consumer from "../../../../models/consumer.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function POST(req) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email Not Found" },
        { status: 400 }
      );
    }
    let user = await Consumer.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "User with that email Not Found" },
        { status: 404 }
      );
    }

    user.resetToken = crypto.randomBytes(32).toString("hex");
    user.resetTokenExpiry = Date.now() + 3600000; 

    await user.save();

    const link = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password/${user.resetToken}`;

    await transporter.sendMail({
      from: `"MessMate Support" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request - MessMate",
      html: `
        <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 20px; border-radius: 8px;">
          <h2>Password Reset</h2>
          <p>Hello <b>${user.username || "User"}</b>,</p>
          <p>Click the button below to reset your password:</p>

          <a href="${link}" 
          style="background: #0d6efd; color: white; padding: 10px 20px; display: inline-block; border-radius: 5px; text-decoration: none;">
            Reset Password
          </a>

          <p>If the button doesn't work, use the link below:</p>
          <p>${link}</p>

          <p>This link is valid for <b>1 hour</b>.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "Mail Sent" },
      { status: 200 }
    );

  } catch (error) {
    console.log("Error In Sending Mail : ", error);
    return NextResponse.json(
      { message: "Some Internal Error." },
      { status: 500 }
    );
  }
}
