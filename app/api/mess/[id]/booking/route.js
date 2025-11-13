import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from "crypto";

async function computePricePerPlate(mess, menutype, selectedDish) {
  const { default: Menu } = await import("../../../../../models/menu");
  let menuArray = mess[menutype] || [];
  try {
    if (menutype === "vegMenu" && mess.vegMenuRef) {
      const menuDoc = await Menu.findById(mess.vegMenuRef);
      if (menuDoc && Array.isArray(menuDoc.dishes) && menuDoc.dishes.length) {
        menuArray = menuDoc.dishes;
      }
    } else if (menutype === "nonVegMenu" && mess.nonVegMenuRef) {
      const menuDoc = await Menu.findById(mess.nonVegMenuRef);
      if (menuDoc && Array.isArray(menuDoc.dishes) && menuDoc.dishes.length) {
        menuArray = menuDoc.dishes;
      }
    }
  } catch (e) {
    // ignore and fallback to inline arrays on mess
    console.error("Menu doc lookup failed, falling back to mess arrays", e);
  }

  // Return both price and a human friendly dish name when possible
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
      // If the dish itself has a price, use it
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
          0
        );
      }

      // Determine a suitable dish name
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

  // Final fallback for dishName: if we still don't have a name but selectedDish was provided,
  // use the selected index as a string so it's not an ambiguous empty value.
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
    const { id } = await params;
    const body = await request.json();
    await connectDB();
    const { default: Mess } = await import("../../../../../models/mess");
    const { default: Order } = await import("../../../../../models/order");

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const mess = await Mess.findById(id);
    if (!mess)
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });

    const noOfPlate = Number(body.noOfPlate || 1);
    const menutype = body.menutype || "vegMenu";
    const selectedDish = body.selectedDish;

    const dishInfo = await computePricePerPlate(mess, menutype, selectedDish);
    const pricePerPlate = dishInfo.pricePerPlate;
    const dishName = dishInfo.dishName;

    if (!pricePerPlate || pricePerPlate <= 0) {
      return NextResponse.json(
        { message: "Cannot determine price for selected dish" },
        { status: 400 }
      );
    }

    const amount = Math.round(pricePerPlate * 100 * (noOfPlate || 1));

    // create razorpay order
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

    // create DB order record
    const dbOrder = new Order({
      mess: id,
      consumer: session.user.id,
      totalPrice: amount,
      razorpayOrderId: rOrder.id,
      status: "created",
      noOfPlate: noOfPlate,
      selectedDishName:
        dishName ||
        (typeof selectedDish === "string"
          ? selectedDish
          : String(selectedDish)),
      selectedDishPrice: pricePerPlate,
      messName: mess && mess.name ? String(mess.name) : undefined,
    });
    await dbOrder.save();

    return NextResponse.json(
      {
        message: "Order created",
        order: rOrder,
        dbOrderId: dbOrder._id,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Booking POST error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrderId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { message: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const { default: Order } = await import("../../../../../models/order");
    const { default: Mess } = await import("../../../../../models/mess");
    const { default: Consumer } = await import(
      "../../../../../models/consumer"
    );

    const secret =
      process.env.RAZORPAY_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_KEYSECRET;

    const expectedSign = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const dbOrder = dbOrderId
      ? await Order.findById(dbOrderId)
      : await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!dbOrder) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Log verification details for debugging
    console.log("Razorpay verify:");
    console.log("  providedSignature =", razorpay_signature);
    console.log("  expectedSignature =", expectedSign);
    console.log("  order_id =", razorpay_order_id);
    console.log("  payment_id =", razorpay_payment_id);

    // --- Verification check ---
    if (expectedSign === razorpay_signature) {
      // ✅ Mark order as paid and update references (no transactions)
      dbOrder.status = "paid";
      dbOrder.razorpayPaymentId = razorpay_payment_id;
      dbOrder.razorpaySignature = razorpay_signature;
      dbOrder.paymentVerified = true;
      await dbOrder.save();

      await Consumer.findByIdAndUpdate(dbOrder.consumer, {
        $push: { orders: dbOrder._id },
      });
      await Mess.findByIdAndUpdate(dbOrder.mess, {
        $push: { orders: dbOrder._id },
      });

      return NextResponse.json(
        { message: "Payment verified", order: dbOrder },
        { status: 200 }
      );
    } else {
      // ❌ Signature mismatch
      dbOrder.status = "failed";
      await dbOrder.save();
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Booking PATCH error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
