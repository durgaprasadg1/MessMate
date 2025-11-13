import { NextResponse } from "next/server";
import Mess from "../../../../../models/mess";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    await Mess.findByIdAndDelete(id);
    return NextResponse.json({ message: "Denied Verifying Mess and Deleted " });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to Verify messes" },
      { status: 500 }
    );
  }
}
