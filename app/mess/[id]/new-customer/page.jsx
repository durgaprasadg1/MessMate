"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/Component/Others/Navbar";
import Loading from "@/Component/Others/Loading";
import { toast } from "react-toastify";

const NewCustomerToMess = () => {
  const messId = useParams().id;
  const router = useRouter();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // validate all fields
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

      if (res.ok) {
        toast.success("Requested successfully! Please wait for approval.");

        // reset form only on success
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
        toast.error(data.message || "Failed to register customer.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
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
          className="w-full bg-gray-600 hover:bg-black text-white p-2 rounded"
        >
          {formData.paymentMode === "upi"
            ? "Pay Online and Join"
            : "Pay Via Cash and Join"}
        </button>
      </form>
    </div>
  );
};

export default NewCustomerToMess;

//
// Form Input
//
const FormInput = ({ label, name, type, placeholder, value, onChange, error }) => (
  <div>
    <label className="block font-medium">{label}</label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      className="w-full border p-2 rounded"
      value={value}
      onChange={onChange}
      required
    />
    {error && <p className="text-red-600 text-sm">{error}</p>}
  </div>
);

//
// Select Box
//
const SelectBox = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block font-medium">{label}</label>
    <select
      name={name}
      className="w-full border p-2 rounded"
      value={value}
      onChange={onChange}
      required
    >
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);


