import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";
import supabase from "@/lib/supabaseClient";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { token } = await params;

    const { data: user } = await supabase
      .from("consumer")
      .select("*")
      .eq("reset_token", token)
      .gt("reset_token_expiry", new Date().toISOString())
      .single();
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
    const { token } = await params;
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { message: "Password is required" },
        { status: 400 }
      );
    }

    const { data: user } = await supabase
      .from("consumer")
      .select("*")
      .eq("reset_token", token)
      .gt("reset_token_expiry", new Date().toISOString())
      .single();

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await supabase
      .from("consumer")
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq("id", user.id);

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
