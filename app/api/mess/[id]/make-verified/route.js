import { NextResponse } from "next/server";
import Mess from "../../../../../models/mess";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function POST(req, { params }) {
  try {
    const { id } = await params;
     const mess = await Mess.findById(id);
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );

      const recipientEmail = mess.email;
      const recipientName = mess.ownerName || mess.name || "User";

    try {
      await transporter.sendMail({
        from: `"MessMate Support" <${process.env.MAIL_USER}>`,
        to: recipientEmail,
        subject: "Verification Denied - MessMate",
        html: `
        <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h2>Mess Verification Approved</h2>
            <p>Hello <b>${recipientName}</b>,</p>
            <p>
              We’re happy to inform you that your mess verification request has been 
              <b>approved</b>.
            </p>
            <p>
              Your mess <b>${messName}</b> has been successfully added to 
              <b>MessMate</b>. You can now manage your mess details, view registrations, 
              and use all available features from your dashboard.
            </p>
            <p style="margin-top: 20px;">
              <a 
                href="${dashboardLink}" 
                style="
                  display: inline-block;
                  padding: 10px 18px;
                  border-radius: 4px;
                  background: #4caf50;
                  color: #ffffff;
                  text-decoration: none;
                  font-weight: bold;
                "
              >
                Go to Dashboard
              </a>
            </p>
            <p style="margin-top: 20px;">
              If you did not make this request or believe this was a mistake, 
              please contact our support team immediately.
            </p>
            <p>Best regards,<br/>MessMate Support</p>
          </div>
        </div>
      `,
      });
    } catch (mailErr) {
      console.error("Failed to send denial email:", mailErr);
    }

      mess.isVerified = true;
      await mess.save();

    return NextResponse.json({ message: "Verified Mess" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to Verify messes" },
      { status: 500 }
    );
  }
}
