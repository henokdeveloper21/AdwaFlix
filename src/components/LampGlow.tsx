"use client";
import { motion } from "framer-motion";

export function LampGlow() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.02, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 w-[120%] h-[80%] bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-transparent blur-[80px] rounded-full"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.03, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/3 w-[100%] h-[60%] bg-gradient-to-b from-amber-400/15 via-red-500/5 to-transparent blur-[60px] rounded-full"
      />
    </div>
  );
}