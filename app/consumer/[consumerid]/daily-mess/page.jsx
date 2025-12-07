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
      console.log("Monthly Mess Data:", data);

      if (res.ok) {
        // Check if monthlyMess exists and has data
        if (data.monthlyMess && data.monthlyMess.length > 0) {
          const messData = data.monthlyMess[0]; // Use first item (index 0)
          console.log("Setting customer data:", messData);
          setCustomerData(messData);
        } else {
          console.log("No monthly mess data found");
          setCustomerData(null);
        }
      } else {
        console.log("API Error:", data.message);
        setCustomerData(null);
      }
    } catch (err) {
      console.log("Error fetching monthly mess:", err);
      setCustomerData(null);
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
      <div className="flex justify-center mt-20">
        <Navbar />
        <div className="text-center mt-20 text-gray-700 text-lg">
          You are not registered for any Monthly mess?.
        </div>
      </div>
    );

  const joiningDate = new Date(customerData?.joiningDate);
  const expiryDate = new Date(joiningDate);
  expiryDate.setDate(
    joiningDate.getDate() + (customerData?.messDuration || 30)
  );

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-20 sm:py-24">
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-semibold">
              Monthly Mess Subscription
            </h2>
          </div>

          <div className="p-2 px-3 space-y-6">
            <div className="p-4 border rounded-lg bg-amber-50/60">
              <p className="text-amber-900 font-medium text-center">
                Status:{" "}
                <span
                  className={
                    customerData?.isAllowed
                      ? "text-green-700 font-semibold"
                      : "text-yellow-600 font-semibold"
                  }
                >
                  {customerData?.isAllowed ? "Approved ✓" : "Pending Approval"}
                </span>
              </p>

              <p className="text-center text-gray-600 text-sm mt-1">
                {customerData?.isAllowed
                  ? "You can now avail all Monthly Mess services."
                  : "Your request is under review by the mess owner."}
              </p>
            </div>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Personal Information
              </h3>

              <div className="mt-3 space-y-3">
                <InfoRow label="Full Name" value={customerData?.name} />
                <InfoRow label="Phone Number" value={customerData?.phone} />
                <InfoRow
                  label="Emergency Contact"
                  value={customerData?.emergencyContact || "Not Provided"}
                />
                <InfoRow label="Gender" value={customerData?.gender} />
                <InfoRow
                  label="College / Workplace"
                  value={customerData?.college || "Not Provided"}
                />
                <InfoRow label="Address" value={customerData?.address} />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                About Mess
              </h3>

              <div className="mt-3 space-y-3">
                <InfoRow label="Mess Name" value={customerData?.mess?.name} />
                <div className="flex justify-between items-center py-2 border-b">
                  <h6 className="font-medium text-gray-700">Location:</h6>

                  <button
                    className="text-gray-900 hover:underline"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps?q=${customerData?.mess?.lat},${customerData?.mess?.lon}`,
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
                    customerData?.foodPreference === "both"
                      ? "Veg + Non-Veg"
                      : customerData?.foodPreference === "veg"
                      ? "Vegetarian"
                      : customerData?.foodPreference === "nonveg"
                      ? "Non-Vegetarian"
                      : "Not Specified"
                  }
                />
                <InfoRow
                  label="Payment Mode"
                  value={
                    customerData?.paymentMode === "upi"
                      ? "Online Transfer"
                      : "Cash"
                  }
                />
                <InfoRow label="Meal Duration" value={customerData?.duration} />
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

            {/* Today's Menu Section */}
            {customerData?.mess && customerData?.isAllowed && (
              <section>
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  🍽️ Today's Menu
                </h3>

                <div className="mt-3 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      ⏰ Meal Time:{" "}
                      <span className="font-bold">
                        {customerData.mess.mealTime || "Not specified"}
                      </span>
                    </p>
                    <p className="text-xs text-blue-700">
                      Your subscription: {customerData.duration}
                    </p>
                  </div>

                  {/* Veg Menu */}
                  {customerData.mess.vegMenu &&
                    customerData.mess.vegMenu.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-green-800 mb-3 flex items-center gap-2">
                          🥗 Vegetarian Menu
                        </h4>
                        <div className="space-y-3">
                          {customerData.mess.vegMenu.map((dish, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-md p-3 shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold text-gray-900">
                                  {dish.name}
                                </h5>
                                {dish.price && (
                                  <span className="text-green-600 font-bold">
                                    ₹{dish.price}
                                  </span>
                                )}
                              </div>
                              {dish.items && dish.items.length > 0 && (
                                <ul className="space-y-1">
                                  {dish.items.map((item, itemIdx) => (
                                    <li
                                      key={itemIdx}
                                      className="flex justify-between items-center text-sm text-gray-700"
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        {item.name}
                                        {item.isLimited && (
                                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                            Limited ({item.limitCount})
                                          </span>
                                        )}
                                      </span>
                                      {item.price && (
                                        <span className="text-gray-600">
                                          ₹{item.price}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Non-Veg Menu */}
                  {customerData.mess.nonVegMenu &&
                    customerData.mess.nonVegMenu.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-red-800 mb-3 flex items-center gap-2">
                          🍗 Non-Vegetarian Menu
                        </h4>
                        <div className="space-y-3">
                          {customerData.mess.nonVegMenu.map((dish, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-md p-3 shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold text-gray-900">
                                  {dish.name}
                                </h5>
                                {dish.price && (
                                  <span className="text-red-600 font-bold">
                                    ₹{dish.price}
                                  </span>
                                )}
                              </div>
                              {dish.items && dish.items.length > 0 && (
                                <ul className="space-y-1">
                                  {dish.items.map((item, itemIdx) => (
                                    <li
                                      key={itemIdx}
                                      className="flex justify-between items-center text-sm text-gray-700"
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                        {item.name}
                                        {item.isLimited && (
                                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                            Limited ({item.limitCount})
                                          </span>
                                        )}
                                      </span>
                                      {item.price && (
                                        <span className="text-gray-600">
                                          ₹{item.price}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {(!customerData.mess.vegMenu ||
                    customerData.mess.vegMenu.length === 0) &&
                    (!customerData.mess.nonVegMenu ||
                      customerData.mess.nonVegMenu.length === 0) && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-600">
                          📋 Menu not available yet
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          The mess owner hasn't uploaded today's menu.
                        </p>
                      </div>
                    )}
                </div>
              </section>
            )}

            {!customerData?.isAllowed && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 text-center">
                  ℹ️ Menu will be visible once your registration is approved by
                  the mess owner.
                </p>
              </div>
            )}

            {customerData?.paymentMode === "upi" &&
              customerData?.paymentVerified && (
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
                        ₹{customerData?.totalAmount}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <InfoRow
                        label="Transaction ID"
                        value={
                          <span className="font-mono text-xs break-all">
                            {customerData?.razorpayPaymentId}
                          </span>
                        }
                      />
                      <InfoRow
                        label="Order ID"
                        value={
                          <span className="font-mono text-xs break-all">
                            {customerData?.razorpayOrderId}
                          </span>
                        }
                      />
                      <InfoRow
                        label="Payment Date"
                        value={new Date(
                          customerData?.createdAt || customerData?.joiningDate
                        ).toLocaleDateString("en-GB")}
                      />
                      <InfoRow
                        label="Duration Paid For"
                        value={customerData?.duration}
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
      </div>
    </>
  );
}
