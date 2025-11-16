"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const LoginComponent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

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
        toast.error("Failed to login. Check your credentials.");
      } else {
        toast.success("Login successful");
        router.push("/mess");
      }
    } catch (err) {
      toast.error("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const showForgetPassWordPage = () => {
    router.push("/forgot-password");
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      router.push("/mess/pending-verification");
    } else if (session?.user) {
      router.push("/mess");
    }
  }, [session]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Welcome Back 👋
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Please login to your MessMate account
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              
              placeholder="Enter your password"
              required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <button
            type="button"
            onClick={showForgetPassWordPage}
            className="text-gray-600 mb-3 hover:underline"
          >
            Forgot password ?
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-600 hover:bg-black text-white py-2 rounded-xl font-semibold transition-all duration-200"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-3">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-gray-700 font-semibold hover:underline"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginComponent;
