"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "../Others/Loading";
import Navbar from "../Others/Navbar";
import { Eye, EyeOff } from "lucide-react";
import AuthOrbitPanel from "./AuthOrbitPanel";

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
    <div className="min-h-screen bg-linear-to-br from-orange-100/70 via-[#fff7ef] to-orange-50 flex flex-col md:pl-[25vw] transition-[padding] duration-0 ease-linear">
      <Navbar />

      <div className="w-full grow p-4 sm:p-6 lg:p-8 mt-16 md:mt-0">
        <div className="mx-auto w-full max-w-6xl rounded-[2.25rem] border border-orange-200/70 bg-[#fff7ef] p-3 sm:p-4 shadow-[0_26px_60px_-36px_rgba(194,65,12,0.55)]">
          <div className="grid min-h-[480px] grid-cols-1 gap-4 lg:grid-cols-2">
            <AuthOrbitPanel
              title=""
              subtitle=""
            />

            <div className="rounded-4xl border border-orange-100 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-500">
                  Login
                </p>
                <h1 className="mt-2 text-3xl sm:text-4xl font-black text-stone-900 leading-tight">
                  Login to your account
                </h1>
                <p className="mt-2 text-sm text-stone-600">
                  Access your MessMate dashboard in one step.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="">
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
                    className="w-full px-4 py-3.5 rounded-2xl border border-orange-200 bg-orange-50/35 text-sm font-medium text-stone-800
                    focus:outline-none focus:ring-2 focus:ring-orange-400/35 focus:border-orange-400 transition-all placeholder:text-stone-400"
                  />
                </div>

                <div className="relative">
                  <div className="flex justify-between items-end">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.13em] text-orange-500 pl-1">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => router.push("/forgot-password")}
                      className="text-orange-600 hover:text-orange-700 font-semibold text-[11px] mb-1 hover:underline tracking-wide"
                    >
                      Forgot password?
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
                  className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-3.5 rounded font-bold tracking-wide shadow-lg shadow-orange-500/30 transition-all duration-200 mt-1"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="mt-1 border-t border-orange-100  space-y-1">
                <p className="text-center text-stone-600 text-sm font-medium">
                  New to MessMate? {' '}
                  <button
                    type="button"
                    onClick={() => router.push("/signup")}
                    className="ml-1.5 text-orange-600 font-bold hover:underline"
                  >
                    Create Consumer Account
                  </button>
                </p>

                <p className="text-center text-stone-600 text-sm font-medium">
                  Are you a vendor? {" "}
                  <button
                    type="button"
                    onClick={() => router.push("/register-owner")}
                    className="ml-1.5 text-orange-600 font-bold hover:underline"
                  >
                    Register Mess Owner
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
