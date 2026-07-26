"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function NotificationBell() {
  const { data: session } = useSession();
  const isOwner = session?.user?.isOwner;

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const updatePanelPosition = () => {
    if (!buttonRef.current || typeof window === "undefined") return;

    const rect = buttonRef.current.getBoundingClientRect();
    const gap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = Math.min(384, viewportWidth - 16);
    const panelLeft =
      viewportWidth < 640
        ? 8
        : Math.min(
            Math.max(rect.right - panelWidth, 8),
            viewportWidth - panelWidth - 8
          );

    const openAbove = rect.bottom + 320 > viewportHeight && rect.top > 320;

    setPanelPosition(
      openAbove
        ? {
            bottom: Math.max(viewportHeight - rect.top + gap, 8),
            left: panelLeft,
            width: panelWidth,
          }
        : {
            top: Math.min(rect.bottom + gap, viewportHeight - 8),
            left: panelLeft,
            width: panelWidth,
          }
    );
  };

  // Click outside handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    updatePanelPosition();

    const handleViewportChange = () => updatePanelPosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen]);

  // Notification icons
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
        return "bg-blue-50 border-blue-200";
      case "order_cancelled":
        return "bg-red-50 border-red-200";
      case "order_completed":
        return "bg-green-50 border-green-200";
      case "order_taken":
        return "bg-yellow-50 border-yellow-200";
      case "order_refunded":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition"
      >
        <svg
          className="w-6 h-6"
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

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-9999 max-h-[70vh] overflow-hidden flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg"
              style={{
                top: panelPosition?.top,
                bottom: panelPosition?.bottom,
                left: panelPosition?.left,
                width: panelPosition?.width ?? 384,
                maxWidth: "calc(100vw - 16px)",
              }}
            >
              <div className="p-4 bg-gray-700 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Notifications</h3>

                  {notifications.length > 0 && (
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs bg-gray-900 px-2 py-1 rounded"
                      >
                        Mark all read
                      </button>

                      <button
                        onClick={() => {
                          clearNotifications();
                          setIsOpen(false);
                        }}
                        className="text-xs bg-red-600 px-2 py-1 rounded"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">
                    <p className="text-sm mt-2">No notifications yet</p>
                    <p className="text-xs mt-1">
                      Updates about your orders will appear here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((n, index) => (
                      <div
                        key={n._id ?? n.id ?? `${n.type}-${n.createdAt}-${index}`}
                        onClick={() => markAsRead(n._id)}
                        className={`p-4 cursor-pointer transition ${
                          !n.isRead ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border ${getNotificationColor(
                              n.type
                            )}`}
                          >
                            {getNotificationIcon(n.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p
                                className={`text-sm font-semibold text-gray-900 ${
                                  !n.isRead ? "font-bold" : ""
                                }`}
                              >
                                {n.title}
                              </p>

                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {n.message}
                            </p>

                            <div className="flex justify-between mt-2 text-xs">
                              <span className="text-gray-500">
                                {formatTime(n.createdAt)}
                              </span>

                              {n.orderId && !isOwner && (
                                <Link
                                  href={`/consumer/${session?.user?.id}/history`}
                                  className="text-indigo-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                  }}
                                >
                                  View Order →
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t bg-gray-50 text-center">
                  <Link
                    href="/notifications"
                    className="text-sm text-indigo-600"
                    onClick={() => setIsOpen(false)}
                  >
                    View All Notifications
                  </Link>
                </div>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
