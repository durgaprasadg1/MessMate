import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../lib/mongodb.js";
import Owner from "../../../models/owner.js";

export async function POST(request) {
  try {
    await connectDB();
    const { default: Consumer } = await import("../../../models/consumer.js");
    const body = await request.json();
    const { name, email, phoneNumber, address, password } = body;
    if (!name || !email || !password || !phoneNumber || !address) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const existed = await Consumer.findOne({ email });
    if (existed) {
      return NextResponse.json(
        { message: "A Consumer with this email already exists." },
        { status: 409 }
      );
    }

    const existedOwner = await Owner.findOne({ email });
    if (existedOwner) {
      return NextResponse.json(
        { message: "A Owner with this email already exists." },
        { status: 409 }
      );
    }

    const modadmin = await import("../../../models/admin.js");
    const Admin = modadmin.default || mod;
    const Existadmin = await Admin.findOne({ email });
    if (Existadmin) {
      return NextResponse.json(
        { message: "A Admin with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Admin({
      name,
      email,
      phoneNumber,
      address,
      password: hashedPassword,
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: "Registration successful!",
        id: newUser._id,
        name: newUser.name,
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
