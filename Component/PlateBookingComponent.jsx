"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

export default function BookingForm({ mess }) {
  const { data: session } = useSession();

  const [menuType, setMenuType] = useState("vegMenu");
  const [selectedDish, setSelectedDish] = useState("");
  const [noOfPlate, setNoOfPlate] = useState(1);

  if (!mess?.isOpen || (!mess?.vegMenu?.length && !mess?.nonVegMenu?.length)) {
    return null;
  }

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load script"));
      document.body.appendChild(script);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/mess/${mess._id}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noOfPlate, menutype: menuType, selectedDish }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Booking failed");
        return;
      }

      await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      const { order, key, dbOrderId } = data;

      const options = {
        key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: mess.name || "Mess Booking",
        description: "Order Payment",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`/api/mess/${mess._id}/booking`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                dbOrderId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              toast.success("Payment successful. Booking confirmed.");
            } else {
              toast.error(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            console.error(err);
            toast.error("Payment verification failed");
          }
        },
        prefill: {},
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong during booking");
    }
  };

  const dishes =
    menuType === "vegMenu" ? mess.vegMenu || [] : mess.nonVegMenu || [];

  if (session?.user) {
    return (
      <div className="w-full card shadow-sm border-0 rounded mb-4 mt-4">
        <div className="card-body p-4">
          <h4 className="fw-bold mb-3 text-green-600 flex items-center gap-2">
            <i className="bi bi-calendar-check"></i> Book Your Plate
          </h4>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="form-label fw-semibold mb-1">
                Number of Plates
              </label>
              <input
                type="number"
                min="1"
                value={noOfPlate}
                onChange={(e) => setNoOfPlate(e.target.value)}
                required
                className="form-control"
                placeholder="Number of plates"
              />
            </div>

            <div>
              <label className="form-label fw-semibold mb-1">Plate Type</label>
              <select
                value={menuType}
                onChange={(e) => {
                  setMenuType(e.target.value);
                  setSelectedDish("");
                }}
                className="form-select"
                required
              >
                {mess.vegMenu?.length > 0 && (
                  <option value="vegMenu">Veg</option>
                )}
                {mess.nonVegMenu?.length > 0 && (
                  <option value="nonVegMenu">Non Veg</option>
                )}
              </select>
            </div>

            <div>
              <label className="form-label fw-semibold mb-1">Select Dish</label>
              <select
                value={selectedDish}
                onChange={(e) => setSelectedDish(e.target.value)}
                className="form-select"
                required
              >
                <option value="">-- Select Dish --</option>
                {dishes.map((d, idx) => (
                  <option key={idx} value={idx}>
                    {typeof d === "string"
                      ? d
                      : `${d.name}${d.price ? ` — ₹${d.price}` : ""}`}
                  </option>
                ))}
              </select>
            </div>

            <button className="p-3 bg-gray-700  text-white w-100 hover:bg-black rounded">
              Confirm booking
            </button>
          </form>
        </div>
      </div>
    );
  }
}
