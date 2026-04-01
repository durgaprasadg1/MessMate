import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";
import {
  notifyOrderCancelled,
  notifyOrderCompleted,
  notifyOrderTaken,
  notifyOrderRefunded,
} from "@/lib/notifications";

export async function PATCH(request, { params }) {
  try {
    const { id, orderid } = await params;
    const body = await request.json();
    const action = body.action;

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: order, error: orderErr } = await supabase
      .from("order")
      .select("*")
      .eq("id", orderid)
      .single();
    if (orderErr) throw orderErr;
    if (!order)
      return NextResponse.json({ message: "Order not found" }, { status: 404 });

    if (action === "cancel") {
      if (order.isTaken)
        return NextResponse.json(
          { message: "Cannot cancel, order already taken" },
          { status: 403 }
        );
      if (order.consumer.toString() !== session.user.id)
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      try {
        await supabase
          .from("order")
          .update({
            is_cancelled: true,
            refund_initiated: order.status === "paid",
            status: order.status === "paid" ? "failed" : order.status,
          })
          .eq("id", orderid);

        // Notify owner about cancellation
        try {
          const { data: mess } = await supabase
            .from("mess")
            .select("id,name, owner:owner_id(*)")
            .eq("id", order.mess_id)
            .single();
          if (mess?.owner) {
            await notifyOrderCancelled(
              order.id,
              mess.owner.id,
              "Owner",
              order.mess_id,
              mess.name || "your mess",
              "customer"
            );
          }
        } catch (notifErr) {
          console.error("Notification failed:", notifErr);
        }

        return NextResponse.json(
          { message: "Order cancelled; refund will be started soon" },
          { status: 200 }
        );
      } catch (e) {
        console.error("Cancel order failed", e);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
      }
    }

    if (action === "take") {
      const { data: mess } = await supabase
        .from("mess")
        .select("id,name, owner:owner_id(*)")
        .eq("id", order.mess_id)
        .single();
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );
      if (!mess.owner || mess.owner.id !== session.user.id)
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      await supabase
        .from("order")
        .update({ is_taken: true })
        .eq("id", orderid);

      // Notify consumer that order is taken
      try {
        await notifyOrderTaken(
          order.id,
          order.consumer_id,
          order.mess_id,
          mess?.name || "the mess"
        );
      } catch (notifErr) {
        console.error("Notification failed:", notifErr);
      }

      return NextResponse.json(
        { message: "Order marked as taken" },
        { status: 200 }
      );
    }

    if (action === "refund" || action === "returnPayment") {
      const { data: mess } = await supabase
        .from("mess")
        .select("id,name, owner:owner_id(*)")
        .eq("id", order.mess_id)
        .single();
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );
      if (!mess.owner || mess.owner.id !== session.user.id)
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      try {
        await supabase
          .from("order")
          .update({
            is_cancelled: true,
            refund_initiated: true,
            status: order.status === "paid" ? "refunded" : "failed",
          })
          .eq("id", orderid);

        // Notify consumer about refund
        try {
          await notifyOrderRefunded(
            order.id,
            order.consumer_id,
            order.mess_id,
            mess?.name || "the mess",
            order.total_price / 100
          );
        } catch (notifErr) {
          console.error("Notification failed:", notifErr);
        }

        return NextResponse.json(
          { message: "Refund initiated and order marked cancelled" },
          { status: 200 }
        );
      } catch (e) {
        console.error("Refund order failed", e);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
      }
    }

    if (action === "markDone") {
      const { data: mess } = await supabase
        .from("mess")
        .select("id,name, owner:owner_id(*)")
        .eq("id", order.mess_id)
        .single();
      if (!mess)
        return NextResponse.json(
          { message: "Mess not found" },
          { status: 404 }
        );
      if (!mess.owner || mess.owner.id !== session.user.id)
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      await supabase
        .from("order")
        .update({ done: true, status: "completed" })
        .eq("id", orderid);

      // Notify consumer that order is completed
      try {
        await notifyOrderCompleted(
          order.id,
          order.consumer_id,
          order.mess_id,
          mess?.name || "the mess"
        );
      } catch (notifErr) {
        console.error("Notification failed:", notifErr);
      }

      return NextResponse.json(
        { message: "Order marked completed" },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Order PATCH error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id, orderid } = await params;
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: order } = await supabase
      .from("order")
      .select("*")
      .eq("id", orderid)
      .single();
    if (!order)
      return NextResponse.json({ message: "Order not found" }, { status: 404 });

    const { data: mess } = await supabase
      .from("mess")
      .select("*")
      .eq("id", order.mess_id)
      .single();
    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    if (!mess.ownerId || mess.ownerId !== session.user.id)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    if (order.done)
      return NextResponse.json(
        { message: "Cannot delete a completed order" },
        { status: 400 }
      );

    try {
    await supabase.from("order").delete().eq("id", orderid);

      return NextResponse.json({ message: "Order deleted" }, { status: 200 });
    } catch (e) {
      console.error("Delete order failed", e);
      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
  } catch (err) {
    console.error("Order DELETE error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
