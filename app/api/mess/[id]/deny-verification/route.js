import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import supabase from "@/lib/supabaseClient"; 
import { deleteCacheKeys } from "@/lib/redis";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const runtime = "nodejs";

export async function POST(_req, { params }) {
  try {
    const { id } = await params;
    const tenantId = _req.headers.get("x-tenant-id") || "public";

    if (!id) {
      return NextResponse.json(
        { error: "Mess ID is required" },
        { status: 400 }
      );
    }

    const { data: mess, error } = await supabase
      .from("mess")
      .delete()
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    if (!mess) {
      return NextResponse.json(
        { error: "Mess not found or already deleted" },
        { status: 404 }
      );
    }

    const recipientEmail = mess.email;
    const recipientName = mess.ownerName || mess.name || "User";

    try {
      await transporter.sendMail({
        from: `"MessMate Support" <${process.env.MAIL_USER}>`,
        to: recipientEmail,
        subject: "Verification Denied - MessMate",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e5e5e5;">
              <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px;">
                Mess Verification Request - Denied
              </h2>

              <p style="margin: 0 0 12px 0;">Hello <b>${recipientName}</b>,</p>

              <p style="margin: 0 0 12px 0;">
                Thank you for submitting your mess registration request on <b>MessMate</b>.
                After reviewing the information provided, we are unable to approve your request at this time.
              </p>

              <p style="margin: 0 0 12px 0;">
                The request has been denied because one or more <b>mandatory details</b> were missing or incomplete. 
                This includes, but may not be limited to:
              </p>

              <ul style="margin: 0 0 12px 18px; padding: 0;">
                <li>Mess name</li>
                <li>UPI ID / payment details</li>
                <li>Registered email address</li>
                <li>Verification certificate</li>
                <li>Banner image / mess photo</li>
              </ul>

              <p style="margin: 0 0 12px 0;">
                To proceed further, please ensure that all required information and documents are correctly
                provided and clearly visible, and then submit a fresh verification request.
              </p>

              <p style="margin: 0 0 12px 0;">
                If you believe this decision was made in error, or if you need guidance on the required details,
                you may contact our support team with the relevant information and we will be happy to assist you.
              </p>

              <p style="margin: 16px 0 0 0;">
                Regards,<br/>
                <b>MessMate Support Team</b>
              </p>
            </div>
          </div>
        `

      });
    } catch (mailErr) {
      console.error("Failed to send denial email:", mailErr);
    }

    await deleteCacheKeys([
      `tenant:${tenantId}:mess:${id}`,
      `tenant:${tenantId}:messes:all`,
      `tenant:${tenantId}:messes:pending`,
    ]);

    return NextResponse.json({
      message: "Mess verification denied and record deleted",
    });
  } catch (error) {
    console.error("Delete Mess Error:", error);
    return NextResponse.json(
      { error: "Failed to delete mess", details: error.message },
      { status: 500 }
    );
  }
}
