"use client";
import { apiFetch } from "@/lib/apiFetch";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";
import { checkUpload } from "@/lib/clientUploadChecks";
import EmptynessShowBox from "@/Component/Others/EmptynessShowBox";
import { isValidCoordinate } from "@/lib/geo";

// Leaflet touches `window`, so the map is loaded in the browser only
const LocationPicker = dynamic(() => import("@/Component/Map/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[340px] animate-pulse rounded-lg bg-stone-200/70" aria-label="Loading map" />,
});
const NewMessForm = () => {
  const { data: session } = useSession();

  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    upi: "",
    email: "",
    description: "",
    address: "",
    category: "",
    limits: "true",
    ownerName: "",
    adharNumber: "",
    phoneNumber: "",
    monthlyMessFee: "500",
    monthlyMessDuration: "30",
    lat: "",
    lon: "",
  });
  const [image, setImage] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const setLocation = useCallback(({ lat, lon }) => setForm((s) => ({ ...s, lat, lon })), []);
  // suggest the address of the pin, but never overwrite what the owner already typed
  const suggestAddress = useCallback(
    (label) => setForm((s) => (s.address?.trim() ? s : { ...s, address: label })),
    [],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImage(null);
      return;
    }
    const problem = checkUpload(file, "image", 20 * 1024 * 1024); // size re-checked after compression
    if (problem) {
      toast.error(problem);
      e.target.value = "";
      setImage(null);
      return;
    }

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const tooBig = checkUpload(compressedFile, "image");
      if (tooBig) {
        toast.error(tooBig);
        e.target.value = "";
        return;
      }
      setImage(compressedFile);
    } catch (err) {
      console.error("Image compression failed:", err);
      setImage(file);
    }
  };

  const handleCertificate = async (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setCertificate(null);
      return;
    }

    const problem = checkUpload(file, "certificate", 20 * 1024 * 1024);
    if (problem) {
      toast.error(problem);
      e.target.value = "";
      setCertificate(null);
      return;
    }

    if (file.type && file.type.startsWith("image/")) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressed = await imageCompression(file, options);
        const tooBig = checkUpload(compressed, "certificate");
        if (tooBig) {
          toast.error(tooBig);
          e.target.value = "";
          return;
        }
        setCertificate(compressed);
      } catch (err) {
        console.error("Certificate compression failed:", err);
        setCertificate(file);
      }
    } else {
      const tooBig = checkUpload(file, "certificate");
      if (tooBig) {
        toast.error(tooBig);
        e.target.value = "";
        return;
      }
      setCertificate(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(form.email)) {
      setLoading(false);
      const msg = "Invalid Email";
      toast.error(msg);
      setMessage(`❌ ${msg}`);
      return;
    }

    const feeNumber = Number(form.monthlyMessFee);
    if (Number.isNaN(feeNumber) || feeNumber < 500) {
      setLoading(false);
      const msg = "Monthly fee must be at least ₹500";
      toast.error(msg);
      setMessage(`❌ ${msg}`);
      return;
    }

    const upiRegex = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;

    if (!upiRegex.test(form.upi)) {
      setLoading(false);
      const msg = "Invalid UPI";
      toast.error(msg);
      setMessage(`❌ ${msg}`);
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(form.phoneNumber)) {
      setLoading(false);
      const msg = "Phone number must be 10 digits long";
      toast.error(msg);
      setMessage(`❌ ${msg}`);
      return;
    }

    if (!isValidCoordinate(form.lat, form.lon)) {
      setLoading(false);
      const msg = "Please mark your mess location on the map";
      toast.error(msg);
      setMessage({ type: "error", text: msg });
      return;
    }

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append("image", image);
      if (certificate) fd.append("certificate", certificate);

      const res = await apiFetch(`/api/owner/${session?.user?.id}/new-mess`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || data?.error || "Could not submit your mess");
        return;
      }
      toast.success(
        "Your mess application has been submitted and is now under verification. We will e-mail you once it is approved.",
        { autoClose: 6000 },
      );
      setMessage({ type: "success", text: "Mess added successfully" });
      setForm({
        name: "",
        email: "",
        upi: "",
        description: "",
        address: "",
        category: "",
        limits: "true",
        ownerName: "",
        adharNumber: "",
        phoneNumber: "",
        monthlyMessFee: "",
        monthlyMessDuration: "",
        lat: "",
        lon: "",
      });
      setImage(null);
      setCertificate(null);
      router.push(`/owner/${session?.user?.id}/mess-details`);
    } catch (err) {
      console.error(err);
      toast.error("Server issue. Please try again.");
      setMessage({ type: "error", text: "Submission failed" });
    } finally {
      setLoading(false);
    }
  };
  if (!session || session?.user?.isOwner === false) {
    return (
      <EmptynessShowBox
        heading="Un-Authorized Access"
        link="/register-owner"
        linkmsg="Register as Owner"
      />
    );
  }

  return (
    <div className="bg-[#F4F7F4] min-h-screen md:pl-[280px] pt-16 md:pt-0">
      <div className="min-h-screen py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl sm:rounded-2xl text-stone-800 shadow-md p-4 sm:p-5 md:p-6 border border-stone-200/60">
          <h3 className="text-xl sm:text-2xl font-bold text-emerald-700 mb-3 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7"
              />
            </svg>
            Add New Mess
          </h3>
          <p className="text-center text-stone-600 text-xs sm:text-sm mt-3 italic bg-amber-50 border border-amber-200 px-3 sm:px-4 py-2 rounded-lg shadow-sm">
            📍 Mark the <span className="font-semibold">exact location of your mess on the map</span> below
            (search an address, click on the map or drag the pin). Customers will see distances from this point.{" "}
            <span className="font-semibold">
              Your mess first goes for verification and is added to the list automatically once it is approved.
            </span>
          </p>
          <p className="text-center text-stone-600 text-xs sm:text-sm mt-3 italic bg-amber-50 border border-amber-200 px-3 sm:px-4 py-2 rounded-lg shadow-sm">
            📍 कृपया नीचे दिए गए <span className="font-semibold">नक्शे पर अपने मेस की सही लोकेशन चुनें</span> (पता खोजें, नक्शे पर क्लिक करें
            या पिन को खींचें)। ग्राहकों को इसी स्थान से दूरी दिखाई जाएगी।
            <br />
            <br />
            <span className="font-semibold">
              आपकी मेस पहले वेरिफिकेशन प्रक्रिया में जाएगी और सफल वेरिफिकेशन के बाद स्वतः ही सूची में जोड़ दी जाएगी।
            </span>
          </p>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message.type === "success"
                ? "वेरिफिकेशन के बाद आपकी मेस जोड़ दिया जाएगा। आपको जल्द ही मेल भेजी जाएगी।"
                : "कुछ गड़बड़ हो गई है। कृपया बाद में दोबारा कोशिश करें !"}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            encType="multipart/form-data"
            className="space-y-4"
          >
            <div>
              <label className="block font-medium text-stone-700">Mess Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="e.g., Kakunchi Mess"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700">
                Tagline / Description
              </label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Short tagline"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700">
                Owner Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="abc@example.com"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700">Owner UPI</label>
              <input
                type="text"
                name="upi"
                value={form.upi}
                onChange={handleChange}
                className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="abc@bank"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700">
                Monthly Mess Fee
              </label>
              <input
                type="number"
                name="monthlyMessFee"
                value={form.monthlyMessFee}
                onChange={handleChange}
                className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="1800"
                min="500"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700">
                Monthly Mess Duration
              </label>
              <select
                name="monthlyMessDuration"
                id=""
                type="number"
                value={form.monthlyMessDuration}
                onChange={handleChange}
                className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 "
              >
                <option className="text-black" value={0}>
                  Select Duration
                </option>
                <option value={15} className="text-black">
                  15 Days
                </option>
                <option value={28} className="text-black">
                  28 Days
                </option>
                <option value={30} className="text-black">
                  30 Days
                </option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-stone-700">Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-stone-700">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 "
                >
                  <option className="text-black" value="">
                    Select Category
                  </option>
                  <option className="text-black" value="Veg">
                    Veg
                  </option>
                  <option className="text-black" value="Non Veg">
                    Non-Veg
                  </option>
                  <option className="text-black" value="both">
                    Both (Veg + Non-Veg)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-stone-700">Limits</label>
                <select
                  name="limits"
                  value={form.limits}
                  onChange={handleChange}
                  className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option className="text-black" value="true">
                    Limited
                  </option>
                  <option className="text-black" value="false">
                    Unlimited
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-stone-700">
                  Owner Name
                </label>
                <input
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  minLength={3}
                  required
                  className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Owner full name"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700">
                  Owner's Aadhaar Number
                </label>
                <input
                  name="adharNumber"
                  value={form.adharNumber}
                  onChange={handleChange}
                  pattern="\d{12}"
                  required
                  className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="987654321098"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700">
                Phone Number
              </label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                pattern="\d{10}"
                required
                className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 bg-[#F4F7F4] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="98765412335"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-800 mb-2">
                Mess Location (select on the map)
              </label>
              <LocationPicker
                value={isValidCoordinate(form.lat, form.lon) ? { lat: form.lat, lon: form.lon } : null}
                onChange={setLocation}
                onAddress={suggestAddress}
              />
            </div>

            <div>
              <label className="block font-medium text-stone-800">
                Mess Banner (jpg, jpeg, png)
              </label>
              <input
                type="file"
                name="image"
                accept=".jpg,.jpeg,.png"
                onChange={handleFile}
                className="mt-1 w-full border-gray-600"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-800">
                {" "}
                Certificate of Verification (jpg, jpeg, png)
              </label>
              <input
                type="file"
                name="certificate"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleCertificate}
                className="mt-1 w-full border-gray-600"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Add Mess"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewMessForm;
