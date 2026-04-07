"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/Component/Others/Loading";
import Navbar from "@/Component/Others/Navbar";
import InfoRow from "@/Component/Others/InfoRow";
import MessMenuComponent from "@/Component/IndividualMess/MenuComponent";

const getSafeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const date = getSafeDate(value);
  return date ? date.toLocaleDateString("en-GB") : "N/A";
};

const normalizeMess = (mess = {}) => ({
  ...mess,
  name: mess?.name || "Unknown Mess",
  lat: mess?.lat,
  lon: mess?.lon,
  vegMenu: mess?.vegMenu || mess?.veg_menu || [],
  nonVegMenu: mess?.nonVegMenu || mess?.non_veg_menu || [],
  monthlyMessDuration: Number(
    mess?.monthlyMessDuration ?? mess?.monthly_mess_duration ?? 30,
  ),
});

const normalizeSubscription = (entry = {}) => {
  const mess = normalizeMess(entry?.mess || {});

  return {
    id: entry?.id || entry?._id || "",
    name: entry?.name || "Not Provided",
    phone: entry?.phone || "Not Provided",
    emergencyContact:
      entry?.emergencyContact || entry?.emergency_contact || "Not Provided",
    gender: entry?.gender || "Not Provided",
    college: entry?.college || "Not Provided",
    address: entry?.address || "Not Provided",
    duration: entry?.duration || "Not Provided",
    foodPreference:
      entry?.foodPreference || entry?.food_preference || "Not Specified",
    paymentMode: (
      entry?.paymentMode ||
      entry?.payment_mode ||
      ""
    ).toLowerCase(),
    paymentVerified: Boolean(entry?.paymentVerified ?? entry?.payment_verified),
    isAllowed: Boolean(entry?.isAllowed ?? entry?.is_allowed),
    joiningDate:
      entry?.joiningDate ||
      entry?.joining_date ||
      entry?.createdAt ||
      entry?.created_at ||
      null,
    createdAt: entry?.createdAt || entry?.created_at || null,
    totalAmount: Number(entry?.totalAmount ?? entry?.total_amount ?? 0),
    razorpayPaymentId:
      entry?.razorpayPaymentId || entry?.razorpay_payment_id || "",
    razorpayOrderId: entry?.razorpayOrderId || entry?.razorpay_order_id || "",
    messDuration: Number(
      entry?.messDuration ??
        entry?.mess_duration ??
        mess?.monthlyMessDuration ??
        mess?.monthly_mess_duration ??
        30,
    ),
    mess,
  };
};

const getFoodPreferenceLabel = (foodPreference) => {
  const value = (foodPreference || "").toLowerCase();

  if (value === "both") return "Veg + Non-Veg";
  if (value === "veg") return "Vegetarian";
  if (value === "nonveg" || value === "non-veg") return "Non-Vegetarian";

  return foodPreference || "Not Specified";
};

