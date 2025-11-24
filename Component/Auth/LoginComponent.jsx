"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "../Others/Loading";
import Navbar from "../Others/Navbar";
import { Eye, EyeOff } from "lucide-react";
import Label from "../Helper/Label";

const LoginComponent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // wait for session load

    if (session?.user?.isAdmin) router.replace("/admin");
    else if (session?.user?.isOwner) router.replace("/owner");
    else if (session?.user) router.replace("/mess");
  }, [session, status, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!form.password.trim()) {
      toast.error("Please enter your password");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (result?.error) {
        toast.error("Invalid credentials or internet issue");
      } else {
          toast.success("Login successful");
          if (session?.user?.isAdmin) {
            router.push("/admin");
          } else if (session?.user?.isOwner) {
            router.push("/owner");
          } else {
            router.push("/mess");
          }
      }
    } catch {
      toast.error("Server issue. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <div className="flex flex-col items-center justify-center grow  mt-20">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-4">
            Welcome Back 👋
          </h1>

          <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            Login to your MessMate account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label labelName="Email" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border rounded-xl text-sm sm:text-base 
                focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div className="relative">
              <Label labelName="Password" />
              <input
                type={show ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                minLength={8}
                required
                className="w-full px-4 py-3 border rounded-xl text-sm sm:text-base
                focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-8 text-gray-500"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-gray-600 hover:underline text-sm mb-1"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-600 hover:bg-black text-white py-3 rounded
              font-semibold transition-all duration-200"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-4">
            
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="ml-1 text-gray-800 font-semibold hover:underline"
            >
              Create a <b>consumer</b> account
            </button>
          </p>

          <p className="text-center text-gray-500 text-sm mt-2">
            <button
              type="button"
              onClick={() => router.push("/register-owner")}
              className="ml-1 text-gray-800 font-semibold hover:underline"
            >
              Create an <b>owner</b> account 
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
