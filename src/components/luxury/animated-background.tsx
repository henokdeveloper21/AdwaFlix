"use client";
import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-black to-neutral-900" />
      {/* Slow-moving luxury orb */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -50, 80, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-600/10 blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -80, 120, 0],
          y: [0, 60, -40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] rounded-full bg-gradient-to-l from-rose-500/10 via-purple-500/5 to-blue-500/10 blur-3xl"
      />
    </div>
  );
}