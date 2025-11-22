"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const SmallDivs = ({ desc, count, link, delay = 0 }) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay,
        ease: "easeOut",
      }}
      whileHover={{
        scale: 1.05,
        y: -4,
        boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
      }}
      whileTap={{ scale: 0.97, y: 0 }}
      onClick={() => router.push(link)}
      className="p-4 bg-amber-300 rounded-xl shadow-md hover:cursor-pointer 
                 transition-colors flex flex-col items-center justify-center 
                 "
    >
      <p className="text-lg font-semibold text-black tracking-tight">
        {desc}
      </p>
      <p className="text-3xl font-extrabold mt-1 drop-shadow-sm">
        {count}
      </p>
    </motion.div>
  );
};

export default SmallDivs;
