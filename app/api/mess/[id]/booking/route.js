import { NextResponse } from "next/server";
import { validateAgainst } from "../../../../../lib/validateRequest";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from "crypto";
import supabase from "@/lib/supabaseClient";
import {
  notifyNewOrder,
  notifyOwnerNewOrder,
} from "../../../../../lib/notifications";

async function computePricePerPlate(mess, menutype, selectedDish) {
  let menuArray =
    menutype === "vegMenu" ? mess.vegMenu || [] : mess.nonVegMenu || [];

  try {
    if (menutype === "vegMenu" && mess.veg_menu_ref_id) {
      const { data: menuDoc } = await supabase
        .from("menu")
        .select("*")
        .eq("id", mess.veg_menu_ref_id)
        .single();
      if (menuDoc?.dishes && Array.isArray(menuDoc.dishes)) {
        menuArray = menuDoc.dishes;
      }
    } else if (menutype === "nonVegMenu" && mess.non_veg_menu_ref_id) {
      const { data: menuDoc } = await supabase
        .from("menu")
        .select("*")
        .eq("id", mess.non_veg_menu_ref_id)
        .single();
      if (menuDoc?.dishes && Array.isArray(menuDoc.dishes)) {
        menuArray = menuDoc.dishes;
      }
    }
  } catch (e) {
    console.error("Menu lookup failed, falling back to mess arrays", e);
  }

  let pricePerPlate = 0;
  let dishName = null;
  if (
    selectedDish !== undefined &&
    selectedDish !== null &&
    selectedDish !== ""
  ) {
    const idx = Number(selectedDish);
    const dish = menuArray[idx];
    if (dish) {
      if (
        typeof dish === "object" &&
        dish.price !== undefined &&
        dish.price !== null &&
        Number(dish.price) > 0
      ) {
        pricePerPlate = Number(dish.price) || 0;
      } else if (
        typeof dish === "object" &&
        Array.isArray(dish.items) &&
        dish.items.length
      ) {
        pricePerPlate = dish.items.reduce(
          (s, it) => s + (it && it.price ? Number(it.price) || 0 : 0),
          0,
        );
      }

      if (dish && typeof dish === "object") {
        if (dish.name && String(dish.name).trim()) {
          dishName = String(dish.name).trim();
        } else if (Array.isArray(dish.items) && dish.items.length) {
          // join inner item names
          const names = dish.items
            .map((it) => (it && it.name ? String(it.name).trim() : ""))
            .filter(Boolean);
          if (names.length) dishName = names.join(" + ");
        }
      }
    }
  }

  if (!pricePerPlate) {
    if (mess.category === "veg" || menutype === "vegMenu")
      pricePerPlate = mess.vegPrice || 0;
    else pricePerPlate = mess.nonVegPrice || 0;
  }

  if (!dishName) {
    if (
      selectedDish !== undefined &&
      selectedDish !== null &&
      selectedDish !== ""
    ) {
      dishName = String(selectedDish);
    } else {
      dishName = null;
    }
  }

  return { pricePerPlate, dishName };
}

