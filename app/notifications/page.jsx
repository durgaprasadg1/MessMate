"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/contexts/NotificationContext";
import Navbar from "@/Component/Others/Navbar";
import Loading from "@/Component/Others/Loading";
import Link from "next/link";
import OwnerNavbar from "../../Component/Owner/OwnerNavbar";
import { toast } from "react-toastify";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.isOwner;
  const id = session?.user?.id;
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [messData, setMessData] = useState(null);

useEffect(() => {
  if (!session) {
    router.push("/login");
    return;
  }

  const fetchAnalytics = async () => {
    try {
      const api = `/api/owner/${id}`;
      const res = await fetch(api, { cache: "no-store" });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || data?.message || "Failed to fetch analytics");
        return;
      }

      setMessData(data.owner.messes[0]);
      console.log("Fetched Data:", data);

    } catch (err) {
      console.error("Analytics fetch error:", err);
      toast.error("Failed to fetch Mess");
    }
  };

  if (id && isOwner) fetchAnalytics();

}, [id, session]);  // <-- cleaned deps

  if (!session) {
    return <Loading />;
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_order":
        return "🛒";
      case "order_cancelled":
        return "❌";
      case "order_completed":
        return "✅";
      case "order_taken":
        return "👨‍🍳";
      case "order_refunded":
        return "💰";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "new_order":
        return "border-l-4 border-blue-500 bg-blue-50";
      case "order_cancelled":
        return "border-l-4 border-red-500 bg-red-50";
      case "order_completed":
        return "border-l-4 border-green-500 bg-green-50";
      case "order_taken":
        return "border-l-4 border-yellow-500 bg-yellow-50";
      case "order_refunded":
        return "border-l-4 border-purple-500 bg-purple-50";
      default:
        return "border-l-4 border-gray-500 bg-gray-50";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {isOwner ? <OwnerNavbar /> : <Navbar />}
      <div
        className={`${
          isOwner ? "bg-gray-950" : "bg-white"
        } min-h-screen pt-20 pb-10`}
      >
        {" "}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Notifications
                </h1>
                <p className="text-gray-600 mt-1">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${
                        unreadCount > 1 ? "s" : ""
                      }`
                    : "You're all caught up!"}
                </p>
              </div>

              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-medium"
                  >
                    Mark All Read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6 border-b border-gray-200">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 font-medium transition ${
                  filter === "all"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 font-medium transition ${
                  filter === "unread"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter("read")}
                className={`px-4 py-2 font-medium transition ${
                  filter === "read"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-600">
                {filter === "all"
                  ? "You don't have any notifications yet"
                  : filter === "unread"
                  ? "You don't have any unread notifications"
                  : "You don't have any read notifications"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() =>
                    !notification.isRead && markAsRead(notification._id)
                  }
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer ${getNotificationColor(
                    notification.type
                  )} ${!notification.isRead ? "ring-2 ring-indigo-200" : ""}`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3
                            className={`text-lg font-semibold text-gray-900 ${
                              !notification.isRead ? "font-bold" : ""
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="shrink-0 w-3 h-3 bg-indigo-600 rounded-full"></span>
                          )}
                        </div>

                        <p className="text-gray-700 mb-3">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>

                          {notification.orderId && (
                            <Link
                              href={!isOwner ? `/consumer/${session?.user?.id}/history`: `/mess/${messData}/orders`}
                              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Order Details →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
