"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { GridSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { tmdbService } from "@/api/tmdb";
import { SlidersHorizontal, Search, RotateCw } from "lucide-react";
import type { Movie, TVShow, Genre } from "@/types/tmdb";

const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity.desc" },
  { label: "Rating", value: "vote_average.desc" },
  { label: "Newest", value: "primary_release_date.desc" },
  { label: "Title A‑Z", value: "original_title.asc" },
];

const LANGUAGE_OPTIONS = [
  { label: "Any", value: "" },
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "Spanish", value: "es" },
  { label: "German", value: "de" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Hindi", value: "hi" },
];

export default function DiscoverPage() {
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [results, setResults] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [runtimeMin, setRuntimeMin] = useState("");
  const [runtimeMax, setRuntimeMax] = useState("");
  const [language, setLanguage] = useState("");

  const fetchGenres = useCallback(async () => {
    const data = mediaType === "movie" ? await tmdbService.getMovieGenres() : await tmdbService.getTVGenres();
    setGenres(data);
  }, [mediaType]);

  useEffect(() => {
    fetchGenres();
  }, [mediaType]);

  const resetFilters = () => {
    setSelectedGenre(null);
    setYearFrom("");
    setYearTo("");
    setRatingMin("");
    setRuntimeMin("");
    setRuntimeMax("");
    setLanguage("");
    setSort(SORT_OPTIONS[0].value);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: any = {
        sort_by: sort,
        page: 1,
      };
      if (selectedGenre) params.with_genres = selectedGenre;
      if (yearFrom) params["primary_release_date.gte"] = `${yearFrom}-01-01`;
      if (yearTo) params["primary_release_date.lte"] = `${yearTo}-12-31`;
      if (ratingMin) params["vote_average.gte"] = ratingMin;
      if (runtimeMin) params["with_runtime.gte"] = parseInt(runtimeMin);
      if (runtimeMax) params["with_runtime.lte"] = parseInt(runtimeMax);
      if (language) params.with_original_language = language;

      const data =
        mediaType === "movie"
          ? await tmdbService.discoverMovies(params)
          : await tmdbService.discoverTVShows(params);
      setResults(data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <div className="container-premium pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white flex items-center gap-3">
            <SlidersHorizontal className="text-amber-500 w-10 h-10" />
            Discover
          </h1>
          <p className="text-zinc-400 mt-2">Fine‑tune your search</p>
        </motion.div>

        {/* Filter Panel */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-12 space-y-6">
          {/* Media Type Tabs */}
          <div className="flex gap-2 bg-white/5 rounded-full p-1 w-fit">
            <button
              onClick={() => setMediaType("movie")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                mediaType === "movie" ? "bg-amber-500 text-black" : "text-white/70 hover:text-white"
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setMediaType("tv")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                mediaType === "tv" ? "bg-amber-500 text-black" : "text-white/70 hover:text-white"
              }`}
            >
              TV Shows
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Genre */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Genre</label>
              <select
                value={selectedGenre || ""}
                onChange={(e) => setSelectedGenre(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50"
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Min Rating</label>
              <input
                type="number" min="0" max="10" step="0.5" value={ratingMin}
                onChange={(e) => setRatingMin(e.target.value)} placeholder="e.g. 7"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Year Range */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">From Year</label>
              <input
                type="number" placeholder="2020" value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">To Year</label>
              <input
                type="number" placeholder="2025" value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Runtime */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Min Runtime (min)</label>
              <input
                type="number" placeholder="90" value={runtimeMin}
                onChange={(e) => setRuntimeMin(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Max Runtime (min)</label>
              <input
                type="number" placeholder="180" value={runtimeMax}
                onChange={(e) => setRuntimeMax(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-end gap-2">
              <Button variant="premium" size="lg" className="w-full h-12 text-base font-semibold" onClick={handleSearch}>
                <Search size={18} className="mr-2" /> Search
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-4" onClick={resetFilters}>
                <RotateCw size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <GridSkeleton count={8} />
        ) : results.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((item, i) => (
              <MovieCard key={item.id} media={item} isTV={mediaType === "tv"} index={i} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 text-zinc-400">No results found. Try adjusting filters.</div>
        )}
      </div>
    </main>
  );
}