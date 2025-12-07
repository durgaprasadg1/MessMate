"use client";
import Link from "next/link";
import { ArrowRight, Utensils, Star, Users } from "lucide-react";
import Navbar from "@/Component/Others/Navbar";
import Footer from "@/Component/Others/Footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.isAdmin) {
      router.replace("/admin");
    } else if (session?.user?.isOwner) {
      router.replace("/owner");
    }
  }, [session, router]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen text-slate-800 from-white via-slate-50 to-white"
    >
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Navbar />
        <nav className="flex items-center gap-4 ">
          
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-semibold"
            >
              Local • Fresh • Trusted
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight"
            >
              Delicious everyday meals, from trusted local messes.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-lg text-slate-600 max-w-xl"
            >
              MessMate connects students and communities to nearby messes with
              real menus, verified owners, and instant booking — built to make
              daily meals simple and dependable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 mt-4"
            >
              <Link
                href="/mess"
                className="inline-flex items-center gap-2 bg-gray-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-black shadow-md transition-colors"
              >
                Explore Messes <ArrowRight size={16} />
              </Link>
            </motion.div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[Utensils, Users, Star].map((Icon, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="text-gray-600"
                  >
                    <Icon />
                  </motion.div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {i === 0
                        ? "Fresh Menus"
                        : i === 1
                        ? "Verified Owners"
                        : "Real Reviews"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {i === 0
                        ? "Daily-updated food options"
                        : i === 1
                        ? "Licence & identity checks"
                        : "Community-rated reliability"}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column Cards */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.2 },
              },
            }}
            className="max-w-7xl mx-auto px-6 py-16"
          >
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
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.03 }}
                  className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
                >
                  <h4 className="font-semibold text-slate-800">{f.title}</h4>
                  <p className="text-sm text-slate-500 mt-2">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
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

      <Footer />
    </motion.main>
  );
}
