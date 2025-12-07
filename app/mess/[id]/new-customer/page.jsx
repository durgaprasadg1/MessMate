"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/Component/Others/Navbar";
import Loading from "@/Component/Others/Loading";
import FormInput from "@/Component/Others/FormInput";
import SelectBox from "@/Component/Others/SelectBox";
import { toast } from "react-toastify";

const NewCustomerToMess = () => {
  const messId = useParams().id;
  const router = useRouter();

  const [mess, setMess] = useState(null);
  const [existingRegistrations, setExistingRegistrations] = useState([]);
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
          setMess(messData.mess);
        }

        // Fetch existing registrations for this user
        const regRes = await fetch(
          `/api/consumer/${messId}/check-registrations`
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

    // Check meal time restrictions
    const hasDay = existingRegistrations.some(
      (reg) => reg.duration === "Day" || reg.duration === "Day + Night"
    );
    const hasNight = existingRegistrations.some(
      (reg) => reg.duration === "Night" || reg.duration === "Day + Night"
    );

    if (formData.duration === "Day" && hasDay) {
      toast.error(
        "You are already registered for Day meal in another mess. Please choose Night or cancel your existing Day registration."
      );
      return;
    }

    if (formData.duration === "Night" && hasNight) {
      toast.error(
        "You are already registered for Night meal in another mess. Please choose Day or cancel your existing Night registration."
      );
      return;
    }

    if (formData.duration === "Day + Night" && (hasDay || hasNight)) {
      toast.error(
        "You are already registered for a meal time. You cannot register for Day + Night."
      );
      return;
    }

    if (
      (hasDay && hasNight) ||
      existingRegistrations.some((reg) => reg.duration === "Day + Night")
    ) {
      toast.error(
        "You are already registered for both meal times. Please cancel an existing registration first."
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

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to register customer.");
        setLoading(false);
        return;
      }

      if (formData.paymentMode === "upi" && data.order) {
        await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        const { order, key, dbOrderId, amount } = data;

        const options = {
          key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: mess?.name || "Mess Registration",
          description: `Monthly Mess Registration - ${formData.duration}`,
          order_id: order.id,
          handler: async function (response) {
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
                }
              );

              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
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
                router.back();
              } else {
                toast.error(
                  verifyData.message || "Payment verification failed"
                );
              }
            } catch (err) {
              console.error(err);
              toast.error("Payment verification failed");
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              toast.info("Payment cancelled");
            },
          },
          prefill: {
            name: formData.name,
            contact: formData.phone,
          },
          theme: { color: "#3399cc" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Cash payment - registration successful
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
        router.back();
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="
          fixed inset-0 
          bg-gray-100 bg-opacity-50 backdrop-blur-sm
          flex items-center justify-center 
          z-50
        "
      >
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="bg-white p-4 sm:p-6 md:p-8 border rounded-lg shadow-lg">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center">
            New Customer Registration
          </h2>

          {mess && formData.duration && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Selected Duration:</span>{" "}
                {formData.duration}
              </p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                Amount to Pay: ₹{displayAmount}
              </p>
            </div>
          )}

          {existingRegistrations.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                ⚠️ Your Current Registrations:
              </p>
              {existingRegistrations.map((reg, idx) => (
                <p key={idx} className="text-xs text-amber-800">
                  • {reg.messName} - {reg.duration} meal
                </p>
              ))}
              <p className="text-xs text-amber-700 mt-2">
                You can only register for meal times you haven't already booked.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block font-medium">Address</label>
              <textarea
                name="address"
                placeholder="123 Main St, City"
                rows={3}
                className="w-full border p-2 rounded"
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
                    reg.duration === "Day" || reg.duration === "Day + Night"
                );
                const hasNight = existingRegistrations.some(
                  (reg) =>
                    reg.duration === "Night" || reg.duration === "Day + Night"
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
                        ? "Day + Night (Not Available)"
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
              className="w-full bg-gray-600 hover:bg-black text-white p-3 sm:p-4 text-base sm:text-lg font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {loading
                ? "Processing..."
                : formData.paymentMode === "upi"
                ? `Pay  Online and Register`
                : "Register with Cash Payment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewCustomerToMess;
