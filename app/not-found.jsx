"use client";
import Link from "next/link";
import { ArrowLeftCircle, UtensilsCrossed, ChefHat, Search } from "lucide-react";
import { motion } from "framer-motion";

// --- Sub-Components ---

const EmptyPlateIllustration = () => (
  <motion.div
     initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
     animate={{ opacity: 1, scale: 1, rotate: 0 }}
     transition={{ type: "spring", stiffness: 200, damping: 15 }}
     className="relative flex justify-center items-center h-48 w-48 mx-auto mb-10 bg-orange-50 rounded-full shadow-inner border-[12px] border-orange-100"
  >
    <div className="absolute inset-0 flex justify-center items-center">
       <UtensilsCrossed size={64} className="text-orange-200" />
    </div>
    <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute z-10"
    >
      <ChefHat size={80} className="text-orange-500 drop-shadow-md" />
    </motion.div>
  </motion.div>
);

const ErrorMessage = () => (
  <div className="text-center space-y-4 mb-10">
    <h1 className="text-7xl md:text-9xl font-black text-slate-800 tracking-tighter drop-shadow-sm">
      404
    </h1>
    <h2 className="text-2xl md:text-3xl font-bold text-orange-600">
      Oops! The recipe went missing.
    </h2>
    <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
      Looks like you took a wrong turn, or the mess you’re looking for just isn’t serving right now. Don't worry, there's always fresh food back home!
    </p>
  </div>
);

const ActionButtons = () => (
  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
    <Link
      href="/"
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 !text-white px-8 py-4 rounded-full font-bold shadow-[0_8px_30px_rgb(249,115,22,0.3)] hover:scale-105 hover:bg-orange-600 transition-all !no-underline"
    >
      <ArrowLeftCircle size={22} />
      <span>Go Back Home</span>
    </Link>
    <Link
      href="/mess"
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white !text-slate-700 px-8 py-4 rounded-full font-bold shadow-sm border border-slate-200 hover:scale-105 hover:bg-slate-50 transition-all !no-underline"
    >
       <Search size={20} className="text-slate-400" />
      <span>Explore Messes</span>
    </Link>
  </div>
);

const FooterMessage = () => (
  <div className="mt-12 text-sm font-medium text-slate-400 relative z-10">
    <p className="flex items-center gap-1.5 justify-center">
      MessMate — crafted with <span className="text-orange-500 text-lg">♥</span> for local food lovers
    </p>
  </div>
);

// --- Main Page Component ---

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-orange-200 rounded-full blur-[100px] opacity-40 animate-pulse mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-yellow-200 rounded-full blur-[100px] opacity-40 animate-pulse mix-blend-multiply"></div>

      <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.6, ease: "easeOut" }}
         className="relative z-10 w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-xl p-8 md:p-16 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100/50 flex flex-col items-center"
      >
        <EmptyPlateIllustration />
        <ErrorMessage />
        <ActionButtons />
      </motion.div>

      <FooterMessage />

    </main>
  );
}
