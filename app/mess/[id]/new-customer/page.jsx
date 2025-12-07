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
    const fetchMess = async () => {
      try {
        const res = await fetch(`/api/mess/${messId}`);
        if (res.ok) {
          const data = await res.json();
          setMess(data.mess);
        }
      } catch (err) {
        console.error("Failed to fetch mess details:", err);
      }
    };
    if (messId) fetchMess();
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
    <div className="max-w-4xl mx-auto mt-10 p-6 border rounded-lg shadow">
      <Navbar />
      <br />
      <br />

      <h2 className="text-2xl font-semibold mb-4 text-center">
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
          options={[
            { value: "", label: "Select" },
            { value: "Day", label: "Day Only" },
            { value: "Night", label: "Night Only" },
            { value: "Day + Night", label: "Day + Night" },
          ]}
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
          options={[
            { value: "", label: "Select" },
            { value: "veg", label: "Veg" },
            { value: "both", label: "Veg + Non-Veg" },
          ]}
        />

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
          className="w-full bg-gray-600 hover:bg-black text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Processing..."
            : formData.paymentMode === "upi"
            ? `Pay  Online and Register`
            : "Register with Cash Payment"}
        </button>
      </form>
    </div>
  );
};

export default NewCustomerToMess;

