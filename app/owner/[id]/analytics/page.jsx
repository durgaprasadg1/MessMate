"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DailyMealsTrendChart,
  PeakTimeSlotsChart,
  PlatePerformanceChart,
  WastageChart,
} from "./Charts";
import {
  TrendingUp,
  DollarSign,
  Star,
  XCircle,
  Utensils,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Loading from "../../../../Component/Others/Loading";
import OwnerNavbar from "../../../../Component/Owner/OwnerNavbar";
import EmptynessShowBox from "../../../../Component/Others/EmptynessShowBox"; // ✅ added
import { toast } from "react-toastify";

export default function AnalyticsPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated" || !session?.user?.isOwner) {
      setError("Unauthorized");
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const api = `/api/owner/${id}/analytics`;
        const res = await fetch(api, { cache: "no-store" });

        const data = await res.json();

        if (!res.ok) {
          const msg = data?.error || data?.message || "Failed to fetch analytics";
          toast.error(msg);
          setError(msg);
          setAnalytics(null);
          return;
        }

        setAnalytics(data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError(err.message || "Failed to fetch analytics");
        toast.error("Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnalytics();
    }
  }, [id, session, status]);

  if (status === "loading" || loading) {
    return <Loading />;
  }

  if (status !== "authenticated" || !session?.user?.isOwner) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <EmptynessShowBox
          message="Unauthorized access"
          link="/"
          linkmsg="Go Home"
        />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-red-400 text-xl">
          Cannot see analytics now
        </div>
      </div>
    );
  }

  const {
    summaryCards,
    dailyMealsTrend,
    peakTimeSlots,
    negativeReviews,
    platePerformance,
    wastageData,
  } = analytics || {};

  return (
    <div className="min-h-screen bg-gray-800 p-6">
      <OwnerNavbar />
      <div className="max-w-7xl mx-auto ">
        {/* Header cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
          <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Utensils className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Meals Served</p>
            <p className="text-3xl font-bold text-white">
              {summaryCards?.totalMeals?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-white">
              ₹{summaryCards?.totalRevenue?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-white">
              {summaryCards?.avgRating || 0} ⭐
            </p>
            <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Cancellations</p>
            <p className="text-3xl font-bold text-white">
              {summaryCards?.cancellations || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Churn: {summaryCards?.churnRate || 0}%
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Meals Trend */}
          <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Daily Meals Trend
              </h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Last 30 days</p>
            {dailyMealsTrend && dailyMealsTrend.length > 0 ? (
              <DailyMealsTrendChart data={dailyMealsTrend} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Peak Time Slots */}
          <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">
                Peak Time Slots
              </h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Order distribution</p>
            {peakTimeSlots && peakTimeSlots.length > 0 ? (
              <PeakTimeSlotsChart data={peakTimeSlots} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Plate Performance */}
          <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center gap-2 mb-4">
              <Utensils className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-semibold text-white">
                Top Performing Dishes
              </h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Most ordered items</p>
            {platePerformance && platePerformance.length > 0 ? (
              <PlatePerformanceChart data={platePerformance} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Food Wastage */}
          <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold text-white">
                Food Wastage Trend
              </h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Daily wastage %</p>
            {wastageData && wastageData.length > 0 ? (
              <WastageChart data={wastageData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No wastage data recorded
              </div>
            )}
          </div>
        </div>

        {/* Negative Reviews Table */}
        <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">
              Recent Negative Reviews
            </h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Reviews with rating ≤ 3</p>
          {negativeReviews && negativeReviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Rating
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Feedback
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {negativeReviews.map((review) => (
                    <tr
                      key={review.id}
                      className="border-b border-gray-600 hover:bg-gray-600/50"
                    >
                      <td className="py-3 px-4 text-gray-300">
                        {review.username}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-yellow-400">
                          {review.rating} ⭐
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 max-w-md truncate">
                        {review.feedback}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {review.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No negative reviews found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
