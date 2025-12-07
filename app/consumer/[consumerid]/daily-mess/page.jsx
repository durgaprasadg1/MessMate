"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/Component/Others/Loading";
import Navbar from "@/Component/Others/Navbar";
import InfoRow from "@/Component/Others/InfoRow";

export default function ConsumerMonthlyMess() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { consumerid: userId } = useParams();

  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  const getMonthlyMessData = async () => {
    try {
      const res = await fetch(`/api/consumer/${userId}/monthly-mess`);
      const data = await res.json();

      if (res.ok) {
        setCustomerData(data.monthlyMess[1] || null);
        
      } else {
        console.log("API Error:", data.message);
      }
    } catch (err) {
      console.log("Error fetching monthly mess:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) getMonthlyMessData();
  }, [userId]);

  if (loading)
    return (
      <div className="flex justify-center mt-20">
        <Loading />
      </div>
    );

  if (!customerData)
    return (
      <>
        <Navbar />
        <div className="text-center mt-20 text-gray-700 text-lg">
          You are not registered for any Monthly Mess.
        </div>
      </>
    );

  const joiningDate = new Date(customerData.joiningDate);
  const expiryDate = new Date(joiningDate);
  expiryDate.setDate(joiningDate.getDate() + (customerData.messDuration || 30));

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto mt-25 mb-12 bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <div className="mt-1 p-4">
          <h2 className="text-3xl font-semibold">Monthly Mess Subscription</h2>
        </div>

        <div className="p-2 px-3 space-y-6">
          <div className="p-4 border rounded-lg bg-amber-50/60">
            <p className="text-amber-900 font-medium text-center">
              Status:{" "}
              <span
                className={
                  customerData.isAllowed
                    ? "text-green-700 font-semibold"
                    : "text-yellow-600 font-semibold"
                }
              >
                {customerData.isAllowed ? "Approved ✓" : "Pending Approval"}
              </span>
            </p>

            <p className="text-center text-gray-600 text-sm mt-1">
              {customerData.isAllowed
                ? "You can now avail all Monthly Mess services."
                : "Your request is under review by the mess owner."}
            </p>
          </div>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Personal Information
            </h3>

            <div className="mt-3 space-y-3">
              <InfoRow label="Full Name" value={customerData.name} />
              <InfoRow label="Phone Number" value={customerData.phone} />
              <InfoRow
                label="Emergency Contact"
                value={customerData.emergencyContact || "Not Provided"}
              />
              <InfoRow label="Gender" value={customerData.gender} />
              <InfoRow
                label="College / Workplace"
                value={customerData.college || "Not Provided"}
              />
              <InfoRow label="Address" value={customerData.address} />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              About Mess
            </h3>

            <div className="mt-3 space-y-3">
              <InfoRow label="Mess Name" value={customerData.mess.name} />
              <div className="flex justify-between items-center py-2 border-b">
                <h6 className="font-medium text-gray-700">Location:</h6>

                <button
                  className="text-gray-900 hover:underline"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${customerData.mess.lat},${customerData.mess.lon}`,
                      "_blank"
                    )
                  }
                >
                  Get on Map
                </button>
              </div>

              <InfoRow
                label="Food Preference"
                value={
                  customerData.foodPreference
                    ? "Both"
                      ? "Veg + Non-Veg"
                      : customerData.foodPreference === "veg"
                      ? "Vegetarian"
                      : "Non-Vegetarian"
                    : "Not Specified"
                }
              />
              <InfoRow
                label="Payment Mode"
                value={
                  customerData.paymentMode === "upi"
                    ? "Online Transfer"
                    : "Cash"
                }
              />
              <InfoRow label="Meal Duration" value={customerData.duration} />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Subscription Details
            </h3>

            <div className="mt-3 space-y-3">
              <InfoRow
                label="Joining Date"
                value={joiningDate.toLocaleDateString("en-GB")}
              />

              <InfoRow
                label="Expiry Date"
                value={expiryDate.toLocaleDateString("en-GB")}
              />
            </div>
          </section>

          {customerData.paymentMode === "upi" &&
            customerData.paymentVerified && (
              <section>
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Payment Invoice
                </h3>

                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-green-700 font-semibold text-lg">
                      ✓ Payment Verified
                    </span>
                    <span className="text-green-600 font-bold text-xl">
                      ₹{customerData.totalAmount}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <InfoRow
                      label="Transaction ID"
                      value={
                        <span className="font-mono text-xs break-all">
                          {customerData.razorpayPaymentId}
                        </span>
                      }
                    />
                    <InfoRow
                      label="Order ID"
                      value={
                        <span className="font-mono text-xs break-all">
                          {customerData.razorpayOrderId}
                        </span>
                      }
                    />
                    <InfoRow
                      label="Payment Date"
                      value={new Date(
                        customerData.createdAt || customerData.joiningDate
                      ).toLocaleDateString("en-GB")}
                    />
                    <InfoRow
                      label="Duration Paid For"
                      value={customerData.duration}
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t border-green-300">
                    <p className="text-xs text-gray-600 text-center">
                      This invoice can be shown to the mess owner for
                      transparent transaction verification.
                    </p>
                  </div>
                </div>
              </section>
            )}
        </div>
      </div>
    </>
  );
}
