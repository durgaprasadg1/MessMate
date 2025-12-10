import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
// dynamic import of models performed inside handler to avoid circular import / registration timing issues

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const { default: Owner } = await import("../../../../models/owner");

    const owner = await Owner.findById(id);

    if (!owner) {
      return NextResponse.json({ message: "owner not found" }, { status: 404 });
    }

    return NextResponse.json(
      { owner, message: "owner found" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching owner:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
