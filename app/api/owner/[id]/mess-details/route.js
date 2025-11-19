import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.id !== id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const OwnerMod = await import("@/models/owner");
    const Owner = OwnerMod.default;

    const MessMod = await import("@/models/mess");
    const Mess = MessMod.default;

    const owner = await Owner.findById(id).populate("messes");

    return NextResponse.json({ messes: owner?.messes || [] });
  } catch (err) {
    console.error("ERROR in /api/owner/[id]/mess-details:", err);
    return NextResponse.json(
      { error: "Server Error", details: err?.message },
      { status: 500 }
    );
  }
}