export default function ConsumerMonthlyMess() {
  const router = useRouter();
  const { status } = useSession();
  const { consumerid: userId } = useParams();

  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const getMonthlyMessData = useCallback(async () => {
    if (!userId) {
      setAllSubscriptions([]);
      setSelectedSubscriptionId(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/consumer/${userId}/monthly-mess`);
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const normalized = Array.isArray(data.monthlyMess)
          ? data.monthlyMess.map(normalizeSubscription)
          : [];

        setAllSubscriptions(normalized);
        if (normalized.length > 0) {
          setSelectedSubscriptionId((current) =>
            current && normalized.some((sub) => sub.id === current)
              ? current
              : normalized[0].id,
          );
        } else {
          setAllSubscriptions([]);
          setSelectedSubscriptionId(null);
        }
      } else {
        setAllSubscriptions([]);
        setSelectedSubscriptionId(null);
      }
    } catch {
      setAllSubscriptions([]);
      setSelectedSubscriptionId(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    getMonthlyMessData();
  }, [getMonthlyMessData]);

  const activeSubscription = allSubscriptions.find(
    (sub) => sub.id === selectedSubscriptionId,
  );

  const activeJoiningDate = getSafeDate(activeSubscription?.joiningDate);
  const activeExpiryDate = activeJoiningDate
    ? new Date(
        activeJoiningDate.getTime() +
          Number(activeSubscription?.messDuration || 30) * 24 * 60 * 60 * 1000,
      )
    : null;

  const isEmpty =
    !loading && (!allSubscriptions || allSubscriptions.length === 0);

  return (
    <div className="role-shell bg-[#f4f6f8]">
      <Navbar />

      <main className="role-container max-w-6xl">
        <section className="rounded-[28px] border border-slate-200 bg-[#f8fafc] p-4 sm:p-6 shadow-[0_20px_42px_-22px_rgba(15,23,42,0.25)]">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 sm:gap-6">
            <aside className="rounded-[22px] border border-slate-200 bg-white p-4 min-h-[220px] lg:min-h-[640px] shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">
                Memberships
              </p>
              <h2 className="text-lg font-extrabold text-stone-900 mt-2">
                Your Plans
              </h2>

              {loading ? (
                <div className="mt-6 flex items-center justify-center">
                  <Loading />
                </div>
              ) : isEmpty ? (
                <p className="mt-4 text-sm text-stone-700 leading-relaxed">
                  No active monthly subscription found.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {allSubscriptions.map((subscription) => {
                    const selected = subscription.id === activeSubscription?.id;

                    return (
                      <button
                        key={subscription.id || subscription.mess?.name}
                        type="button"
                        onClick={() =>
                          setSelectedSubscriptionId(subscription.id)
                        }
                        className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                          selected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-stone-800 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <p className="font-semibold leading-tight">
                          {subscription.mess?.name}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            selected ? "text-slate-200" : "text-stone-600"
                          }`}
                        >
                          {subscription.duration}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            <div className="space-y-4 sm:space-y-5">
              <section className="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                {loading ? (
                  <p className="text-sm text-stone-700">
                    Loading plan details...
                  </p>
                ) : isEmpty ? (
                  <>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">
                      Overview
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
                      Daily Mess Dashboard
                    </h1>
                    <p className="text-sm text-stone-700 mt-2">
                      Register from any mess page to start tracking your daily
                      meals here.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">
                      Overview
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-2">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                          {activeSubscription?.mess?.name}
                        </h1>
                        <p className="text-sm text-stone-700 mt-1">
                          {activeSubscription?.duration} meal plan
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                          activeSubscription?.isAllowed
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {activeSubscription?.isAllowed
                          ? "Approved"
                          : "Pending Approval"}
                      </span>
                    </div>
                  </>
                )}
              </section>

              <section className="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                {loading ? (
                  <div className="py-8 flex justify-center">
                    <Loading />
                  </div>
                ) : isEmpty || !activeSubscription ? (
                  <div className="text-sm text-stone-700">
                    Once you join a monthly mess, your profile details, menu
                    access, and invoice will appear here.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <h3 className="text-base font-extrabold text-stone-900 mb-3">
                          Personal Information
                        </h3>
                        <div className="space-y-2">
                          <InfoRow
                            label="Full Name"
                            value={activeSubscription.name}
                          />
                          <InfoRow
                            label="Phone Number"
                            value={activeSubscription.phone}
                          />
                          <InfoRow
                            label="Emergency Contact"
                            value={activeSubscription.emergencyContact}
                          />
                          <InfoRow
                            label="Gender"
                            value={activeSubscription.gender}
                          />
                          <InfoRow
                            label="College / Workplace"
                            value={activeSubscription.college}
                          />
                          <InfoRow
                            label="Address"
                            value={activeSubscription.address}
                          />
                        </div>
                      </article>

                      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <h3 className="text-base font-extrabold text-stone-900 mb-3">
                          Subscription Summary
                        </h3>
                        <div className="space-y-2">
                          <InfoRow
                            label="Mess Name"
                            value={activeSubscription.mess?.name}
                          />
                          <InfoRow
                            label="Food Preference"
                            value={getFoodPreferenceLabel(
                              activeSubscription.foodPreference,
                            )}
                          />
                          <InfoRow
                            label="Payment Mode"
                            value={
                              activeSubscription.paymentMode === "upi"
                                ? "Online Transfer"
                                : "Cash"
                            }
                          />
                          <InfoRow
                            label="Meal Duration"
                            value={activeSubscription.duration}
                          />
                          <InfoRow
                            label="Joining Date"
                            value={formatDate(activeSubscription.joiningDate)}
                          />
                          <InfoRow
                            label="Expiry Date"
                            value={
                              activeExpiryDate?.toLocaleDateString("en-GB") ||
                              "N/A"
                            }
                          />
                        </div>

                        <div className="mt-4">
                          {activeSubscription.mess?.lat &&
                          activeSubscription.mess?.lon ? (
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `https://www.google.com/maps?q=${activeSubscription.mess.lat},${activeSubscription.mess.lon}`,
                                  "_blank",
                                )
                              }
                              className="w-full rounded-lg border border-orange-200 bg-orange-50 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-100"
                            >
                              Open Mess Location on Map
                            </button>
                          ) : (
                            <p className="text-xs text-stone-600">
                              Location coordinates are not available for this
                              mess.
                            </p>
                          )}
                        </div>
                      </article>
                    </div>

                    {activeSubscription.isAllowed ? (
                      <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <h3 className="text-base font-extrabold text-emerald-900 mb-3">
                          Today&apos;s Menu
                        </h3>

                        {(activeSubscription.mess?.vegMenu?.length > 0 ||
                          activeSubscription.mess?.nonVegMenu?.length > 0) && (
                          <MessMenuComponent
                            mess={activeSubscription.mess}
                            isOwner={false}
                          />
                        )}

                        {activeSubscription.mess?.vegMenu?.length === 0 &&
                          activeSubscription.mess?.nonVegMenu?.length === 0 && (
                            <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
                              Menu is not available yet. The mess owner has not
                              uploaded today&apos;s items.
                            </div>
                          )}
                      </article>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        Menu will be visible once your registration is approved
                        by the mess owner.
                      </div>
                    )}

                    {activeSubscription.paymentMode === "upi" &&
                      activeSubscription.paymentVerified && (
                        <article className="rounded-2xl border border-emerald-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <h3 className="text-base font-extrabold text-emerald-900">
                              Payment Invoice
                            </h3>
                            <span className="text-lg font-black text-emerald-700">
                              ₹{activeSubscription.totalAmount}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <InfoRow
                              label="Transaction ID"
                              value={
                                <span className="font-mono text-xs break-all">
                                  {activeSubscription.razorpayPaymentId ||
                                    "N/A"}
                                </span>
                              }
                            />
                            <InfoRow
                              label="Order ID"
                              value={
                                <span className="font-mono text-xs break-all">
                                  {activeSubscription.razorpayOrderId || "N/A"}
                                </span>
                              }
                            />
                            <InfoRow
                              label="Payment Date"
                              value={formatDate(
                                activeSubscription.createdAt ||
                                  activeSubscription.joiningDate,
                              )}
                            />
                            <InfoRow
                              label="Duration Paid For"
                              value={activeSubscription.duration}
                            />
                          </div>
                        </article>
                      )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
