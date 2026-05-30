"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { GridSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { tmdbService } from "@/api/tmdb";
import { Tv, SlidersHorizontal } from "lucide-react";
import { TVShow, Genre } from "@/types/tmdb";

const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity.desc" },
  { label: "Rating", value: "vote_average.desc" },
  { label: "Newest", value: "first_air_date.desc" },
  { label: "Title A‑Z", value: "name.asc" },
];

export default function TVPage() {
  const [shows, setShows] = useState<TVShow[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch genres
  useEffect(() => {
    tmdbService.getTVGenres().then(setGenres);
  }, []);

  // Reset when filters change
  useEffect(() => {
    setShows([]);
    setPage(1);
    setHasMore(true);
  }, [sort, selectedGenre]);

  const fetchShows = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params: any = { sort_by: sort, page };
      if (selectedGenre) params.with_genres = selectedGenre;

      const data = await tmdbService.discoverTVShows(params);
      setShows((prev) => [...prev, ...data.results]);
      setHasMore(page < data.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, sort, selectedGenre]);

  useEffect(() => {
    fetchShows();
  }, [page, sort, selectedGenre]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loading]);

  return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="container-premium py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <Tv size={32} className="text-amber-500" />
            <h1 className="text-4xl font-black tracking-tighter text-white">
              TV Shows
            </h1>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedGenre
                    ? "bg-amber-500 text-black"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                All
              </button>
              {genres.slice(0, 10).map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedGenre === genre.id
                      ? "bg-amber-500 text-black"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
              <SlidersHorizontal size={16} className="text-zinc-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-white text-sm font-medium outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {shows.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {shows.map((show, index) => (
              <MovieCard key={show.id} media={show} isTV index={index} />
            ))}
          </motion.div>
        )}

        {loading && <GridSkeleton count={8} />}

        <div ref={observerTarget} className="h-4 mt-8" />
      </div>

      <footer className="border-t border-white/10 py-8">
        <div className="container-premium text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} AdwaFlix. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}