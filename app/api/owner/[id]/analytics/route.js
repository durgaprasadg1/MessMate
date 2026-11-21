import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { getJsonCache, setJsonCache } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import supabase from "@/lib/supabaseClient";
import { orderRepository } from "@/lib/server/repositories/orders";
import { requireMessOwner } from "@/lib/server/auth/guards";

const TTL_SECONDS = 60 * 3;
const dayKey = (d) => d.toISOString().split("T")[0];
const lastNDays = (n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return dayKey(d);
  });

// NOTE: `[id]` is the MESS id here (that is how the dashboard links to it).
export const GET = createRoute({ name: "owner.analytics", auth: "owner", uuid: ["id"] }, async ({ params, session }) => {
  const mess = await requireMessOwner(session, params.id);
  const key = cacheKeys.messAnalytics(mess.id);
  const cached = await getJsonCache(key);
  if (cached !== null) return json(cached);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);
  const last30Iso = last30.toISOString();

  const monthlyOrders = await orderRepository.paidSince(mess.id, startOfMonth, "no_of_plate, total_price");
  const totalMeals = monthlyOrders.reduce((s, o) => s + (o.no_of_plate || 1), 0);
  const totalRevenueRaw = monthlyOrders.reduce((s, o) => s + (o.total_price || 0), 0);

  const { data: recentReviews = [] } = await supabase.from("review").select("rating").eq("mess_id", mess.id).gte("created_at", last30Iso);
  const avgRating = recentReviews.length
    ? parseFloat((recentReviews.reduce((s, r) => s + (r.rating || 0), 0) / recentReviews.length).toFixed(1))
    : 0;

  const cancelledOrders = await orderRepository.countSince(mess.id, startOfMonth, { cancelledOnly: true });
  const totalOrdersThisMonth = await orderRepository.countSince(mess.id, startOfMonth);
  const churnRate = totalOrdersThisMonth > 0 ? parseFloat(((cancelledOrders / totalOrdersThisMonth) * 100).toFixed(1)) : 0;

  const dailyMap = Object.fromEntries(lastNDays(30).map((d) => [d, 0]));
  for (const o of await orderRepository.paidSince(mess.id, last30Iso, "no_of_plate, created_at")) {
    const k = dayKey(new Date(o.created_at));
    if (k in dailyMap) dailyMap[k] += o.no_of_plate || 1;
  }
  const dailyMealsTrend = Object.entries(dailyMap).map(([date, meals]) => ({ date, meals }));

  const slots = { morning: 0, lunch: 0, dinner: 0 };
  for (const o of await orderRepository.allSince(mess.id, last30Iso, "created_at")) {
    const h = new Date(o.created_at).getHours();
    if (h >= 6 && h < 11) slots.morning++;
    else if (h >= 11 && h < 16) slots.lunch++;
    else if (h >= 18 && h < 23) slots.dinner++;
  }
  const peakTimeSlots = Object.entries(slots).map(([slot, count]) => ({ slot, count })).sort((a, b) => b.count - a.count);

  const { data: negative = [] } = await supabase
    .from("review")
    .select("id, rating, feedback, created_at, author:author_id(username)")
    .eq("mess_id", mess.id)
    .lte("rating", 3)
    .order("created_at", { ascending: false })
    .limit(5);
  const negativeReviews = negative.map((r) => ({
    id: String(r.id),
    rating: r.rating,
    feedback: r.feedback || "No feedback",
    date: new Date(r.created_at).toLocaleDateString(),
    username: r.author?.username ? `${r.author.username[0]}***${r.author.username.slice(-1)}` : "Anonymous",
  }));

  const dishMap = {};
  for (const o of await orderRepository.paidWithDish(mess.id)) {
    const d = (dishMap[o.selected_dish_name] ??= { count: 0, revenue: 0 });
    d.count += o.no_of_plate || 1;
    d.revenue += (o.selected_dish_price || 0) * (o.no_of_plate || 1);
  }
  const platePerformance = Object.entries(dishMap)
    .map(([dish, v]) => ({ dish, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const { data: wastage = [] } = await supabase
    .from("wastage")
    .select("date, cooked_qty, served_qty")
    .eq("mess_id", mess.id)
    .gte("date", last30Iso);
  const wMap = Object.fromEntries(lastNDays(30).map((d) => [d, { cooked: 0, served: 0 }]));
  for (const w of wastage) {
    const k = dayKey(new Date(w.date));
    if (k in wMap) {
      wMap[k].cooked += w.cooked_qty || 0;
      wMap[k].served += w.served_qty || 0;
    }
  }
  const wastageData = Object.entries(wMap).map(([date, v]) => ({
    date,
    wastage: v.cooked > 0 ? parseFloat((((v.cooked - v.served) / v.cooked) * 100).toFixed(1)) : 0,
  }));

  const payload = {
    summaryCards: { totalMeals, totalRevenue: totalRevenueRaw / 100, avgRating, cancellations: cancelledOrders, churnRate },
    dailyMealsTrend,
    peakTimeSlots,
    negativeReviews,
    platePerformance,
    wastageData,
  };
  await setJsonCache(key, payload, TTL_SECONDS);
  return json(payload);
});
