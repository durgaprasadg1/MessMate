import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Mess from "@/models/mess";
import Consumer from "@/models/consumer";
import NewMessCustomer from "@/models/newMessCustomer";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"MessMate Support" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch {}
};

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id: messId } = await params;

    const mess = await Mess.findById(messId).populate("newMessCustomer");
    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    return NextResponse.json(
      { newMessCustomer: mess.newMessCustomer },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const { userId, joiningDate, allow, addDays } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID required" },
        { status: 400 }
      );
    }

    const user = await NewMessCustomer.findById(userId)
      .populate("customer")
      .populate("mess");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let updateFields = {};

    if (joiningDate) {
      updateFields.joiningDate = new Date(joiningDate);
    }

    if (typeof allow === "boolean") {
      updateFields.isAllowed = allow;

      const email = user.customer[0]?.email;
      const name = user.customer[0]?.username || "User";
      const messName = user.mess?.name;

      if (allow) {
        await sendMail(
          email,
          "Mess Registration Approved - MessMate",
          `<div style="font-family: Arial; padding: 22px; background: #f7f7f7;">
            <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
              <h2 style="margin-bottom: 15px;">Your Monthly Mess Registration Has Been Approved</h2>

              <p>Hello <b>${name}</b>,</p>

              <p>
                We are pleased to inform you that your request to join the 
                <b>${messName}</b> Monthly Mess has been <b>approved</b> by the mess owner.
                Your registration is now active and you can begin using all Monthly Mess services
                according to the plan you selected.
              </p>

              <p>
                This approval confirms that your details have been reviewed and verified by the mess owner.
                You are now officially added to their Monthly Mess customer list.
              </p>

              <p style="margin-top: 15px;">
                If you have any questions regarding schedules, meal timings, holidays, or billing,
                please feel free to reach out to the mess owner directly through the MessMate platform.
              </p>

              <p style="margin-top: 20px;">
                Regards,<br/>
                <b>MessMate Support Team</b>
              </p>
            </div>
          </div>`   
        );
      } else {
        await sendMail(
          email,
          "Mess Registration Updated - MessMate",
          `
          <div style="font-family: Arial; padding: 22px; background: #f7f7f7;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
            <h2>Your Monthly Mess Access Has Been Updated</h2>

            <p>Hello <b>${name}</b>,</p>

            <p>
              This message is to notify you that your access to the 
              <b>${messName}</b> Monthly Mess has been <b>temporarily disabled</b> by the mess owner.
            </p>

            <p>
              This action may have been taken due to incomplete payments, incorrect information, 
              rule violations, or other eligibility-related reasons defined by the mess owner.
            </p>

            <p>
              If you believe this update was made in error or require clarification, we recommend 
              contacting the mess owner directly through MessMate for further assistance.
            </p>

            <p style="margin-top: 20px;">
              Regards,<br/>
              <b>MessMate Support Team</b>
            </p>
          </div>
        </div>
        `
        );
      }
    }

    if (addDays && !isNaN(addDays)) {
      const extra = Number(addDays);
      const current = new Date(user.joiningDate);
      const updated = new Date(current);
      updated.setDate(updated.getDate() + extra);

      updateFields.joiningDate = updated;

      const email = user.customer[0]?.email;
      const name = user.customer[0]?.username || "User";
      const messName = user.mess?.name;

      await sendMail(
        email,
        "Mess Duration Extended - MessMate",
        `
        <div style="font-family: Arial; padding: 22px; background: #f7f7f7;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
            <h2>Your Monthly Mess Service Has Been Extended</h2>

            <p>Hello <b>${name}</b>,</p>

            <p>
              Good news! The mess owner at <b>${messName}</b> has added 
              <b>${extra} additional day(s)</b> to your Monthly Mess subscription.
            </p>

            <p>
              Your validity period has now been updated accordingly. You will continue 
              receiving your daily meal services without interruption based on your selected plan.
            </p>

            <p>
              This extension is usually granted in situations such as bonus days, adjustment of missed days, 
              or extension requests approved by the mess owner.
            </p>

            <p style="margin-top: 20px;">
              Regards,<br/>
              <b>MessMate Support Team</b>
            </p>
          </div>
        </div>
        `
      );
    }

    const updated = await NewMessCustomer.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true }
    );

    return NextResponse.json(
      { message: "Updated successfully", updated },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id: messId } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: "User ID missing" }, { status: 400 });
    }

    const user = await NewMessCustomer.findById(userId)
      .populate("customer")
      .populate("mess");

    const email = user?.customer?.[0]?.email;
    const name = user?.customer?.[0]?.username || "User";
    const messName = user?.mess?.name;

    await NewMessCustomer.findByIdAndDelete(userId);

    await Mess.findByIdAndUpdate(messId, {
      $pull: { newMessCustomer: userId },
    });

    if (email) {
      await sendMail(
        email,
        "Mess Registration Removed - MessMate",
        `
        <div style="font-family: Arial; padding: 22px; background: #f7f7f7;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
            <h2>Your Monthly Mess Registration Has Been Removed</h2>

            <p>Hello <b>${name}</b>,</p>

            <p>
              This is to inform you that your registration for the 
              <b>${messName}</b> Monthly Mess has been removed by the mess owner.
            </p>

            <p>
              This means you will no longer receive meals or services under the Monthly Mess plan. 
              Mess owners may remove registrations due to plan expiry, non-payment, or administrative updates.
            </p>

            <p>
              If you believe this action was taken incorrectly or wish to reapply, 
              you may contact the mess owner directly through MessMate or submit a new request.
            </p>

            <p style="margin-top: 20px;">
              Regards,<br/>
              <b>MessMate Support Team</b>
            </p>
          </div>
        </div>
        `
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
