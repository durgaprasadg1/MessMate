"use client";
import Link from "next/link";
import { ArrowRight, Utensils, Star, Users, Play } from "lucide-react";
import Navbar from "@/Component/Others/Navbar";
import Footer from "@/Component/Others/Footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

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
    <div className="min-h-screen bg-white md:pl-[25vw] flex flex-col transition-[padding] duration-0 ease-linear">
      <Navbar />

      <main className="max-w-7xl mx-auto px-2 pt-24 md:pt-16 pb-20 relative overflow-hidden flex-1 flex flex-col">
        
        {/* Top Spacer / empty header for mobile compensation */}
        <div className="h-4 md:h-12 w-full"></div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center flex-1">
          {/* Left Column Text & Actions */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 z-10"
          >
            <h1 className="text-5xl lg:text-[4rem] font-extrabold text-slate-800 leading-[1.1] tracking-tight">
              Delicious <span className="text-orange-500">Fresh</span> Everyday Meals
            </h1>

            <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
              We connect students and communities to nearby messes with real menus, verified owners, and instant booking — built to make daily meals simple.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <Link
                href="/mess"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold shadow-[0_8px_30px_rgb(249,115,22,0.3)] transition-all flex items-center gap-2 hover:scale-105"
              >
                Explore Messes
              </Link>
              
            </div>

            
          </motion.div>

          {/* Right Column Image Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative lg:h-[600px] flex items-center justify-center lg:justify-end mt-12 lg:mt-0 xl:translate-x-8"
          >
            {/* Massive styling circles referencing the orange ring layout */}
            <div className="absolute w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] lg:w-[420px] lg:h-[420px] xl:w-[550px] xl:h-[550px] rounded-full border-[6px] border-orange-400/90 animate-[spin_30s_linear_infinite]" />
            <div className="absolute w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] lg:w-[390px] lg:h-[390px] xl:w-[510px] xl:h-[510px] rounded-full border border-orange-200 animate-[spin_40s_linear_infinite_reverse]" />
            
            {/* Food Bowl Image container */}
            <div className="relative w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] lg:w-[350px] lg:h-[350px] xl:w-[480px] xl:h-[480px] rounded-full overflow-hidden shadow-2xl z-10">
              <div className="w-full h-full flex items-center justify-center">
                 <Image src="/hero_food_bowl.png" fill className="object-cover animate-[spin_60s_linear_infinite]" alt="Food Bowl" />
              </div>
            </div>

            {/* Floating review/status card matching reference */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              className="absolute -bottom-4 lg:bottom-12 -left-4 lg:-left-2 bg-white px-6 py-4 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex items-center gap-4 z-20 cursor-default"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 overflow-hidden relative" style={{ flexShrink: 0 }}>
                 {/* Replace with avatar later */}
                 <div className="w-full h-full bg-red-400 absolute opacity-20"></div>
                 <Utensils size={20} className="relative z-10" />
              </div>
              <div className="pr-4">
                <p className="text-sm font-bold text-slate-800 whitespace-nowrap">Fresh & Hot Meals</p>
                
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <div className="mt-auto relative z-20">
        <Footer />
      </div>
    </div>
  );
}
