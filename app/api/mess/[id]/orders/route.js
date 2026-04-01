import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const { id: messId } = await params;

    const { data: mess, error: messErr } = await supabase
      .from("mess")
      .select("id, owner_id, name")
      .eq("id", messId)
      .single();
    if (messErr) throw messErr;

    if (!mess) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const { data: orders, error } = await supabase
      .from("order")
      .select(
        "*, consumer:consumer_id(id, username, email)"
      )
      .eq("mess_id", messId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    if (!orders.length) {
      return NextResponse.json(
        {
          message: "No orders found for this Mess",
          orders: [],
          messOwnerId: mess.ownerId,
        },
        { status: 200 }
      );
    }

    const plainOrders = orders.map((o) => ({
      _id: o.id,
      consumer: o.consumer
        ? {
            _id: o.consumer.id,
            username: o.consumer.username,
            email: o.consumer.email,
          }
        : null,
      noOfPlate: o.no_of_plate ?? 0,
      selectedDishName: o.selected_dish_name ?? null,
      selectedDishPrice: o.selected_dish_price ?? 0,
      totalPrice: o.total_price ?? 0,
      status: o.status ?? "",
      isTaken: !!o.is_taken,
      done: !!o.done,
      refundInitiated: !!o.refund_initiated,
      isCancelled: !!o.is_cancelled,
      createdAt: o.created_at ? o.created_at : null,
    }));

    return NextResponse.json(
      { orders: plainOrders, messOwnerId: mess.owner_id, messId },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/mess/[id]/orders error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: messId } = await params;

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: mess, error: messErr } = await supabase
      .from("mess")
      .select("id, owner_id")
      .eq("id", messId)
      .single();
    if (messErr) throw messErr;

    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });

    if (!mess.owner_id || mess.owner_id !== session.user.id)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { data: completed } = await supabase
      .from("order")
      .select("id")
      .eq("mess_id", messId)
      .or("done.eq.true,status.eq.failed,status.eq.refunded");

    if (!completed.length) {
      return NextResponse.json(
        { message: "No completed or failed orders to delete", deleted: 0 },
        { status: 200 }
      );
    }

    const ids = completed.map((d) => d.id);

    await supabase.from("order").delete().in("id", ids);

    return NextResponse.json(
      { message: "Deleted completed or failed orders", deleted: ids.length },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/mess/[id]/orders error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