export async function POST(request, { params }) {
  try {
    const { id } = (await params) || {};
    const body = await request.json();
    const { bookingCreateSchema, bookingPaymentSchema } =
      await import("../../../../../validators/booking.validator.js");

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: consumer } = await supabase
      .from("consumer")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (!consumer)
      return NextResponse.json(
        { message: "Consumer not found" },
        { status: 404 },
      );
    if (consumer.isBlocked)
      return NextResponse.json(
        {
          message:
            "Your account is blocked by admin due to your activities. You cannot create bookings.",
        },
        { status: 403 },
      );

    const { data: mess } = await supabase
      .from("mess")
      .select("*")
      .eq("id", id)
      .single();
    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });

    const validateResult = validateAgainst(bookingCreateSchema, body || {});
    if (!validateResult.ok) {
      return NextResponse.json(
        { message: "Validation failed", errors: validateResult.errors },
        { status: 400 },
      );
    }

    const {
      noOfPlate: validatedNoOfPlate,
      menutype: validatedMenuType,
      selectedDish: validatedSelectedDish,
    } = validateResult.data;
    const noOfPlate = Number(validatedNoOfPlate || 1);
    const menutype = validatedMenuType || body.menutype || "vegMenu";
    const selectedDish = validatedSelectedDish ?? body.selectedDish;

    const dishInfo = await computePricePerPlate(mess, menutype, selectedDish);
    const pricePerPlate = dishInfo.pricePerPlate;
    const dishName = dishInfo.dishName;

    if (!pricePerPlate || pricePerPlate <= 0) {
      return NextResponse.json(
        { message: "Cannot determine price for selected dish" },
        { status: 400 },
      );
    }

    const amount = Math.round(pricePerPlate * 100 * (noOfPlate || 1));

    const Razorpay = (await import("razorpay")).default;
    const razor = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const rOrder = await razor.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    let selectedDishName =
      dishName ||
      (typeof selectedDish === "string"
        ? selectedDish
        : String(selectedDish));

    const { data: dbOrder, error } = await supabase
      .from("order")
      .insert({
        mess_id: id,
        consumer_id: session.user.id,
        total_price: amount,
        razorpay_order_id: rOrder.id,
        status: "created",
        no_of_plate: noOfPlate,
        selected_dish_name: selectedDishName,
        selected_dish_price: pricePerPlate,
        mess_name: mess?.name,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(
      {
        message: "Order created",
        order: rOrder,
        dbOrderId: dbOrder.id,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Booking POST error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params || {};
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrderId,
    } = body;

    const { bookingPaymentSchema } =
      await import("../../../../../validators/booking.validator.js");

    const paymentValidation = validateAgainst(bookingPaymentSchema, body || {});
    if (!paymentValidation.ok) {
      return NextResponse.json(
        { message: "Validation failed", errors: paymentValidation.errors },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret =
      process.env.RAZORPAY_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_KEYSECRET;

    const expectedSign = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const { data: dbOrder } = dbOrderId
      ? await supabase
          .from("order")
          .select("*")
          .eq("id", dbOrderId)
          .single()
      : await supabase
          .from("order")
          .select("*")
          .eq("razorpay_order_id", razorpay_order_id)
          .single();

    if (!dbOrder) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (dbOrder.consumer_id !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { data: consumer } = await supabase
      .from("consumer")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (!consumer)
      return NextResponse.json(
        { message: "Consumer not found" },
        { status: 404 },
      );
    if (consumer.isBlocked)
      return NextResponse.json(
        {
          message:
            "Your account is blocked by admin due to your activities. You cannot pay for bookings.",
        },
        { status: 403 },
      );

    if (expectedSign === razorpay_signature) {
      try {
        const { data: updatedOrder } = await supabase
          .from("order")
          .update({
            status: "paid",
            razorpay_payment_id: razorpay_payment_id,
            razorpay_signature: razorpay_signature,
            payment_verified: true,
          })
          .eq("id", dbOrder.id)
          .select()
          .single();

        const { data: mess } = await supabase
          .from("mess")
          .select("id,name, owner:owner_id(*)")
          .eq("id", dbOrder.mess_id)
          .single();

        try {
          await notifyNewOrder(
            dbOrder.id,
            dbOrder.consumer_id,
            dbOrder.mess_id,
            mess?.name || "the mess",
          );
          if (mess?.owner) {
            await notifyOwnerNewOrder(
              dbOrder.id,
              mess.owner.id,
              dbOrder.mess_id,
              consumer?.username || "A customer",
            );
          }
        } catch (notifErr) {
          console.error("Notification failed:", notifErr);
        }

        return NextResponse.json(
          { message: "Payment verified", order: dbOrder },
          { status: 200 },
        );
      } catch (e) {
        console.error("Payment verification failed", e);
        // attempt to mark order failed
        try {
          await supabase
            .from("order")
            .update({ status: "failed" })
            .eq("id", dbOrder.id);
        } catch (_) {}
        return NextResponse.json({ message: "Server error" }, { status: 500 });
      }
    } else {
      await supabase.from("order").update({ status: "failed" }).eq("id", dbOrder.id);
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Booking PATCH error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
