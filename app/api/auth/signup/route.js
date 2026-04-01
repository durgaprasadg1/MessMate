import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import supabase from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, phoneNumber, address, password } = body;
    if (!username || !email || !password || !phoneNumber || !address) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const existedRes = await supabase
      .from("consumer")
      .select("id")
      .eq("email", email)
      .single();
    if (!existedRes.error && existedRes.data) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from("consumer")
      .insert({
        username,
        email,
        phone: phoneNumber,
        address,
        password: hashedPassword,
        have_monthly_mess: false,
      })
      .select("id, username")
      .single();
    if (error) throw error;

    return NextResponse.json(
      {
        message: " Registration successful!",
        id: newUser.id,
        username: newUser.username,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { message: "Duplicate entry: email already exists." },
        { status: 409 }
      );
    }

    console.error("Error during registration:", error);
    return NextResponse.json(
      { message: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
