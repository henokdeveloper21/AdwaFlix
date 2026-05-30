'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = 'w-full h-12' }: SkeletonProps) {
  return (
    <motion.div
      className={`${className} bg-zinc-900 rounded-2xl overflow-hidden relative border border-white/[0.02]`}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.05]">
      <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      
      {/* Skeleton Info Overlay to match the new card design */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end z-10">
        <Skeleton className="w-2/3 h-6 mb-3 rounded-md bg-zinc-800" />
        <Skeleton className="w-1/3 h-3 rounded-md bg-zinc-800" />
      </div>
    </div>
  );
}

export function HeroBannerSkeleton() {
  return (
    <div className="w-full h-[60vh] min-h-[500px] relative overflow-hidden rounded-3xl border border-white/[0.05] bg-zinc-950">
      <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      
      {/* Cinematic bottom gradient overlay for the skeleton */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

      <div className="absolute inset-0 p-12 flex flex-col justify-end z-10">
        <Skeleton className="w-32 h-6 mb-6 rounded-full bg-zinc-800" /> {/* Series Badge */}
        <Skeleton className="w-3/4 max-w-2xl h-16 mb-6 rounded-xl bg-zinc-800" /> {/* Title */}
        <Skeleton className="w-full max-w-xl h-20 mb-8 rounded-xl bg-zinc-800/50" /> {/* Description */}
        
        <div className="flex gap-4">
          <Skeleton className="w-36 h-14 rounded-full bg-zinc-800" /> {/* Play Button */}
          <Skeleton className="w-40 h-14 rounded-full bg-zinc-800/50" /> {/* More Info */}
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
        >
          <MovieCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}