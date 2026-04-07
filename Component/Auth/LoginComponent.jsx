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
    <div className="min-h-screen bg-slate-50 flex flex-col md:pl-[25vw] transition-[padding] duration-0 ease-linear">
      <Navbar />

      <div className="flex flex-col items-center justify-center grow p-6 sm:p-10 relative z-10 w-full mt-16 md:mt-0">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 p-8 sm:p-10 backdrop-blur-xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-tight">
              Welcome Back <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-slate-500 mt-3 font-medium">
              Log in to your MessMate dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semisemibold text-slate-400 uppercase tracking-widest pl-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700
                focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5 relative">
              <div className="flex justify-between items-end">
                 <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                 <button
                   type="button"
                   onClick={() => router.push("/forgot-password")}
                   className="text-orange-500 hover:text-orange-600 font-semibold text-[11px] mb-1 hover:underline tracking-wide rounded"
                 >
                   Forgot your password?
                 </button>
              </div>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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
              font-semibold shadow-lg shadow-orange-500/30 transition-all duration-200 mt-2 rounded"
            >
              {loading ? "Logging in..." : "Login to account"}
            </button>
          </form>

          <div className="mt-10 border-t border-slate-100 pt-6 space-y-3">
             <p className="text-center text-slate-500 text-xs font-medium">
               New to MessMate? 
               <button
                 type="button"
                 onClick={() => router.push("/signup")}
                 className="ml-1.5 text-orange-500 font-semibold hover:underline rounded"
               >
                 Create Consumer Account
               </button>
             </p>

             <p className="text-center text-slate-500 text-xs font-medium">
               Are you a vendor?
               <button
                 type="button"
                 onClick={() => router.push("/register-owner")}
                 className="ml-1.5 text-orange-500 font-semibold hover:underline rounded"
               >
                 Register Mess Owner
               </button>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
