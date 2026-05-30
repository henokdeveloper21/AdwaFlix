"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Play, Star, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdbService } from "@/api/tmdb";
import { Movie, TVShow } from "@/types/tmdb";
import { getMediaTitle } from "@/utils/helpers";
import { useRouter } from "next/navigation";

// Dynamic hyper-speed particle field that reacts to slide changes
function ParticleField({ speedKey }: { speedKey: number }) {
  return (
    <div className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => {
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const duration = 2 + Math.random() * 4;
        
        return (
          <motion.div
            key={`${speedKey}-${i}`}
            className="absolute w-1 h-1 bg-gradient-to-t from-amber-400 to-amber-200 rounded-full opacity-40"
            style={{ left: `${randomX}%`, top: `${randomY}%` }}
            animate={{
              y: [-10, -150],
              x: [0, (Math.random() - 0.5) * 50],
              scale: [0.8, 2, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "easeOut",
              delay: Math.random() * 1.5,
            }}
          />
        );
      })}
    </div>
  );
}

interface GoldenPortalHeroProps {
  items: (Movie | TVShow)[];
  autoPlayInterval?: number;
}

export function GoldenPortalHero({ items = [], autoPlayInterval = 8000 }: GoldenPortalHeroProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const [isHovered, setIsHovered] = useState(false);

  // Fallback safely if array is empty
  if (!items || items.length === 0) return null;

  const currentItem = items[activeIndex];
  const backdropUrl = tmdbService.getImageUrl((currentItem as any).backdrop_path || "", "original");
  const title = getMediaTitle(currentItem);
  const rating = (currentItem as any).vote_average?.toFixed(1) || "8.5";
  const overview = (currentItem as any).overview || "";
  const isTV = "name" in currentItem;

  // Mouse Tracking for Interactive 3D Holographic Perspective Tilt
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useTransform(mouseY, [0, 1], [12, -12]);
  const rotateY = useTransform(mouseX, [0, 1], [-12, 12]);
  const textTranslateZ = useTransform(mouseX, [0, 1], [-15, 15]);

  const springConfig = { stiffness: 120, damping: 22, mass: 0.8 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setIsHovered(false);
  };

  // Safe Navigation Handler
  const handleSlideChange = useCallback((newDirection: "next" | "prev") => {
    setDirection(newDirection === "next" ? 1 : -1);
    setActiveIndex((prevIndex) => {
      if (newDirection === "next") {
        return prevIndex === items.length - 1 ? 0 : prevIndex + 1;
      } else {
        return prevIndex === 0 ? items.length - 1 : prevIndex - 1;
      }
    });
  }, [items.length]);

  // Auto-Rotation Setup with Pause-on-Hover loop
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      handleSlideChange("next");
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [handleSlideChange, autoPlayInterval, isHovered]);

  // Wormhole animation configuration settings
  const slideVariants = {
    enter: (dir: number) => ({
      scale: 0.85,
      opacity: 0,
      filter: "blur(15px)",
      z: -200,
      rotateY: dir * 45,
    }),
    center: {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      z: 0,
      rotateY: 0,
      transition: {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (dir: number) => ({
      scale: 1.15,
      opacity: 0,
      filter: "blur(20px)",
      z: 200,
      rotateY: dir * -45,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      className="relative w-full h-[100vh] min-h-[850px] overflow-hidden bg-zinc-950 flex items-center justify-center select-none"
      style={{ perspective: "1200px" }}
    >
      {/* ===== AMBIENT BACKDROP REFLECTION LAYER ===== */}
      <div className="absolute inset-0 z-0 scale-110 blur-[80px] opacity-25 pointer-events-none transition-all duration-1000">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={activeIndex}
            src={backdropUrl}
            alt=""
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          />
        </AnimatePresence>
      </div>

      {/* Deep Luxury Matte Overlays */}
      <div className="absolute inset-0 bg-zinc-950/60 z-1" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/30 z-1" />

      {/* Floating Gold Mesh Particles */}
      <ParticleField speedKey={activeIndex} />

      {/* ===== GIANT BACKGROUND TEXT WATERMARK LAYER ===== */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-2 overflow-hidden pointer-events-none flex justify-center whitespace-nowrap opacity-[0.03]">
        <motion.h2 
          style={{ x: textTranslateZ }}
          className="text-[22vw] font-black tracking-tighter text-amber-500 uppercase select-none"
        >
          {isTV ? "PREMIUM SHOW" : "CINEMA 4K"}
        </motion.h2>
      </div>

      {/* ===== MAIN 3D PORTAL CONTAINER ===== */}
      <motion.div
        className="relative w-[85vw] lg:w-[70vw] max-w-6xl aspect-[16/9] z-10"
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Absolute Outer Orbit Gold Halo Ring */}
        <motion.div
          className="absolute -inset-12 rounded-[40px] border border-amber-500/15 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ transform: "translateZ(-40px)" }}
        />
        {/* Inner Counter-Rotating Orbit Ring */}
        <motion.div
          className="absolute -inset-6 rounded-[32px] border border-amber-400/10 pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ transform: "translateZ(-20px)" }}
        />

        {/* ===== WORMHOLE VISUAL CANVAS WINDOW ===== */}
        <div className="w-full h-full rounded-[28px] overflow-hidden bg-zinc-900 border border-white/10 shadow-[0_0_80px_rgba(245,158,11,0.12)] relative">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Actual Imagery */}
              <motion.img
                src={backdropUrl}
                alt={title}
                className="w-full h-full object-cover"
                style={{ transform: "scale(1.02)" }}
              />

              {/* Internal Glass Vignette Shading */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />

              {/* ===== INTEGRATED CINEMATIC TEXT CONTENT LAYER ===== */}
              <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end items-start z-20">
                {/* Meta Indicator Row */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="flex items-center gap-1 bg-amber-500 text-black px-3 py-1 rounded-md text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                    <Star className="w-3.5 h-3.5 fill-black" />
                    <span>{rating} IMDB</span>
                  </div>
                  <span className="text-zinc-400 text-xs font-bold tracking-[0.2em] uppercase bg-white/5 backdrop-blur-md px-3 py-1 rounded-md border border-white/10">
                    {isTV ? "TV SERIES" : "ULTRA MOVIE"}
                  </span>
                </motion.div>

                {/* Main Heading Title */}
                <motion.h1
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                  className="text-3xl md:text-6xl font-black tracking-tighter text-white mb-4 line-clamp-1 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                >
                  {title}
                </motion.h1>

                {/* Subtitle / Descriptive Text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.8 }}
                  className="text-zinc-300 text-sm md:text-base max-w-xl font-medium leading-relaxed line-clamp-2 mb-8 text-left"
                >
                  {overview}
                </motion.p>

                {/* Interactive CTA Controls */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 }}
                  className="flex items-center gap-4"
                >
                  <Button
                    size="xl"
                    className="rounded-full px-8 h-14 text-base font-black bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95"
                    onClick={() => router.push(`/${isTV ? "tv" : "movies"}/${currentItem.id}`)}
                  >
                    <Play className="mr-2 w-5 h-5 fill-black" /> Enter Cinema
                  </Button>

                  {/* Audio Control System */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 rounded-full border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/10 text-white"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className="text-amber-500 animate-pulse" />}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ===== ABSOLUTE NAVIGATION UTILITIES GRAPHICS ===== */}

      {/* Left/Right Control Arrays */}
      <div className="absolute bottom-12 left-12 lg:left-24 z-30 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleSlideChange("prev")}
          className="h-12 w-12 rounded-full border border-white/5 bg-zinc-900/40 backdrop-blur-md text-zinc-400 hover:text-white hover:border-amber-500/40 transition-colors"
        >
          <ChevronLeft size={24} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleSlideChange("next")}
          className="h-12 w-12 rounded-full border border-white/5 bg-zinc-900/40 backdrop-blur-md text-zinc-400 hover:text-white hover:border-amber-500/40 transition-colors"
        >
          <ChevronRight size={24} />
        </Button>
      </div>

      {/* Premium Linear Timeline Indicator System */}
      <div className="absolute bottom-14 right-12 lg:right-24 z-30 flex items-center gap-6 font-mono text-xs font-bold tracking-widest text-zinc-500">
        <span className="text-amber-500">
          {String(activeIndex + 1).padStart(2, "0")}
        </span>
        <div className="w-32 h-[2px] bg-zinc-800 relative rounded-full overflow-hidden">
          <motion.div
            key={activeIndex}
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: autoPlayInterval / 1000, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-300"
          />
        </div>
        <span>{String(items.length).padStart(2, "0")}</span>
      </div>
    </div>
  );
}