import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import supabase from "@/lib/supabaseClient";

export async function POST(request) {
  try {
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
    const ownerExists = await supabase
      .from("owner")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    const userExists = await supabase
      .from("consumer")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (ownerExists.data || userExists.data) {
      return NextResponse.json(
        { message: "Email is already registered." },
        { status: 409 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data: newOwner, error } = await supabase
      .from("owner")
      .insert({
        name: username,
        email,
        phone_number: phoneNumber,
        upi,
        address,
        password: hashedPassword,
      })
      .select("id, name")
      .single();
    if (error) throw error;

    return NextResponse.json(
      {
        message: "Registration successful!",
        id: newOwner.id,
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
