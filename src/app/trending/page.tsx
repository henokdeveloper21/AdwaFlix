"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { GridSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { tmdbService } from "@/api/tmdb";
import { TrendingUp, Flame, Film, Tv } from "lucide-react";

export default function TrendingPage() {
  const [trendingAll, setTrendingAll] = useState<any[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [trendingTV, setTrendingTV] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [all, movie, tv] = await Promise.all([
          tmdbService.getTrending("all", "week"),
          tmdbService.getTrending("movie", "week"),
          tmdbService.getTrending("tv", "week"),
        ]);
        setTrendingAll(all.results.filter((item: any) => item.poster_path));
        setTrendingMovies(movie.results);
        setTrendingTV(tv.results);
      } catch (err) {
        setError("Unable to load trending content.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <div className="container-premium pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white flex items-center gap-3">
            <Flame className="text-amber-500 w-10 h-10" />
            Trending
          </h1>
          <p className="text-zinc-400 mt-2">What’s hot right now</p>
        </motion.div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList variant="luxury" className="mb-10">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <TrendingUp size={16} /> All
            </TabsTrigger>
            <TabsTrigger value="movies" className="flex items-center gap-2">
              <Film size={16} /> Movies
            </TabsTrigger>
            <TabsTrigger value="tv" className="flex items-center gap-2">
              <Tv size={16} /> TV Shows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? <GridSkeleton count={12} /> : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {trendingAll.map((item, i) => (
                  <MovieCard key={item.id} media={item} isTV={item.media_type === "tv"} index={i} />
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="movies">
            {loading ? <GridSkeleton count={12} /> : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {trendingMovies.map((movie, i) => (
                  <MovieCard key={movie.id} media={movie} index={i} />
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="tv">
            {loading ? <GridSkeleton count={12} /> : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {trendingTV.map((show, i) => (
                  <MovieCard key={show.id} media={show} isTV index={i} />
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}