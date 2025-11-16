"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
}

function drawReceiptToCanvas(order, consumerName) {
  const width = 800;
  const padding = 40;
  const lineHeight = 26;
  const canvas = document.createElement("canvas");
  const estimatedLines = 20;
  const height = padding * 2 + estimatedLines * lineHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 22px Arial";
  ctx.fillText("Order Receipt", padding, padding + 6);

  ctx.font = "14px Arial";
  ctx.fillStyle = "#374151";
  ctx.fillText(`Order ID: ${order._id}`, padding, padding + 6 + lineHeight);
  ctx.fillText(
    `Placed: ${formatDate(order.createdAt)}`,
    padding,
    padding + 6 + lineHeight * 2
  );

  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(padding, padding + lineHeight * 2 + 8, width - padding * 2, 1);

  let y = padding + lineHeight * 3 + 16;
  ctx.fillStyle = "#111827";
  ctx.font = "bold 16px Arial";
  ctx.fillText(
    order.mess?.name || order.messName || "Unknown Mess",
    padding,
    y
  );

  y += lineHeight;
  ctx.font = "14px Arial";
  ctx.fillStyle = "#374151";
  ctx.fillText(`Dish: ${order.selectedDishName || "-"}`, padding, y);
  y += lineHeight;
  ctx.fillText(`Plates: ${order.noOfPlate || 0}`, padding, y);
  y += lineHeight;
  ctx.fillText(
    `Amount: ₹${((order.totalPrice || 0) / 100).toFixed(2)}`,
    padding,
    y
  );
  y += lineHeight;
  ctx.fillText(`Status: ${order.status || "unknown"}`, padding, y);
  y += lineHeight;
  ctx.fillText(
    `Consumer: ${consumerName || order.consumer || "-"}`,
    padding,
    y
  );

  // footer
  y += lineHeight * 2;
  ctx.fillStyle = "#6b7280";
  ctx.font = "12px Arial";
  ctx.fillText("Thank you for your order.", padding, y);

  return canvas;
}

export default function ReceiptDownloader({
  order,
  filenamePrefix = "receipt",
}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const consumerName =
    session?.user?.name || session?.user?.email || order.consumer || "Consumer";

  const handleDownload = async () => {
    try {
      setLoading(true);
      if (typeof window === "undefined") return;
      const canvas = drawReceiptToCanvas(order, consumerName);
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      const ts = new Date(order.createdAt || Date.now())
        .toISOString()
        .replace(/[:.]/g, "-");
      a.download = `${filenamePrefix}_${String(order._id).slice(
        0,
        8
      )}_${ts}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to generate receipt:", err);
      alert("Failed to generate receipt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`px-2 py-1 rounded text-sm ${
        loading
          ? "bg-gray-300 text-gray-600"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {loading ? "Generating..." : "Download Receipt"}
    </button>
  );
}
