import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import supabase from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phoneNumber, address, password } = body;
    if (!name || !email || !password || !phoneNumber || !address) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const existed = await supabase
      .from("consumer")
      .select("id")
      .eq("email", email)
      .single();
    if (!existed.error && existed.data) {
      return NextResponse.json(
        { message: "A Consumer with this email already exists." },
        { status: 409 }
      );
    }

    const existedOwner = await supabase
      .from("owner")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existedOwner.data) {
      return NextResponse.json(
        { message: "A Owner with this email already exists." },
        { status: 409 }
      );
    }

    const existAdmin = await supabase
      .from("admin")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existAdmin.data) {
      return NextResponse.json(
        { message: "A Admin with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from("admin")
      .insert({
        name,
        email,
        phone_number: phoneNumber,
        address,
        password: hashedPassword,
      })
      .select("id, name")
      .single();
    if (error) throw error;

    return NextResponse.json(
      {
        message: "Registration successful!",
        id: newUser.id,
        name: newUser.name,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { message: "Duplicate entry: unique constraint violated." },
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
