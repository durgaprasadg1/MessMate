import Link from "next/link";
import { ArrowRight, Utensils, Star, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-800">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-200">
        <h1 className="text-3xl font-extrabold text-orange-600 tracking-tight">
          MessMate<span className="text-slate-800">.</span>
        </h1>

        <nav className="space-x-6">
          <Link href="/mess" className="text-sm font-medium text-slate-700 hover:text-orange-600 transition">
            Explore
          </Link>
          <Link href="/consumer" className="text-sm font-medium text-slate-700 hover:text-orange-600 transition">
            Dashboard
          </Link>
          <Link
            href="/login"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
          >
            Login
          </Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <h2 className="text-5xl font-extrabold leading-tight text-slate-900">
            Eat smart. Order local. <br />
            <span className="text-orange-600">MessMate</span> makes it easy.
          </h2>

          <p className="mt-5 text-lg text-slate-600 max-w-lg">
            Discover trusted local messes, view real-time menus, and book your plate instantly. Built for students and small communities that love good food — without the hassle.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/mess"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              Explore Messes <ArrowRight size={18} />
            </Link>
            <Link
              href="/consumer"
              className="border border-slate-300 hover:border-orange-500 text-slate-700 hover:text-orange-600 px-6 py-3 rounded-lg font-medium transition"
            >
              Add Your Mess
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Utensils size={18} className="text-orange-600" /> Fresh meals
            </div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-orange-600" /> Trusted messes
            </div>
            <div className="flex items-center gap-2">
              <Star size={18} className="text-orange-600" /> Real reviews
            </div>
          </div>
        </div>

        {/* MOCKUP / CARD PREVIEW */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200 hover:shadow-2xl transition">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Utensils className="text-orange-600" size={18} /> Nearby Messes
          </h3>
          <p className="text-sm text-slate-500 mt-1">Sample view for users</p>

          <div className="mt-5 space-y-4">
            {[
              { name: "Kakunchi Mess", type: "Veg", price: 90, status: "Open" },
              { name: "Sunrise Mess", type: "Both", price: 120, status: "Closed" },
              { name: "Campus Bites", type: "Non-Veg", price: 110, status: "Open" },
            ].map((mess, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-100 hover:border-orange-300 transition flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-slate-800">{mess.name}</div>
                  <div className="text-xs text-slate-500">
                    {mess.type} • {mess.status}
                  </div>
                </div>
                <div className="text-sm font-semibold text-orange-600">₹{mess.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE SECTION */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10 text-center">
          {[
            {
              title: "Fast Booking",
              desc: "Reserve your plate in seconds and skip queues.",
              icon: <ArrowRight className="mx-auto text-orange-600" size={24} />,
            },
            {
              title: "Owner Tools",
              desc: "Mess owners can manage menus and toggle availability instantly.",
              icon: <Utensils className="mx-auto text-orange-600" size={24} />,
            },
            {
              title: "Trusted Reviews",
              desc: "See honest ratings and reviews from local diners.",
              icon: <Star className="mx-auto text-orange-600" size={24} />,
            },
          ].map((feature, i) => (
            <div key={i} className="p-6 hover:bg-slate-50 rounded-xl transition">
              {feature.icon}
              <h4 className="mt-4 font-semibold text-lg text-slate-800">{feature.title}</h4>
              <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} MessMate — Connecting students & community kitchens</div>
          <div className="space-x-4">
            <Link href="/login" className="hover:text-orange-600 transition">
              Login
            </Link>
            <Link href="/signup" className="hover:text-orange-600 transition">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
