"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Info, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Movie, TVShow } from "@/types/tmdb";
import { tmdbService } from "@/api/tmdb";
import { getMediaTitle } from "@/utils/helpers";

interface HeroBannerProps {
  media: Movie | TVShow;
  isTV?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

// Custom luxury lamp effect (replaces Aceternity LampContainer)
function LampGlow() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5 overflow-hidden">
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

export function HeroBanner({ media, isTV = false }: HeroBannerProps) {
  const backdropUrl = tmdbService.getBackdropUrl(media.backdrop_path, "original");
  const href = isTV ? `/tv/${media.id}` : `/movies/${media.id}`;
  const releaseYear = new Date(
    ("release_date" in media ? media.release_date : media.first_air_date) || ""
  ).getFullYear();

  return (
    <div className="relative w-full h-[90vh] min-h-[800px] max-h-[1200px] overflow-hidden">
      {/* Custom lamp glow */}
      <LampGlow />

      {/* Background Image */}
      <motion.div
        initial={{ scale: 1.05, filter: "brightness(0.8)" }}
        animate={{ scale: 1, filter: "brightness(1)" }}
        transition={{ duration: 20, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full"
      >
        <Image
          src={backdropUrl}
          alt={getMediaTitle(media)}
          fill
          className="object-cover object-top opacity-90"
          priority
          quality={100}
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent z-10 w-[80%]" />
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-transparent to-transparent z-10 h-32" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.4)_100%)] z-10 pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="w-full px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl lg:max-w-3xl flex flex-col justify-end mt-20"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-[5rem] leading-[1.1] font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/60 mb-6 drop-shadow-2xl"
            >
              {getMediaTitle(media)}
            </motion.h1>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-4 mb-6 text-sm md:text-base font-medium"
            >
              <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-3.5 py-1.5 shadow-xl">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-white tracking-wide font-semibold">
                  {media.vote_average.toFixed(1)}
                </span>
              </div>
              <div className="text-zinc-300 font-semibold tracking-wider">{releaseYear}</div>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <div className="px-2.5 py-0.5 border border-white/20 rounded-md text-zinc-300 text-xs font-bold uppercase tracking-widest bg-white/5 backdrop-blur-sm">
                {isTV ? "Series" : "Movie"}
              </div>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-zinc-300 text-lg md:text-xl font-light mb-10 max-w-xl line-clamp-3 leading-relaxed drop-shadow-md"
            >
              {media.overview}
            </motion.p>

            <motion.div variants={itemVariants} className="flex items-center gap-4 flex-wrap">
              <Link href={href} className="relative group">
                <div className="absolute -inset-1 bg-amber-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Button
                  variant="premium"
                  size="xl"
                  className="relative h-14 px-8 text-lg font-semibold bg-white text-black hover:bg-zinc-200 transition-all duration-300 rounded-xl shadow-[0_0_40px_rgba(251,146,60,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-6 h-6 mr-3 fill-black transition-transform duration-500 group-hover:scale-110" />
                  Play Now
                </Button>
              </Link>

              <Link href={href}>
                <Button
                  variant="glass"
                  size="xl"
                  className="h-14 px-8 text-lg font-medium border-white/20 hover:bg-white/10 transition-all duration-300 rounded-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <Info className="w-6 h-6 mr-3 text-white/70 transition-colors duration-300 group-hover:text-white" />
                  More Info
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}