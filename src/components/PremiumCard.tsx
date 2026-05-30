'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, Download, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface PremiumCardProps {
  id: string;
  title: string;
  poster: string;
  rating: number;
  year: number;
  type: 'movie' | 'tv';
  overview?: string;
  isWishlisted?: boolean;
  onWishlist?: (id: string) => void;
}

export function PremiumCard({
  id,
  title,
  poster,
  rating,
  year,
  type,
  overview,
  isWishlisted = false,
  onWishlist
}: PremiumCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full cursor-pointer"
    >
      {/* Magic UI Subtle Glow Effect (Behind Card) */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-red-600/50 via-purple-600/50 to-red-600/50 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />

      {/* Main Card Container */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-white/10 transition-all duration-300 group-hover:ring-white/20">
        <Link href={`/watch/${id}`} className="block relative aspect-video overflow-hidden">
          
          {/* Immersive Image */}
          <motion.img
            src={poster}
            alt={title}
            className="w-full h-full object-cover origin-center"
            animate={{
              scale: isHovered ? 1.08 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          {/* Cinematic Vignette (Netflix Style) */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Premium Badge (Apple Style Pill) */}
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-2xl">
            <span className="text-[10px] tracking-widest text-white font-bold uppercase">Premium</span>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
            <span className="text-red-500 font-semibold text-xs tracking-wider">{rating.toFixed(1)}</span>
          </div>

          {/* Center Play Button Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  <Play size={24} className="fill-white translate-x-0.5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Section (Rises on Hover) */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end"
            animate={{ y: isHovered ? 0 : 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <h3 className="text-zinc-100 font-bold text-lg tracking-tight line-clamp-1 mb-1 drop-shadow-md">
              {title}
            </h3>
            
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium tracking-wide mb-3">
              <span>{year}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              <span className="uppercase tracking-widest">{type}</span>
            </div>

            {/* Hover Actions Menu */}
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
              className="flex items-center justify-between gap-2 overflow-hidden"
            >
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    onWishlist?.(id);
                  }}
                  className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                    isWishlisted
                      ? 'bg-red-500/20 border-red-500/50 text-red-500'
                      : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => e.preventDefault()}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all"
                >
                  <Download size={16} />
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => e.preventDefault()}
                className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all"
              >
                <MoreVertical size={16} />
              </motion.button>
            </motion.div>
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}