import { NextResponse } from "next/server";
import Mess from "../../../../../models/mess";

export async function POST(_req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Mess ID is required" },
        { status: 400 }
      );
    }

    await Mess.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Mess verification denied and record deleted",
    });
  } catch (error) {
    console.error("Delete Mess Error:", error);
    return NextResponse.json(
      { error: "Failed to delete mess", details: error.message },
      { status: 500 }
    );
  }
}
