"use client";
import { apiFetch } from "@/lib/apiFetch";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import PasswordStrength from "./PasswordStrength";
import { validatePasswordStrength } from "@/lib/passwordRules";

const ResetPasswordForm = ({ token }) => {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const problems = validatePasswordStrength(password);
    if (problems.length) {
      toast.error(`Password must contain ${problems.join(", ")}`);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch(`/api/auth/reset-password/${token}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      toast.success(data.message || "Password updated successfully");
      router.push("login");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      toast.error("Server Error");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600 text-lg">Invalid or missing token</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Reset Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="newPassword" className="block mb-1 font-medium">
              New Password
            </label>

            <input
              type="password"
              id="newPassword"
              placeholder="Enter new password"
              minLength={12}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring focus:ring-gray-400"
            />
            <PasswordStrength password={password} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white transition 
            ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-600 hover:bg-black"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Updating...</span>
              </div>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
