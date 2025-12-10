import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { token } = await params;
    await connectDB();
    const { default: Consumer } = await import(
      "../../../../../models/consumer"
    );
    const user = await Consumer.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
      return NextResponse.json({ message: "Link Expired" }, { status: 400 });
    }
    return NextResponse.json({ success: true, token: token }, { status: 200 });
  } catch (error) {
    console.log("Error In Getting the token : ", error);
    return NextResponse.json(
      { message: "Error While Getting Token" },
      { status: 400 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { default: Consumer } = await import(
      "../../../../../models/consumer"
    );

    const { token } = await params;
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { message: "Password is required" },
        { status: 400 }
      );
    }

    const user = await Consumer.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword; // or hash here manually
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Reset Error:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
