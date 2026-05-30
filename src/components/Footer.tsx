"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-12 px-6 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col gap-2">
          <Link href="/" className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-red-600">
            ADWAFLIX
          </Link>
          <p className="text-zinc-600 text-xs font-bold tracking-[0.2em] uppercase">
            Premium Cinematic Experience
          </p>
        </div>

        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-white">
            <Twitter size={18} />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-white">
            <Github size={18} />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-pink-500">
            <Heart size={18} />
          </Button>
        </div>

        <div className="text-zinc-700 text-xs font-medium tracking-widest uppercase">
          &copy; {new Date().getFullYear()} Adwaflix. All rights reserved.
        </div>
      </div>
    </footer>
  );
}