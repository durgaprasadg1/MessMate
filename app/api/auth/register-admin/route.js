import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../lib/mongodb.js";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { username, email,address, phoneNumber, password } = body;
    if (!username || !email || !password || !phoneNumber || !address ) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const mod = await import("../../../../models/admin.js");
    const Con_mod = await import("../../../../models/consumer.js");
    const Admin = mod.default || mod;
    const Consumer = Con_mod.default || mod;

    const existingUser = await Consumer.findOne({ email })
    const existed = await Admin.findOne({ email });

    if (existed || existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name : username,
      email,
      phoneNumber,
      address,
      password: hashedPassword,
    });

    await newAdmin.save();

    return NextResponse.json(
      {
        message: "✅ Registration successful!",
        id: newAdmin._id,
        username: newAdmin.name,
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
