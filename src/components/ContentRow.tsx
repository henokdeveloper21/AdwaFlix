"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Movie, TVShow } from "@/types/tmdb";
import { MovieCard } from "./MovieCard";
import { Button } from "@/components/ui/button";

interface ContentRowProps {
  title: string;
  items: (Movie | TVShow)[];
  isTV?: boolean;
  loading?: boolean;
}

export function ContentRow({
  title,
  items,
  isTV = false,
  loading = false,
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(
      el.scrollLeft < el.scrollWidth - el.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!items.length && !loading) return null;

  return (
    <section className="relative mb-16 md:mb-20 px-4 md:px-12 group/section">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-end justify-between mb-5 px-2 md:px-0"
      >
        <h2 className="text-xl md:text-2xl lg:text-[28px] font-bold tracking-tight text-white/90">
          {title}
        </h2>
        <motion.span
          whileHover={{ x: 2 }}
          className="text-sm font-medium text-white/40 hover:text-white cursor-pointer transition-colors duration-300 flex items-center gap-1"
        >
          Explore All <ChevronRight size={14} className="mt-0.5" />
        </motion.span>
      </motion.div>

      {/* Carousel container */}
      <div className="relative">
        {/* Left fade & button */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-24 z-20 flex items-center justify-start bg-gradient-to-r from-black via-black/80 to-transparent transition-opacity duration-500 pointer-events-none ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="pointer-events-auto ml-2 md:-ml-6">
            <Button
              variant="glass"
              size="icon"
              onClick={() => scroll("left")}
              className="h-12 w-12 md:h-14 md:w-14 rounded-full opacity-0 group-hover/section:opacity-100 transition-all duration-300 hover:scale-110 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            >
              <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
            </Button>
          </div>
        </div>

        {/* Right fade & button */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-24 z-20 flex items-center justify-end bg-gradient-to-l from-black via-black/80 to-transparent transition-opacity duration-500 pointer-events-none ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="pointer-events-auto mr-2 md:-mr-6">
            <Button
              variant="glass"
              size="icon"
              onClick={() => scroll("right")}
              className="h-12 w-12 md:h-14 md:w-14 rounded-full opacity-0 group-hover/section:opacity-100 transition-all duration-300 hover:scale-110 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            >
              <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
            </Button>
          </div>
        </div>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-8 pt-2 px-2 md:px-0 -mx-2 md:mx-0"
          style={{
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[220px] lg:w-[260px]"
            >
              <MovieCard media={item} isTV={isTV} index={index} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}