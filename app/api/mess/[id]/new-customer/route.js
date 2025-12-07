import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Mess from "@/models/mess";
import Consumer from "@/models/consumer";
import NewMessCustomer from "@/models/newMessCustomer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import nodemailer from "nodemailer";
import crypto from "crypto";

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

    const { id } = (await params) || {};

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

    const allUserRegistrations = await NewMessCustomer.find({
      customer: session.user.id,
    });

    const today = new Date();
    const activeRegistrations = allUserRegistrations.filter((reg) => {
      const joining = new Date(reg.joiningDate);
      const diffDays = Math.floor((today - joining) / (1000 * 60 * 60 * 24));
      const totalDuration = reg.messDuration || 30;
      const remaining = Math.max(totalDuration - diffDays, 0);
      return remaining > 0;
    });

    const existingCustomer = await NewMessCustomer.findOne({
      customer: session.user.id,
      mess: id,
    });

    if (existingCustomer) {
      const joining = new Date(existingCustomer.joiningDate);
      const diffDays = Math.floor((today - joining) / (1000 * 60 * 60 * 24));

      const totalDuration = existingCustomer.messDuration || 30;
      const remaining = Math.max(totalDuration - diffDays, 0);

      if (remaining > 0) {
        return NextResponse.json(
          {
            message: `You are already registered in this mess. Your current service still has ${remaining} day(s) remaining.`,
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

    // Validate meal time restrictions
    const hasDay = activeRegistrations.some(
      (reg) => reg.duration === "Day" || reg.duration === "Day + Night"
    );
    const hasNight = activeRegistrations.some(
      (reg) => reg.duration === "Night" || reg.duration === "Day + Night"
    );

    if (duration === "Day" && hasDay) {
      return NextResponse.json(
        {
          message:
            "You are already registered for Day meal in another mess. Please choose Night meal or cancel your existing Day registration.",
        },
        { status: 403 }
      );
    }

    if (duration === "Night" && hasNight) {
      return NextResponse.json(
        {
          message:
            "You are already registered for Night meal in another mess. Please choose Day meal or cancel your existing Night registration.",
        },
        { status: 403 }
      );
    }

    if (duration === "Day + Night" && (hasDay || hasNight)) {
      return NextResponse.json(
        {
          message:
            "You are already registered for a meal time. You cannot register for both Day + Night.",
        },
        { status: 403 }
      );
    }

    if (
      (hasDay && hasNight) ||
      activeRegistrations.some((reg) => reg.duration === "Day + Night")
    ) {
      return NextResponse.json(
        {
          message:
            "You are already registered for both meal times. Please cancel an existing registration first.",
        },
        { status: 403 }
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

    // Validate food preference based on mess category
    if (foodPreference) {
      const messCategory = mess.category?.toLowerCase();
      const userPref = foodPreference.toLowerCase();

      if (messCategory === "veg" && userPref !== "veg") {
        return NextResponse.json(
          {
            message:
              "This is a vegetarian mess. You can only select 'Veg' as your food preference.",
          },
          { status: 400 }
        );
      }

      if (messCategory === "non-veg" && userPref === "veg") {
        return NextResponse.json(
          {
            message:
              "This is a non-vegetarian mess. Vegetarian options may not be available.",
          },
          { status: 400 }
        );
      }

      // For "both" category mess, all preferences are allowed
    }

    let calculatedAmount = mess.monthlyMessFee || 0;
    if (duration === "Day + Night") {
      calculatedAmount = calculatedAmount * 2;
    }

    if (paymentMode === "upi") {
      const Razorpay = (await import("razorpay")).default;
      const razor = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET,
      });

      const amount = Math.round(calculatedAmount * 100);
      const rOrder = await razor.orders.create({
        amount,
        currency: "INR",
        receipt: `mess_reg_${Date.now()}`,
      });

      const newCustomerPayload = {
        customer: [consumer._id],
        mess: [id],
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
        razorpayOrderId: rOrder.id,
        totalAmount: calculatedAmount,
        paymentStatus: "created",
      };

      const messCustomer = await NewMessCustomer.create(newCustomerPayload);

      return NextResponse.json(
        {
          message: "Order created for payment",
          order: rOrder,
          dbOrderId: messCustomer._id,
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: calculatedAmount,
        },
        { status: 200 }
      );
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
      paymentStatus: "paid",
      paymentVerified: true,
    };

    const recipientName = consumer.username || "User";
    const recipientEmail = consumer.email;

    const messCustomer = await NewMessCustomer.create(newCustomerPayload);

    mess.newMessCustomer.push(messCustomer._id);
    await mess.save();

    await Consumer.findByIdAndUpdate(consumer._id, {
      haveMonthlyMess: true,
    });

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

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = (await params) || {};
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrderId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { message: "Missing payment details" },
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
        { message: "Your account is blocked." },
        { status: 403 }
      );
    }

    const secret =
      process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const expectedSign = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const messCustomer = dbOrderId
      ? await NewMessCustomer.findById(dbOrderId)
      : await NewMessCustomer.findOne({ razorpayOrderId: razorpay_order_id });

    if (!messCustomer) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 }
      );
    }

    if (String(messCustomer.customer[0]) !== String(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (expectedSign === razorpay_signature) {
      messCustomer.paymentStatus = "paid";
      messCustomer.razorpayPaymentId = razorpay_payment_id;
      messCustomer.razorpaySignature = razorpay_signature;
      messCustomer.paymentVerified = true;
      await messCustomer.save();

      const mess = await Mess.findById(messCustomer.mess);
      if (!mess.newMessCustomer.includes(messCustomer._id)) {
        mess.newMessCustomer.push(messCustomer._id);
        await mess.save();
      }

      await Consumer.findByIdAndUpdate(consumer._id, {
        haveMonthlyMess: true,
      });

      const recipientName = consumer.username || "User";
      const recipientEmail = consumer.email;

      try {
        await transporter.sendMail({
          from: `"MessMate Support" <${process.env.MAIL_USER}>`,
          to: recipientEmail,
          subject: "Payment Successful - Monthly Mess Registration",
          html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e5e5e5;">
              <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; color: #10b981;">
                ✅ Payment Successful - Registration Confirmed
              </h2>

              <p>Hello <b>${recipientName}</b>,</p>

              <p>Your payment for the <b>Monthly Mess</b> at <b>${
                mess.name
              }</b> has been successfully received and verified.</p>

              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px;">Payment Invoice</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Transaction ID:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${razorpay_payment_id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Order ID:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${razorpay_order_id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #10b981;">₹${
                      messCustomer.totalAmount
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Duration:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${
                      messCustomer.duration
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Payment Date:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${new Date().toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>

              <p>Your mess registration is now complete. Please allow up to <b>24 hours</b> for the mess owner to review and approve your request.</p>

              <p>You can access your payment invoice anytime from your dashboard.</p>

              <p>Thank you for choosing MessMate!</p>

              <p>Regards,<br/><b>MessMate Support Team</b></p>
            </div>
          </div>
          `,
        });
      } catch (mailErr) {
        console.error("Failed to send payment confirmation mail:", mailErr);
      }

      const populatedCustomer = await NewMessCustomer.findById(messCustomer._id)
        .populate("mess")
        .populate("customer");

      return NextResponse.json(
        {
          message: "Payment verified successfully. Registration complete.",
          customer: populatedCustomer,
        },
        { status: 200 }
      );
    } else {
      messCustomer.paymentStatus = "failed";
      await messCustomer.save();

      return NextResponse.json(
        { message: "Invalid payment signature" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("ERROR in payment verification:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
