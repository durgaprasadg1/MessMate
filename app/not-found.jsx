"use client";
import Link from "next/link";
import { ArrowLeftCircle } from "lucide-react";
import { motion } from "framer-motion";


export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-800 px-5">
      <div className="text-center">
        <h1 className="text-8xl font-extrabold text-orange-600 tracking-tight">404</h1>
        <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-2xl font-extrabold text-gray-700"
          >
            <Link href="/" className="  ">
              <button className="text-gray-600 transition-colors duration-300 hover:text-black">
                MessMate
              </button>    
            </Link>
          </motion.div>
        <h2 className="mt-2 text-2xl font-bold text-slate-800">Page Not Found</h2>
        <p className="mt-2 text-slate-600 max-w-md mx-auto">
          Looks like you took a wrong turn — or maybe the mess you’re looking for just isn’t serving today. 🍽️
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            <ArrowLeftCircle size={20} /> Go Back Home
          </Link>
        </div>
      </div>

      <div className="mt-12 text-sm text-slate-400">
        <p>
          MessMate — crafted with <span className="text-orange-500">♥</span> for local food lovers
        </p>
      </div>
    </main>
  );
}
