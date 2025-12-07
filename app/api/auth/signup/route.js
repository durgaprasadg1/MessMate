import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../lib/mongodb.js";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { username, email, phoneNumber, address, password } = body;
    if (!username || !email || !password || !phoneNumber || !address) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const mod = await import("../../../../models/consumer.js");
    const Consumer = mod.default || mod;

    const existed = await Consumer.findOne({ email });
    if (existed) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Consumer({
      username,
      email,
      phone: phoneNumber,
      address,
      password: hashedPassword,
      haveMonthlyMess: false,
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: " Registration successful!",
        id: newUser._id,
        username: newUser.username,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json(
        { message: `Duplicate entry: ${field} already exists.` },
        { status: 409 }
      );
    }

    console.error("Error during registration:", error);
    return NextResponse.json(
      { message: "❌ Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
