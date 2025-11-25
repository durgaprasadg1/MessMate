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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Navbar />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 mt-17">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Your Account
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Register now to get started with MessMate
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label labelName="First Name : " />
            <Input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your first name"
              required
              minLength={3}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <Label labelName="Email : " />
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              minLength={6}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <Label labelName="Phone Number : " />
            <Input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
              minLength={10}
              maxLength={10}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          {path === "/register-owner" && (
            <div>
              <Label labelName="UPI or VPA ID : " />
              <Input
                type="text"
                name="upi"
                value={form.upi}
                onChange={handleChange}
                placeholder="Enter your UPI or VPA ID"
                required
                minLength={4}
                maxLength={18}
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          )}

          <div>
            <Label labelName="Address" />
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter your address"
              rows="2"
              minLength={6}
              required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="relative">
            <Label labelName="Password" />
            <input
              type={show ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              minLength={8}
              required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-2 text-gray-500"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-600 hover:bg-black text-white py-2 rounded-xl font-semibold transition-all duration-200"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-3">
         {" "}
          <button
            onClick={() => router.push("/terms-and-conditions")}
            className="text-gray-500  hover:underline"
          >
            Read Terms And Conditions
          </button>
        </p>

        <p className="text-center text-gray-500 text-sm mt-3">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-gray-700 font-semibold hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterComponent;
