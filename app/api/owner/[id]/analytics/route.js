import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "@/lib/redis";

const TTL_SECONDS = 60 *3;

export async function GET(request, { params }) {
  try {
    const { id: messId } = (await params) || {};
    if (!messId) {
      return NextResponse.json({ message: "Invalid mess id" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isOwner) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tenantId = request.headers.get("x-tenant-id") || "public";
    const cacheKey = `tenant:${tenantId}:mess:${messId}:analytics`;
    const cached = await getJsonCache(cacheKey);
    if (cached !== null) {
      return NextResponse.json(cached, { status: 200 });
    }

    const { data: messExists } = await supabase
      .from("mess")
      .select("id")
      .eq("id", messId)
      .single();
    if (!messExists) {
      return NextResponse.json({ message: "Mess not found" }, { status: 404 });
    }

    const messIds = [messId];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const { data: monthlyOrders = [] } = await supabase
      .from("order")
      .select("no_of_plate, total_price")
      .eq("status", "paid")
      .gte("created_at", startOfMonth.toISOString())
      .eq("mess_id", messId);

    const totalMeals = monthlyOrders.reduce(
      (sum, o) => sum + (o.noOfPlate || 1),
      0,
    );
    const totalRevenueRaw = monthlyOrders.reduce(
      (sum, o) => sum + (o.totalPrice || 0),
      0,
    );

    const { data: recentReviews = [] } = await supabase
      .from("review")
      .select("rating")
      .eq("mess_id", messId)
      .gte("created_at", last30Days.toISOString());

    const avgRating =
      recentReviews.length > 0
        ? parseFloat(
            (
              recentReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
              recentReviews.length
            ).toFixed(1),
          )
        : 0;

    const { count: cancelledOrders = 0 } = await supabase
      .from("order")
      .select("id", { count: "exact", head: true })
      .eq("mess_id", messId)
      .eq("is_cancelled", true)
      .gte("created_at", startOfMonth.toISOString());

    const { count: totalOrdersThisMonth = 0 } = await supabase
      .from("order")
      .select("id", { count: "exact", head: true })
      .eq("mess_id", messId)
      .gte("created_at", startOfMonth.toISOString());

    const churnRate =
      totalOrdersThisMonth > 0
        ? parseFloat(
            ((cancelledOrders / totalOrdersThisMonth) * 100).toFixed(1),
          )
        : 0;

    const { data: last30DaysOrders = [] } = await supabase
      .from("order")
      .select("no_of_plate, created_at")
      .eq("mess_id", messId)
      .eq("status", "paid")
      .gte("created_at", last30Days.toISOString());

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
      }),
    );

    const { data: allOrders = [] } = await supabase
      .from("order")
      .select("created_at")
      .eq("mess_id", messId)
      .gte("created_at", last30Days.toISOString());

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

    const { data: negativeReviews = [] } = await supabase
      .from("review")
      .select("id, rating, feedback, created_at, author:author_id(username)")
      .eq("mess_id", messId)
      .lte("rating", 3)
      .order("created_at", { ascending: false })
      .limit(5);

    const negativeReviewsData = negativeReviews.map((r) => ({
      id: String(r._id),
      rating: r.rating,
      feedback: r.feedback || "No feedback",
      date: new Date(r.createdAt).toLocaleDateString(),
      username: r.author?.username
        ? r.author.username[0] + "***" + r.author.username.slice(-1)
        : "Anonymous",
    }));

    const { data: ordersWithDish = [] } = await supabase
      .from("order")
      .select("selected_dish_name, selected_dish_price, no_of_plate")
      .eq("mess_id", messId)
      .eq("status", "paid")
      .not("selected_dish_name", "is", null);

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

    const { data: wastageRecords = [] } = await supabase
      .from("wastage")
      .select("date, cooked_qty, served_qty, plate_name")
      .eq("mess_id", messId)
      .gte("date", last30Days.toISOString());

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

    const payload = {
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
    };

    await setJsonCache(cacheKey, payload, TTL_SECONDS);

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
