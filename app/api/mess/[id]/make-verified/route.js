import { NextResponse } from "next/server";
import Mess from "../../../../../models/mess";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
     const mess = await Mess.findById(id);
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );

      // owner-only
      // const ownerId = mess.owner ? mess.owner.toString() : null;
      // if (!ownerId || ownerId !== session.user.id) {
      //   return NextResponse.json(
      //     { message: "Forbidden: not the owner" },
      //     { status: 403 }
      //   );
      // }

      mess.isVerified = true;
      await mess.save();

    return NextResponse.json({ message: "Verified Mess" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to Verify messes" },
      { status: 500 }
    );
  }
}
