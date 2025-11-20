import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
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
    const { id } = await  params || {};
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { default: Owner } = await import("@/models/owner");

    console.log(
      `PATCH  called by session user:`,
      session?.user?.id
    );

    
      const owner = await Owner.findById(id);
      console.log("Found owner:", !!owner, "for id:", id);
      if (!owner)
        return NextResponse.json(
          { message: "owner not found" },
          { status: 404 }
        );
        const recipientEmail = owner.email;
      const recipientName = owner.name || "User";

    try {
      await transporter.sendMail({
        from: `"MessMate Support" <${process.env.MAIL_USER}>`,
        to: recipientEmail,
        subject: "Warninng Message - MessMate",
        html: `
  <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
    <div style="background: white; padding: 20px; border-radius: 8px;">
      <h2>Important Notice</h2>
      <p>Hello <b>${recipientName}</b>,</p>
      <p>
        We have detected activity on your account that may not align with our usage
        policies. We kindly request you to stop any form of malpractice, misuse of
        features, or actions that you are not permitted to perform on MessMate.
      </p>
      <p>
        Please make sure that you use the platform only for its intended purpose and
        follow all guidelines mentioned in our terms of use.
      </p>
      <p>
        Continued violation of these guidelines may result in temporary or permanent
        restrictions on your account.
      </p>
      <p style="margin-top: 20px;">
        If you believe this message was sent in error or have any questions, please
        contact our support team for clarification.
      </p>
      <p>Best regards,<br/>MessMate Support</p>
    </div>
  </div>
`,

      });
    } catch (mailErr) {
      console.error("Failed to send denial email:", mailErr);
    }

      
    //   console.log("Finally User Blocked : ", updatedUser.isBlocked)
      
      return NextResponse.json(
        { message:  "User warning sent"  },
        { status: 200 }
      );

  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}