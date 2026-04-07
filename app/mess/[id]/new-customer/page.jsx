"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/Component/Others/Navbar";
import Loading from "@/Component/Others/Loading";
import FormInput from "@/Component/Others/FormInput";
import SelectBox from "@/Component/Others/SelectBox";
import { Toaster, toast } from "sonner";

const NewCustomerToMess = () => {
  const messId = useParams().id;
  const router = useRouter();

  const [mess, setMess] = useState(null);
  const [existingRegistrations, setExistingRegistrations] = useState([]);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    gender: "",
    paymentMode: "",
    college: "",
    duration: "",
    foodPreference: "",
    emergencyContact: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMessAndRegistrations = async () => {
      try {
        const messRes = await fetch(`/api/mess/${messId}`);
        if (messRes.ok) {
          const messData = await messRes.json();
          setMess(messData);
        }

        const regRes = await fetch(
          `/api/consumer/${messId}/check-registrations`,
        );
        if (regRes.ok) {
          const regData = await regRes.json();
          setExistingRegistrations(regData.registrations || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    if (messId) fetchMessAndRegistrations();
  }, [messId]);

  useEffect(() => {
    if (mess && formData.duration) {
      let amt = mess.monthlyMessFee || 0;
      if (formData.duration === "Day + Night") amt *= 2;
      setDisplayAmount(amt);
    }
  }, [mess, formData.duration]);

  const validators = {
    name: /^[A-Za-z ]+$/,
    phone: /^[6-9]\d{9}$/,
    emergencyContact: /^[6-9]\d{9}$/,
  };

  const validateField = (key, value) => {
    if (validators[key] && value && !validators[key].test(value)) {
      return `Invalid ${key}`;
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load script"));
      document.body.appendChild(script);
    });

  const getErrorMessage = async (response, fallback) => {
    try {
      const data = await response.json();
      if (data?.message) return data.message;
    } catch {
      // Ignore parse failures and fallback to generic message.
    }
    return fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      const err = validateField(key, value);
      if (err) newErrors[key] = err;
    });
    if (!formData.name || !formData.phone || !formData.duration) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const hasDay = existingRegistrations.some(
      (reg) => reg.duration === "Day" || reg.duration === "Day + Night",
    );
    const hasNight = existingRegistrations.some(
      (reg) => reg.duration === "Night" || reg.duration === "Day + Night",
    );

    if (formData.duration === "Day" && hasDay) {
      toast.error(
        "You are already registered for Day meal time. Please cancel your existing Day registration first.",
      );
      return;
    }

    if (formData.duration === "Night" && hasNight) {
      toast.error(
        "You are already registered for Night meal time. Please cancel your existing Night registration first.",
      );
      return;
    }

    if (formData.duration === "Day + Night" && (hasDay || hasNight)) {
      toast.error(
        "You cannot register for Day + Night because you already have a Day or Night registration.",
      );
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/mess/${messId}/new-customer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const msg = await getErrorMessage(res, "Failed to register customer.");
        toast.error(msg);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (formData.paymentMode === "upi" && data.order) {
        await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        const { order, key, dbOrderId } = data;
        let paymentHandled = false;

        const options = {
          key,
          amount: order.amount,
          currency: order.currency,
          name: mess?.name || "Mess Registration",
          description: `Monthly Mess Registration - ${formData.duration}`,
          order_id: order.id,
          handler: async function (response) {
            paymentHandled = true;
            try {
              const verifyRes = await fetch(
                `/api/mess/${messId}/new-customer`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    dbOrderId,
                  }),
                },
              );

              if (verifyRes.ok) {
                setLoading(false);
                toast.success("Payment successful! Registration complete.");
                setFormData({
                  name: "",
                  phone: "",
                  address: "",
                  gender: "",
                  paymentMode: "",
                  college: "",
                  duration: "",
                  foodPreference: "",
                  emergencyContact: "",
                });
                setTimeout(() => {
                  router.back();
                }, 700);
              } else {
                const verifyMsg = await getErrorMessage(
                  verifyRes,
                  "Payment verification failed",
                );
                toast.error(verifyMsg);
              }
            } catch (err) {
              console.error(err);
              toast.error("Payment verification failed");
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: async function () {
              if (!paymentHandled && dbOrderId) {
                try {
                  await fetch(`/api/mess/${messId}/new-customer`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "cancel",
                      dbOrderId,
                    }),
                  });
                } catch {
                  // Ignore cleanup failure; user has already cancelled payment.
                }
              }

              setLoading(false);
              toast.info(
                "Payment cancelled. No membership request was submitted.",
              );
            },
          },
          prefill: {
            name: formData.name,
            contact: formData.phone,
          },
          theme: { color: "#f97316" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.success("Requested successfully! Please wait for approval.");
        setFormData({
          name: "",
          phone: "",
          address: "",
          gender: "",
          paymentMode: "",
          college: "",
          duration: "",
          foodPreference: "",
          emergencyContact: "",
        });
        setLoading(false);
        setTimeout(() => {
          router.back();
        }, 700);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="role-shell bg-[#fff7f2]">
      <Toaster position="top-center" richColors closeButton />
      {loading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <Loading />
        </div>
      )}
      <Navbar />
      <main className="role-container max-w-4xl">
        <div className="role-section p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Monthly Mess Registration
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            New Customer Registration
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Join this mess for a monthly plan. Soft, clean fields keep your
            details clear.
          </p>
        </div>

        <div className="role-section p-5 sm:p-6">
          {mess && formData.duration && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-sm text-emerald-800">
                <span className="font-semibold">Selected Duration:</span>{" "}
                {formData.duration}
              </p>
              <p className="text-lg font-bold text-emerald-700 mt-2">
                Amount to Pay: ₹{displayAmount}
              </p>
            </div>
          )}

          {existingRegistrations.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                ⚠️ Your Current Registrations:
              </p>
              {existingRegistrations.map((reg, idx) => (
                <p key={idx} className="text-xs text-amber-800">
                  • {reg.messName} - {reg.duration} meal
                </p>
              ))}
              <p className="text-xs text-amber-700 mt-2">
                ℹ️ You can register for both Day and Night at different messes,
                but not the same meal time twice.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <FormInput
              label="Full Name"
              name="name"
              type="text"
              placeholder="Raja Mohan"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />

            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="9823******"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
            />

            <div className="space-y-2">
              <label className="block font-medium text-stone-800">
                Address
              </label>
              <textarea
                name="address"
                placeholder="123 Main St, City"
                rows={3}
                className="w-full border border-stone-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <SelectBox
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: "", label: "Select" },
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" },
              ]}
            />

            <SelectBox
              label="Payment Mode"
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handleChange}
              options={[
                { value: "", label: "Select" },
                { value: "upi", label: "Online Transfer" },
                { value: "cash", label: "Cash" },
              ]}
            />

            <SelectBox
              label="Duration of Meal"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              options={(() => {
                const hasDay = existingRegistrations.some(
                  (reg) =>
                    reg.duration === "Day" || reg.duration === "Day + Night",
                );
                const hasNight = existingRegistrations.some(
                  (reg) =>
                    reg.duration === "Night" || reg.duration === "Day + Night",
                );

                return [
                  { value: "", label: "Select" },
                  {
                    value: "Day",
                    label: hasDay
                      ? "Day Only (Already Registered)"
                      : "Day Only",
                    disabled: hasDay,
                  },
                  {
                    value: "Night",
                    label: hasNight
                      ? "Night Only (Already Registered)"
                      : "Night Only",
                    disabled: hasNight,
                  },
                  {
                    value: "Day + Night",
                    label:
                      hasDay || hasNight
                        ? "Day + Night (Not Available - Already have Day or Night)"
                        : "Day + Night",
                    disabled: hasDay || hasNight,
                  },
                ];
              })()}
            />

            <FormInput
              label="College / Workplace"
              name="college"
              type="text"
              placeholder="VIT Kondhwa Campus"
              value={formData.college}
              onChange={handleChange}
            />

            <SelectBox
              label="Food Preference"
              name="foodPreference"
              value={formData.foodPreference}
              onChange={handleChange}
              options={
                mess?.category === "veg"
                  ? [
                      { value: "", label: "Select" },
                      { value: "veg", label: "Veg" },
                    ]
                  : [
                      { value: "", label: "Select" },
                      { value: "veg", label: "Veg" },
                      { value: "both", label: "Veg + Non-Veg" },
                    ]
              }
            />

            {mess?.category === "veg" && (
              <p className="text-xs sm:text-sm text-amber-600 -mt-2">
                ℹ️ This is a vegetarian mess. Only veg food is available.
              </p>
            )}

            <FormInput
              label="Emergency Contact"
              name="emergencyContact"
              type="tel"
              placeholder="Emergency Contact Number"
              value={formData.emergencyContact}
              onChange={handleChange}
              error={errors.emergencyContact}
            />

            <button
              type="submit"
              disabled={loading || !formData.duration}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white p-3 sm:p-4 text-base sm:text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 shadow-sm"
            >
              {loading
                ? "Processing..."
                : formData.paymentMode === "upi"
                  ? `Pay Online and Register`
                  : "Register with Cash Payment"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewCustomerToMess;
