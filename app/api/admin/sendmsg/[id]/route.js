import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function POST(request, { params }) {
  try {
    const { id } = await params || {};
    

    const body = await request.json();
    await connectDB();

    const { default: Mess } = await import("../../../../../models/mess");
    const { default: Message } = await import("../../../../../models/message");

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const mess = await Mess.findById(id);
    if (!mess) {
      return NextResponse.json(
        { message: "Mess not found" },
        { status: 404 }
      );
    }

    console.log("Data : ", body);

    const msg = await Message.create({
      message: body.message,
      mess: mess._id, 
    });

    mess.alert.push(msg._id);
    await mess.save();

    return NextResponse.json(
      { message: "Message received" },
      { status: 200 }
    );
  } catch (err) {
    console.error("/api/admin/sendmsg/[id] error:", err);
    return NextResponse.json(
      { message: "Server error", details: err?.message },
      { status: 500 }
    );
  }
}


export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    const { default: Mess } = await import("@/models/mess.js");
    const mess = await Mess.findById(id);

    if (!mess) {
      return NextResponse.json(
        { message: "Mess not found" },
        { status: 404 }
      );
    }

    mess.isBlocked = !mess.isBlocked;
    await mess.save();

    return NextResponse.json(
      { message: "Mess open/close updated", mess },
      { status: 200 }
    );

  } catch (err) {
    console.error("Error fetching Mess by ID:", err);
    return NextResponse.json(
      { message: "Some Server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request,{params}){
  try {
    const {id} = await params;
    await connectDB();
    const { default: Message } = await import("../../../../../models/message");

    let deletedMsg = Message.findbyIdAndDelete(id)
    if(!deletedMsg){
      return NextResponse.json({message : "Message Not Found"}, {status :  404})
    }
    return NextResponse.json(
      {message : "Message Not Found"},
      {status :  404}
    )


  } catch (error) {
    console.error("Error fetching Msg by ID:", error);
    return NextResponse.json(
      { message: "Some Server error", error: error.message },
      { status: 500 }
    );
  }
}
