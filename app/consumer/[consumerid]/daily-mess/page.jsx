"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/Component/Others/Loading";
import Navbar from "@/Component/Others/Navbar";
import InfoRow from "@/Component/Others/InfoRow";
import MessMenuComponent from "../../../../Component/IndividualMess/MenuComponent";
export default function ConsumerMonthlyMess() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { consumerid: userId } = useParams();

  const [allSubscriptions, setAllSubscriptions] = useState([]);
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
        if (data.monthlyMess && data.monthlyMess.length > 0) {
          console.log("Setting all subscriptions:", data.monthlyMess);
          setAllSubscriptions(data.monthlyMess);
        } else {
          console.log("No monthly mess data found");
          setAllSubscriptions([]);
        }
      } else {
        console.log("API Error:", data.message);
        setAllSubscriptions([]);
      }
    } catch (err) {
      console.log("Error fetching monthly mess:", err);
      setAllSubscriptions([]);
    } finally {
      setLoading(false);
            // console.log("Consumer Data : ",customerData?.mess?.name)

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

  if (!allSubscriptions || allSubscriptions.length === 0)
    return (
      <div className="flex justify-center mt-20">
        <Navbar />
        <div className="text-center mt-20 text-gray-700 text-lg">
          You are not registered for any Monthly mess.
        </div>
      </div>
    );

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-20 sm:py-24">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          My Monthly Mess Subscriptions
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {allSubscriptions.map((customerData, index) => {
            const joiningDate = new Date(customerData?.joiningDate);
            const expiryDate = new Date(joiningDate);
            expiryDate.setDate(
              joiningDate.getDate() + (customerData?.messDuration || 30)
            );

            return (
              <div
                key={customerData._id || index}
                className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-4 sm:p-6 bg-gray-400 rounded">
                  <h2 className="text-xl sm:text-2xl font-semibold text-black">
                    {customerData?.mess?.name}
                  </h2>
                  <p className="text-black text-lg mt-1">
                    {customerData?.duration} Meal
                  </p>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
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
                        {customerData?.isAllowed
                          ? "Approved ✓"
                          : "Pending Approval"}
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
                      <InfoRow
                        label="Phone Number"
                        value={customerData?.phone}
                      />
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
                      <InfoRow
                        label="Mess Name"
                        value={customerData?.mess?.name}
                      />
                      <div className="flex justify-between items-center py-2 border-b">
                        <h6 className="font-medium text-gray-700">Location:</h6>

                        <button
                          className="text-gray-900 hover:underline text-sm"
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
                          customerData?.foodPreference?.toLowerCase() === "both"
                            ? "Veg + Non-Veg"
                            : customerData?.foodPreference?.toLowerCase() ===
                              "veg"
                            ? "Vegetarian"
                            : customerData?.foodPreference?.toLowerCase() ===
                                "nonveg" ||
                              customerData?.foodPreference?.toLowerCase() ===
                                "non-veg"
                            ? "Non-Vegetarian"
                            : customerData?.foodPreference || "Not Specified"
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
                      <InfoRow
                        label="Meal Duration"
                        value={customerData?.duration}
                      />
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

                  {customerData?.mess && customerData?.isAllowed && (
                    <section>
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        🍽️ Today's Menu
                      </h3>

                      <div className="mt-3 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center p-4">
                          
                          <p className=" text-blue-700 text-xl">
                            Your subscription: {customerData.duration}
                          </p>
                        </div>

                        {((customerData.mess.vegMenu &&
                          customerData.mess.vegMenu.length > 0) ||( customerData.mess.nonVegMenu &&
                          customerData.mess.nonVegMenu.length > 0)) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                             
                              <div className="space-y-3">
                                <MessMenuComponent mess={customerData.mess} isOwner={false} />
                                
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
                        ℹ️ Menu will be visible once your registration is
                        approved by the mess owner.
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
                                customerData?.createdAt ||
                                  customerData?.joiningDate
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
            );
          })}
        </div>
      </div>
    </>
  );
}
