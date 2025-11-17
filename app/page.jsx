'use client'
import Link from "next/link";
import { ArrowRight, Utensils, Star, Users } from "lucide-react";
import Navbar from "@/Component/Others/Navbar";
import Footer from "@/Component/Others/Footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { data: session }  = useSession();
  
  useEffect(() => {

    if (session?.user?.isAdmin) {
      router.replace("/admin");
    }
  }, [session, router]);
  return (
    <main className="min-h-screen text-slate-800  from-white via-slate-50 to-white">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Navbar/>
        <nav className="flex items-center gap-4">
         
          
          <Link
            href="/signup"
            className=" ml-3 inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black transition"
          >
           <button className="text-white">Sign Up</button>
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="inline-block bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Local • Fresh • Trusted
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              Delicious everyday meals, from trusted local messes.
            </h2>
            <p className="text-lg text-slate-600 max-w-xl">
              MessMate connects students and communities to nearby messes with
              real menus, verified owners, and instant booking — built to make
              daily meals simple and dependable.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link
                href="/mess"
                className="inline-flex items-center gap-2 bg-gray-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-black shadow-md transition-colors"
              >
                Explore Messes <ArrowRight size={16} />
              </Link>
              
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Utensils className="text-gray-600" />
                <div>
                  <div className="font-semibold text-slate-800">
                    Fresh Menus
                  </div>
                  <div className="text-sm text-slate-500">
                    Daily-updated food options
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="text-gray-600" />
                <div>
                  <div className="font-semibold text-slate-800">
                    Verified Owners
                  </div>
                  <div className="text-sm text-slate-500">
                    Licence & identity checks
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="text-gray-600" />
                <div>
                  <div className="font-semibold text-slate-800">
                    Real Reviews
                  </div>
                  <div className="text-sm text-slate-500">
                    Community-rated reliability
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Fast Booking",
              desc: "Reserve your plate in seconds and skip queues.",
            },
            {
              title: "Owner Tools",
              desc: "Manage menus, orders and availability with ease.",
            },
            {
              title: "Trusted Community",
              desc: "Ratings and reviews from students and locals.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
            >
              <h4 className="font-semibold text-slate-800">{f.title}</h4>
              <p className="text-sm text-slate-500 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

          
        </div>
        <div className="absolute -bottom-20 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 100" className="w-full text-white opacity-40">
            <path
              fill="currentColor"
              d="M0,32L48,53.3C96,75,192,117,288,128C384,139,480,117,576,106.7C672,96,768,96,864,85.3C960,75,1056,53,1152,42.7C1248,32,1344,32,1392,32L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      <Footer/>

      
    </main>
  );
}
