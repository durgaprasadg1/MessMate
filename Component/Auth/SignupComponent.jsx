"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter, usePathname } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Loading from "../Others/Loading";
import { useSession } from "next-auth/react";
import Navbar from "../Others/Navbar";
import { Input } from "@/components/ui/input";
import Label from "../Helper/Label";

const RegisterComponent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const path = usePathname();

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
      setMessage(`❌ ${msg}`);
      return;
    }

    const upiRegex = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;

    if (path === "/register-owner" && !upiRegex.test(form.upi)) {
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;

    if (!passwordRegex.test(form.password)) {
      setLoading(false);
      const msg =
        "Password must contain uppercase, lowercase & special character";
      toast.error(msg);
      setMessage(`❌ ${msg}`);
      return;
    }

    try {
      const endpoint =
        path === "/register-owner"
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
        setMessage(`❌ ${text}`);
        toast.error(text);
      } else {
        const okText = "Account created successfully!";
        setMessage(okText);
        toast.success(okText);
        setTimeout(() => router.push("/login"), 1200);
      }
    } catch (err) {
      setMessage("❌ Server error. Please try again.");
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:pl-[25vw] transition-[padding] duration-0 ease-linear">
      <Navbar />
      <div className="flex flex-col items-center justify-center grow p-6 sm:p-10 w-full mt-16 md:mt-0">
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 p-8 sm:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-tight">
              Create Your Account
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Register now to get started with MessMate
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">First Name</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
                minLength={3}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700
                focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                minLength={6}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700
                focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your 10-digit phone number"
                required
                minLength={10}
                maxLength={10}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700
                focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {path === "/register-owner" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">UPI or VPA ID</label>
                <input
                  type="text"
                  name="upi"
                  value={form.upi}
                  onChange={handleChange}
                  placeholder="Enter your UPI (e.g. name@bank)"
                  required
                  minLength={4}
                  maxLength={50}
                  className="w-full px-5 py-3.5 bg-orange-50/50 border border-orange-200 rounded-2xl text-sm font-bold text-slate-800
                  focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-orange-300"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter your street address"
                rows="2"
                minLength={6}
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700
                focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Create Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  minLength={8}
                  required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-4 rounded-2xl
              font-semibold shadow-lg shadow-orange-500/30 transition-all duration-200 mt-4 rounded"
            >
              {loading ? "Registering..." : (path === "/register-owner" ? "Register as Owner" : "Create Consumer Account")}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 space-y-4">
            <p className="text-center text-xs font-semibold text-slate-400">
               By registering, you agree to our{" "}
              <button
                onClick={() => router.push("/terms-and-conditions")}
                className="text-orange-500 hover:underline inline"
              >
                Terms And Conditions
              </button>
            </p>

            <p className="text-center text-sm font-medium text-slate-500">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-orange-500 font-bold hover:underline ml-1 rounded"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterComponent;
