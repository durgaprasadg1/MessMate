'use client'
import { useState } from "react";
import { toast } from "react-toastify";
import Loading from "../../../Component/Loading";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false); 
  const handleBacktoLogin = () =>{
    router.push('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get("forgotEmail");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to send email");
        setLoading(false);
        return;
      }

      toast.success( "Mail sent successfully");
    } catch (error) {
      toast.error("Server Error");
    }

    setLoading(false);
  };
  if(loading){
    <Loading/>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-5 text-center">
          Forgot Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="forgotEmail" className="block mb-1 ml-3 font-medium">
              Email : 
            </label>
            <input
              type="email"
              name="forgotEmail"
              id="forgotEmail"
              placeholder="Enter your Email"
              minLength={5}
              required
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring focus:ring-gray-400"
            />
          </div>
          <p className="text-black hover:cursor-pointer " onClick={handleBacktoLogin}>Back to Login</p>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white transition 
            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-600 hover:bg-black"}`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Sending...</span>
              </div>
            ) : (
              "Send Mail"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
