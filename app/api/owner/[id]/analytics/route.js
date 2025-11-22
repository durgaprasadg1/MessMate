import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../../../lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const { id: messId } = await params || {};

    if (!messId || !mongoose.Types.ObjectId.isValid(messId)) {
      return NextResponse.json(
        { message: "Invalid mess id" },
        { status: 400 }
      );
    }

    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isOwner) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const { default: Mess } = await import("../../../../../models/mess");
    
    const { default: Order } = await import("../../../../../models/order");
    
    const { default: Review } = await import("../../../../../models/reviews");
    
    const { default: Consumer } = await import("../../../../../models/consumer");
    
    const { default: Wastage } = await import("../../../../../models/wastage");
    
    const messExists = await Mess.exists({ _id: messId });
    if (!messExists) {
      return NextResponse.json(
        { message: "Mess not found" },
        { status: 404 }
      );
    }

    const messIds = [messId];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const monthlyOrders = await Order.find({
      mess: { $in: messIds },
      status: "paid",
      createdAt: { $gte: startOfMonth },
    })
      .select("noOfPlate totalPrice")
      .lean();

    const totalMeals = monthlyOrders.reduce(
      (sum, o) => sum + (o.noOfPlate || 1),
      0
    );
    const totalRevenueRaw = monthlyOrders.reduce(
      (sum, o) => sum + (o.totalPrice || 0),
      0
    );

    const recentReviews = await Review.find({
      mess: { $in: messIds },
      createdAt: { $gte: last30Days },
    })
      .select("rating")
      .lean();

    const avgRating =
      recentReviews.length > 0
        ? parseFloat(
            (
              recentReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
              recentReviews.length
            ).toFixed(1)
          )
        : 0;

    const cancelledOrders = await Order.countDocuments({
      mess: { $in: messIds },
      isCancelled: true,
      createdAt: { $gte: startOfMonth },
    });

    const totalOrdersThisMonth = await Order.countDocuments({
      mess: { $in: messIds },
      createdAt: { $gte: startOfMonth },
    });

    const churnRate =
      totalOrdersThisMonth > 0
        ? parseFloat(
            ((cancelledOrders / totalOrdersThisMonth) * 100).toFixed(1)
          )
        : 0;

    const last30DaysOrders = await Order.find({
      mess: { $in: messIds },
      status: "paid",
      createdAt: { $gte: last30Days },
    })
      .select("noOfPlate createdAt")
      .lean();

    const dailyMealsMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().split("T")[0];
      dailyMealsMap[key] = 0;
    }

    last30DaysOrders.forEach((order) => {
      const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
      if (Object.prototype.hasOwnProperty.call(dailyMealsMap, dateKey)) {
        dailyMealsMap[dateKey] += order.noOfPlate || 1;
      }
    });

    const dailyMealsTrend = Object.entries(dailyMealsMap).map(
      ([date, meals]) => ({
        date,
        meals,
      })
    );

    const allOrders = await Order.find({
      mess: { $in: messIds },
      createdAt: { $gte: last30Days },
    })
      .select("createdAt")
      .lean();

    const timeSlots = { morning: 0, lunch: 0, dinner: 0 };
    allOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      if (hour >= 6 && hour < 11) timeSlots.morning++;
      else if (hour >= 11 && hour < 16) timeSlots.lunch++;
      else if (hour >= 18 && hour < 23) timeSlots.dinner++;
    });

    const peakTimeSlots = Object.entries(timeSlots)
      .map(([slot, count]) => ({ slot, count }))
      .sort((a, b) => b.count - a.count);

    const negativeReviews = await Review.find({
      mess: { $in: messIds },
      rating: { $lte: 3 },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("author", "username")
      .lean();

    const negativeReviewsData = negativeReviews.map((r) => ({
      id: String(r._id),
      rating: r.rating,
      feedback: r.feedback || "No feedback",
      date: new Date(r.createdAt).toLocaleDateString(),
      username: r.author?.username
        ? r.author.username[0] + "***" + r.author.username.slice(-1)
        : "Anonymous",
    }));

    const ordersWithDish = await Order.find({
      mess: { $in: messIds },
      status: "paid",
      selectedDishName: { $exists: true, $ne: null },
    })
      .select("selectedDishName selectedDishPrice noOfPlate")
      .lean();

    const dishMap = {};
    ordersWithDish.forEach((order) => {
      const dish = order.selectedDishName;
      if (!dishMap[dish]) {
        dishMap[dish] = { count: 0, revenue: 0 };
      }
      dishMap[dish].count += order.noOfPlate || 1;
      dishMap[dish].revenue +=
        (order.selectedDishPrice || 0) * (order.noOfPlate || 1);
    });

    const platePerformance = Object.entries(dishMap)
      .map(([dish, data]) => ({
        dish,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const wastageRecords = await Wastage.find({
      mess: { $in: messIds },
      date: { $gte: last30Days },
    })
      .select("date cookedQty servedQty plateName")
      .lean();

    const wastageMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().split("T")[0];
      wastageMap[key] = { cooked: 0, served: 0 };
    }

    wastageRecords.forEach((w) => {
      const dateKey = new Date(w.date).toISOString().split("T")[0];
      if (Object.prototype.hasOwnProperty.call(wastageMap, dateKey)) {
        wastageMap[dateKey].cooked += w.cookedQty || 0;
        wastageMap[dateKey].served += w.servedQty || 0;
      }
    });

    const wastageData = Object.entries(wastageMap).map(([date, data]) => {
      const wastagePercent =
        data.cooked > 0
          ? (((data.cooked - data.served) / data.cooked) * 100).toFixed(1)
          : 0;
      return { date, wastage: parseFloat(wastagePercent) };
    });
 
    return NextResponse.json(
      {
        summaryCards: {
          totalMeals,
          totalRevenue: totalRevenueRaw / 100,
          avgRating,
          cancellations: cancelledOrders,
          churnRate,
        },
        dailyMealsTrend,
        peakTimeSlots,
        negativeReviews: negativeReviewsData,
        platePerformance,
        wastageData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
