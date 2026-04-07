"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter, usePathname } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Loading from "../Others/Loading";
import { useSession } from "next-auth/react";
import Navbar from "../Others/Navbar";
import AuthOrbitPanel from "./AuthOrbitPanel";

const RegisterComponent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const path = usePathname();
  const isOwnerFlow = path === "/register-owner";

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    if (session?.user?.isAdmin) {
      router.replace("/admin");
    } else if (session?.user?.isOwner) {
      router.replace("/owner");
    } else {
      router.replace("/mess");
    }
  }, [session, status, router]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: "",
    upi: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(form.email)) {
      setLoading(false);
      const msg = "Invalid Email";
      toast.error(msg);
      setMessage(` ${msg}`);
      return;
    }

    const upiRegex = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;

    if (isOwnerFlow && !upiRegex.test(form.upi)) {
      setLoading(false);
      const msg = "Invalid UPI";
      toast.error(msg);
      setMessage(` ${msg}`);
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(form.phoneNumber)) {
      setLoading(false);
      const msg = "Phone number must be 10 digits long";
      toast.error(msg);
      setMessage(` ${msg}`);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;

    if (!passwordRegex.test(form.password)) {
      setLoading(false);
      const msg =
        "Password must contain uppercase, lowercase & special character";
      toast.error(msg);
      setMessage(` ${msg}`);
      return;
    }

    try {
      const endpoint = isOwnerFlow
        ? "/api/auth/register-owner"
        : "/api/auth/signup";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        const text = data.message || "Registration failed";
        setMessage(` ${text}`);
        toast.error(text);
      } else {
        const okText = "Account created successfully!";
        setMessage(okText);
        toast.success(okText);
        setTimeout(() => router.push("/login"), 1200);
      }
    } catch {
      setMessage("Server error. Please try again.");
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-100/70 via-[#fff7ef] to-orange-50 flex flex-col md:pl-[25vw] transition-[padding] duration-0 ease-linear">
      <Navbar />
      <div className="w-full grow p-4 sm:p-6 lg:p-8 mt-2 md:mt-0">
        <div className="mx-auto w-full max-w-6xl rounded-[2.25rem] border border-orange-200/70 bg-[#fff7ef] p-3 sm:p-4 shadow-[0_26px_60px_-36px_rgba(194,65,12,0.55)]">
          <div className="grid min-h-[760px] grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-4xl border border-orange-100 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-500">
                  {isOwnerFlow ? "Owner Signup" : "Signup"}
                </p>
                <h1 className="mt-2 text-3xl sm:text-4xl font-black text-stone-900 leading-tight">
                  {isOwnerFlow ? "Register as owner" : "Create your account"}
                </h1>
                <p className="mt-2 text-sm text-stone-600">
                  {isOwnerFlow
                    ? "Start managing your mess with a warm and simple setup."
                    : "Register now and start exploring nearby meal plans."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.13em] text-orange-500 pl-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    minLength={3}
                    className="w-full px-4 py-3.5 rounded-2xl border border-orange-200 bg-orange-50/35 text-sm font-medium text-stone-800
                    focus:outline-none focus:ring-2 focus:ring-orange-400/35 focus:border-orange-400 transition-all placeholder:text-stone-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.13em] text-orange-500 pl-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    minLength={6}
                    className="w-full px-4 py-3.5 rounded-2xl border border-orange-200 bg-orange-50/35 text-sm font-medium text-stone-800
                    focus:outline-none focus:ring-2 focus:ring-orange-400/35 focus:border-orange-400 transition-all placeholder:text-stone-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.13em] text-orange-500 pl-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your 10-digit phone number"
                    required
                    minLength={10}
                    maxLength={10}
                    className="w-full px-4 py-3.5 rounded-2xl border border-orange-200 bg-orange-50/35 text-sm font-medium text-stone-800
                    focus:outline-none focus:ring-2 focus:ring-orange-400/35 focus:border-orange-400 transition-all placeholder:text-stone-400"
                  />
                </div>

                {isOwnerFlow && (
                  <div className="">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.13em] text-orange-500 pl-1">
                      UPI or VPA ID
                    </label>
                    <input
                      type="text"
                      name="upi"
                      value={form.upi}
                      onChange={handleChange}
                      placeholder="Enter your UPI (example@bank)"
                      required
                      minLength={4}
                      maxLength={50}
                      className="w-full px-4 py-3.5 rounded-2xl border border-orange-300 bg-orange-100/70 text-sm font-semibold text-stone-800
                      focus:outline-none focus:ring-2 focus:ring-orange-400/35 focus:border-orange-400 transition-all "
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.13em] text-orange-500 pl-1">
                    Full Address
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter your full address"
                    rows="2"
                    minLength={6}
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border border-orange-200 bg-orange-50/35 text-sm font-medium text-stone-800
                    focus:outline-none focus:ring-2 focus:ring-orange-400/35 focus:border-orange-400 transition-all placeholder:text-stone-400 resize-none"
                  />
                </div>

                <div className=" relative">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.13em] text-orange-500 pl-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      minLength={8}
                      required
                      className="w-full px-4 py-3.5 rounded-2xl border border-orange-200 bg-orange-50/35 text-sm font-medium text-stone-800
                      focus:outline-none focus:ring-2 focus:ring-orange-400/35 focus:border-orange-400 transition-all placeholder:text-stone-400 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-3.5 rounded-2xl font-bold tracking-wide shadow-lg shadow-orange-500/30 transition-all duration-200 mt-1"
                >
                  {loading
                    ? "Registering..."
                    : isOwnerFlow
                      ? "Register as Owner"
                      : "Create Consumer Account"}
                </button>

                {message && (
                  <p
                    className={`text-sm text-center font-medium ${
                      message.startsWith("")
                        ? "text-rose-600"
                        : "text-emerald-700"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </form>

              <div className="border-t border-orange-100 ">
                <p className="text-center text-xs font-semibold text-stone-500">
                  By registering, you agree to our{" "}
                  <button
                    onClick={() => router.push("/terms-and-conditions")}
                    className="text-orange-600 hover:underline inline font-bold"
                  >
                    Terms and Conditions
                  </button>
                </p>

                <p className="text-center text-sm font-medium text-stone-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => router.push("/login")}
                    className="text-orange-600 font-bold hover:underline ml-1"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </div>

            <AuthOrbitPanel
              title=""
              subtitle=""
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterComponent;
