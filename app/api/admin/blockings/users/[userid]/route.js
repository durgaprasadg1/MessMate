import { NextResponse } from "next/server";
import { connectDB } from "../../../../../../lib/mongodb";
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

export async function PATCH(request, { params }) {
  try {
    const { userid } = (await params) || {};
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { consumerage: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();
    const { default: Consumer } = await import(
      "../../../../../../models/consumer"
    );

    console.log(`PATCH  called by session user:`, session?.user?.id);

    const consumer = await Consumer.findById(userid);
    console.log("Found Consumer:", !!consumer, "for id:", userid);
    if (!consumer)
      return NextResponse.json(
        { consumerage: "consumer not found" },
        { status: 404 }
      );

    const updatedUser = await Consumer.findByIdAndUpdate(
      userid,
      { $set: { isBlocked: !consumer.isBlocked } },
      { new: true }
    );
    if (updatedUser.isBlocked) {
      try {
        const recipientEmail = consumer.email;
        const recipientName = consumer.username || "User";
        await transporter.sendMail({
          from: `"MessMate Support" <${process.env.MAIL_USER}>`,
          to: recipientEmail,
          subject: "Blocking Account  - MessMate",
          html: `
          <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h2>Account Access Restricted</h2>
              <p>Hello <b>${recipientName}</b>,</p>
              <p>
                This is to inform you that your <b>MessMate</b> account has been
                temporarily <b>blocked</b> due to activity that does not align with our
                usage policies.
              </p>
              <p>
                During this period, you will not be able to access certain features or
                perform actions that are reserved for compliant users of the platform.
              </p>
              <p>
                We kindly request you to review our terms of use and ensure that any
                future activity strictly follows the guidelines and appropriate use of
                MessMate.
              </p>
              <p style="margin-top: 20px;">
                If you believe this action was taken in error or would like to request
                a review of your account status, please contact our support team with
                the necessary details.
              </p>
              <p>
                We appreciate your understanding and cooperation.
              </p>
              <p>Best regards,<br/>MessMate Support</p>
            </div>
          </div>
        `,
        });
      } catch (mailErr) {
        console.error("Failed to send denial email:", mailErr);
      }
    }
    console.log("Finally User Blocked : ", updatedUser.isBlocked);

    return NextResponse.json(
      {
        message: updatedUser.isBlocked ? "User Unblocked" : "User Blocked",
        user: updatedUser,
      },
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
