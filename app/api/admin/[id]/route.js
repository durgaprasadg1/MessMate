import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Admin from "../../../../models/admin";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const admin = await Admin.findById(id);

    if (!admin) {
      return NextResponse.json(
        { message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { admin, message: "Admin found" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
