import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import NewMessCustomer from "@/models/newMessCustomer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { consumerid } = await params || {};

    if (!consumerid || !consumerid.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: "Invalid or missing userId" }, { status: 400 });
    }


    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.id !== consumerid) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const records = await NewMessCustomer.find({ customer: consumerid })
      .populate("mess")
      .populate("customer");

      // console.log("Records : ",records)
    if (!records || records.length === 0) {
      return NextResponse.json({ message: "No Monthly Mess subscription found for this user." }, { status: 404 });
    }

    return NextResponse.json({ monthlyMess: records }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
