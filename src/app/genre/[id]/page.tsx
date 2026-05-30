"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { GridSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { tmdbService } from "@/api/tmdb";
import { Film, Tv, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Movie, TVShow, Genre } from "@/types/tmdb";

export default function GenrePage() {
  const params = useParams<{ id: string }>();
  const genreId = params.id;

  const [genreName, setGenreName] = useState<string>("Genre");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get genre name from the list
        const movieGenres = await tmdbService.getMovieGenres();
        const tvGenres = await tmdbService.getTVGenres();
        const allGenres = [...movieGenres, ...tvGenres];
        const genre = allGenres.find((g) => g.id === parseInt(genreId));
        setGenreName(genre?.name || "Genre");

        // Fetch movies and TV shows by genre
        const [movieData, tvData] = await Promise.all([
          tmdbService.discoverMovies({ with_genres: genreId, sort_by: "popularity.desc" }),
          tmdbService.discoverTVShows({ with_genres: genreId, sort_by: "popularity.desc" }),
        ]);

        setMovies(movieData.results);
        setTVShows(tvData.results);
      } catch (err) {
        setError("Failed to load genre content");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [genreId]);

  if (error) {
    return (
      <main className="min-h-screen bg-black">
        <Header />
        <div className="container-premium py-20 text-center">
          <p className="text-red-400 mb-6">{error}</p>
          <Link href="/">
            <Button variant="glass"><ArrowLeft size={20} /> Back</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <div className="container-premium pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-4">
            <ArrowLeft size={16} className="mr-1" /> Back
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">{genreName}</h1>
        </motion.div>

        <Tabs defaultValue="movies" className="w-full">
          <TabsList variant="luxury" className="mb-10">
            <TabsTrigger value="movies" className="flex items-center gap-2">
              <Film size={16} /> Movies
            </TabsTrigger>
            <TabsTrigger value="tv" className="flex items-center gap-2">
              <Tv size={16} /> TV Shows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movies">
            {loading ? (
              <GridSkeleton count={8} />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {movies.map((movie, i) => (
                  <MovieCard key={movie.id} media={movie} index={i} />
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="tv">
            {loading ? (
              <GridSkeleton count={8} />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tvShows.map((show, i) => (
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