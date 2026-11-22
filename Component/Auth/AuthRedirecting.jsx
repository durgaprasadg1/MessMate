"use client";

/** Shown for the split second between "signed in" and the dashboard rendering (never the form again). */
export default function AuthRedirecting({ label = "Taking you to your dashboard…" }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-linear-to-br from-orange-100/70 via-[#fff7ef] to-orange-50">
      <div className="w-10 h-10 border-4 border-orange-300/70 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-stone-600">{label}</p>
    </div>
  );
}
