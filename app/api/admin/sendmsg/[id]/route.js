import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";

export async function POST(request, { params }) {
  try {
    const { id } = await params || {};

    const body = await request.json();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { data: mess, error: messErr } = await supabase
      .from("mess")
      .select("id, owner_id")
      .eq("id", id)
      .single();
    if (messErr) throw messErr;
    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const { error: createErr } = await supabase.from("message").insert({
      message: body.message,
      to_mess_id: mess.id,
    });
    if (createErr) throw createErr;

    return NextResponse.json({ message: "Message received" }, { status: 200 });
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
    const { id } = await params || {};

    const { data: mess, error: messErr } = await supabase
      .from("mess")
      .select("id, is_blocked")
      .eq("id", id)
      .single();
    if (messErr) throw messErr;

    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const { data: updated, error: updErr } = await supabase
      .from("mess")
      .update({ is_blocked: !mess.is_blocked })
      .eq("id", id)
      .select()
      .single();
    if (updErr) throw updErr;

    return NextResponse.json(
      { message: "Mess open/close updated", mess: updated },
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

export async function DELETE(request, { params }) {
  try {
    const { id } = await params || {};
    const { error: delErr } = await supabase
      .from("message")
      .delete()
      .eq("id", id);
    if (delErr) throw delErr;
    return NextResponse.json({ message: "Message deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error fetching Msg by ID:", error);
    return NextResponse.json(
      { message: "Some Server error", error: error.message },
      { status: 500 }
    );
  }
}
