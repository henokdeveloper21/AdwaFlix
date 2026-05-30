"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";

export default function FavoritesPage() {
  const [mounted, setMounted] = useState(false);
  const favorites = useAppStore((state) => state.favorites);
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
            <Heart size={32} className="text-pink-500 fill-pink-500" />
            <h1 className="text-4xl font-black tracking-tighter text-white">
              Favorites
            </h1>
          </div>
          <p className="text-zinc-400">
            {favorites.length} item{favorites.length !== 1 ? "s" : ""} you love
          </p>
        </motion.div>

        {favorites.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {favorites.map((item, index) => (
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
            <Heart
              size={64}
              className="mx-auto text-zinc-800 mb-4"
            />
            <p className="text-zinc-400 text-lg mb-6">
              You haven't liked anything yet!
            </p>
            <Link href="/">
              <Button variant="glass" className="gap-2">
                <ArrowLeft size={20} />
                Discover Movies
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