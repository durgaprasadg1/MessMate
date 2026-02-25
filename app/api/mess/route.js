import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Mess from "../../../models/mess";

export async function GET() {
  try {
    const db = await connectDB();
    console.log("_------------- Conn : ", db)
    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database connection failed" },
        { status: 500 }
      );
    }

    const messes = await Mess.find().lean();
    // console.log("_-------------- Messes : ", messes)
    if (!messes || messes.length === 0) {
      return NextResponse.json(
        { success: true, message: "No mess records found", data: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: messes.length,
        data: messes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching mess data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch mess data",
      },
      { status: 500 }
    );
  }
}


