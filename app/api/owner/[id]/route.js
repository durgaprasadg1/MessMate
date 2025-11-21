import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Owner from "../../../../models/owner";

export async function GET(request, { params }) {
    console.log("Received Get Request for owner ")
  try {
    await connectDB();
    const { id } = await params;

    const owner = await Owner.findById(id);

    if (!owner) {
      return NextResponse.json(
        { message: "owner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { owner, message: "owner found" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching owner:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
