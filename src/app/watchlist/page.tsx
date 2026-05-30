"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";

export default function WatchlistPage() {
  const [mounted, setMounted] = useState(false);
  const watchlist = useAppStore((state) => state.watchlist);
  const initializeStore = useAppStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <div className="container-premium py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <Bookmark size={32} className="text-amber-500 fill-amber-500" />
            <h1 className="text-4xl font-black tracking-tighter text-white">
              My Watchlist
            </h1>
          </div>
          <p className="text-zinc-400">
            {watchlist.length} item{watchlist.length !== 1 ? "s" : ""} saved
          </p>
        </motion.div>

        {watchlist.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {watchlist.map((item, index) => (
              <MovieCard
                key={item.id}
                media={item}
                isTV={"name" in item}
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Bookmark
              size={64}
              className="mx-auto text-zinc-800 mb-4"
            />
            <p className="text-zinc-400 text-lg mb-6">
              Your watchlist is empty. Start building your queue!
            </p>
            <Link href="/">
              <Button variant="glass" className="gap-2">
                <ArrowLeft size={20} />
                Browse Content
              </Button>
            </Link>
          </motion.div>
        )}
      </div>

      <footer className="border-t border-white/10 py-8">
        <div className="container-premium text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} AdwaFlix. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}