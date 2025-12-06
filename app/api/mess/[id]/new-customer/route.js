import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Mess from "@/models/mess";
import Consumer from "@/models/consumer";
import NewMessCustomer from "@/models/newMessCustomer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params || {};

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { message: "Invalid or missing Mess ID" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const consumer = await Consumer.findById(session.user.id);
    if (!consumer) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (consumer.isBlocked) {
      return NextResponse.json(
        {
          message:
            "Your account is blocked by admin. You cannot register for a mess.",
        },
        { status: 403 }
      );
    }

    const existingCustomer = await NewMessCustomer.findOne({
      customer: session.user.id,
      mess: id,
    });

    if (existingCustomer) {
      const today = new Date();
      const joining = new Date(existingCustomer.joiningDate);
      const diffDays = Math.floor((today - joining) / (1000 * 60 * 60 * 24));

      const totalDuration = existingCustomer.messDuration || 30;
      const remaining = Math.max(totalDuration - diffDays, 0);

      if (remaining > 0) {
        return NextResponse.json(
          {
            message: `You are already registered. Your current mess service still has ${remaining} day(s) remaining.`,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      name,
      phone,
      address,
      gender,
      college,
      duration,
      foodPreference,
      emergencyContact,
      paymentMode,
    } = body || {};

    const phoneRe = /^[6-9]\d{9}$/;
    const durationEnum = ["Day", "Night", "Day + Night"]; 
    const genderEnum = ["Male", "Female", "Other"];

    if (!name || !phone || !duration) {
      return NextResponse.json(
        { message: "Missing required fields: name, phone, or duration" },
        { status: 400 }
      );
    }

    if (!phoneRe.test(phone)) {
      return NextResponse.json(
        { message: "Invalid phone number" },
        { status: 400 }
      );
    }

    if (emergencyContact && !phoneRe.test(emergencyContact)) {
      return NextResponse.json(
        { message: "Invalid emergency contact number" },
        { status: 400 }
      );
    }

    if (!durationEnum.includes(duration)) {
      return NextResponse.json(
        { message: "Invalid duration value" },
        { status: 400 }
      );
    }

    if (gender && !genderEnum.includes(gender)) {
      return NextResponse.json(
        { message: "Invalid gender value" },
        { status: 400 }
      );
    }

    const foodMap = {
      veg: "Veg",
      both: "Both",
      nonveg: "Non-Veg",
      "non-veg": "Non-Veg",
    };

    const mappedFoodPref =
      foodMap[(foodPreference || "").trim().toLowerCase()] || null;

    if (foodPreference && !mappedFoodPref) {
      return NextResponse.json(
        { message: "Invalid food preference" },
        { status: 400 }
      );
    }

    const mess = await Mess.findById(id);
    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const newCustomerPayload = {
      customer: [consumer._id],
      mess: id,
      duration,
      phone,
      paymentMode,
      name,
      address,
      gender,
      college,
      foodPreference: mappedFoodPref,
      emergencyContact,
      messDuration: mess.monthlyMessDuration || 30,
      joiningDate: new Date(),
    };

    const recipientName = consumer.username || "User";
    const recipientEmail = consumer.email ;

    try {
      await transporter.sendMail({
        from: `"MessMate Support" <${process.env.MAIL_USER}>`,
        to: recipientEmail,
        subject: "Request For Monthly Mess - MessMate",
        html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e5e5e5;">
            <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px;">
              Your Mess Application Has Been Submitted Successfully
            </h2>

            <p>Hello <b>${recipientName}</b>,</p>

            <p>Your application for the <b>Daily Mess</b> at <b>${mess.name}</b> has been submitted successfully.</p>

            <p>If you have applied for a <b>Monthly Mess plan</b>, please allow up to <b>24 hours</b> for the mess owner to review and approve your request.</p>

            <p>You will receive an email update as soon as the owner takes action. Thank you for choosing MessMate.</p>

            <p>Regards,<br/><b>MessMate Support Team</b></p>
          </div>
        </div>
        `,
      });
    } catch (mailErr) {
      console.error("Failed to send mail:", mailErr);
    }

    const messCustomer = await NewMessCustomer.create(newCustomerPayload);

    mess.newMessCustomer.push(messCustomer._id);
    await mess.save();

    return NextResponse.json(
      {
        message: "New Customer Added Successfully.",
        customer: messCustomer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERROR in Registering new Customer:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
