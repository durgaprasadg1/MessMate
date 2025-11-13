import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Mess from "../../../../models/mess";



export async function GET() {

   

  try {
      await connectDB();
        const messes = await Mess.find({ isVerified: false });
      return NextResponse.json(messes);
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to fetch messes" },
        { status: 500 }
      );
    }

}
