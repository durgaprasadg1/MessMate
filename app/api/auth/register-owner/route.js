import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { username, email, address, upi, phoneNumber, password } = body;
    if (!username || !email || !password || !phoneNumber || !address || !upi) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 }
      );
    }
    const upiRegex = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;
    if (!upiRegex.test(upi)) {
      return NextResponse.json(
        { message: "Invalid UPI/VPA ID format." },
        { status: 400 }
      );
    }
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { message: "Phone number must be 10 digits." },
        { status: 400 }
      );
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          message:
            "Password must contain uppercase, lowercase & special character.",
        },
        { status: 400 }
      );
    }
    const OwnerMod = await import("@/models/owner");
    const ConsumerMod = await import("@/models/consumer");
    const Owner = OwnerMod.default || OwnerMod;
    const Consumer = ConsumerMod.default || ConsumerMod;
    const ownerExists = await Owner.findOne({ email });
    const userExists = await Consumer.findOne({ email });
    if (ownerExists || userExists) {
      return NextResponse.json(
        { message: "Email is already registered." },
        { status: 409 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newOwner = await Owner.create({
      name: username,
      email,
      phoneNumber,
      upi,
      address,
      password: hashedPassword,
    });
    return NextResponse.json(
      {
        message: "Registration successful!",
        id: newOwner._id,
        username: newOwner.name,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json(
        {
          message: `Duplicate entry: ${field} already exists.`,
        },
        { status: 409 }
      );
    }
    console.error("REGISTRATION ERROR:", error);
    return NextResponse.json(
      {
        message: "Internal server error. Try again later.",
      },
      { status: 500 }
    );
  }
}
