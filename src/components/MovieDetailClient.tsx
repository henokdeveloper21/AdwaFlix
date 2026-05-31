"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  ArrowLeft,
  Heart,
  Check,
  Plus,
  Download,
  Loader2,
  ChevronRight,
  Copy,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LampGlow } from "@/components/LampGlow";
import { MovieCard } from "@/components/MovieCard";
import { HeroBannerSkeleton, Skeleton } from "@/components/Skeleton";
import { tmdbService } from "@/api/tmdb";
import { useAppStore } from "@/store/appStore";
import { useDownload } from "@/hooks/useDownload";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { validateSourceUrl } from "@/utils/validateSource";
import { formatRating, getYearFromDate } from "@/utils/helpers";
import type { Movie } from "@/types/tmdb";

function groupSourcesByProvider(sources: any[]) {
  const grouped: Record<string, any[]> = {};
  sources.forEach((s) => {
    const key =
      typeof s.provider === "string"
        ? s.provider
        : s.provider?.name || s.provider?.id || "Unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });
  return grouped;
}

interface MovieDetailClientProps {
  movieData: any;
  movieId: number;
}

export function MovieDetailClient({ movieData, movieId }: MovieDetailClientProps) {
  const router = useRouter();

  const [inFavorites, setInFavorites] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [similarMovies, setSimilarMovies] = useState<(Movie | any)[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [streamSources, setStreamSources] = useState<any[]>([]);
  const [streamSubtitles, setStreamSubtitles] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const { download, setDownload, startDownload, cancelDownload } = useDownload();
  const { copied, copy } = useCopyToClipboard();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const {
    addToFavorites,
    removeFavorites: removeFromFavorites,
    isInFavorites,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  } = useAppStore();

  // Fetch extra data (trailer, similar) on mount
  useEffect(() => {
    const fetchExtra = async () => {
      try {
        const [videos, similar] = await Promise.all([
          tmdbService.getVideos("movie", movieId),
          tmdbService.getSimilar("movie", movieId),
        ]);

        const trailer = videos.results.find(
          (v: any) => v.type === "Trailer" && v.site === "YouTube"
        );
        setTrailerKey(trailer?.key || null);
        setSimilarMovies(similar.results.slice(0, 8));

        setInFavorites(isInFavorites(movieId));
        setInWatchlist(isInWatchlist(movieId));
      } catch {}
    };
    fetchExtra();
  }, [movieId, isInFavorites, isInWatchlist]);

  const fetchProviderSources = useCallback(async () => {
    if (!movieData) return;
    setProvidersLoading(true);
    setProvidersError(null);
    setValidating(true);
    try {
      const params = new URLSearchParams({
        type: "movie",
        id: movieId.toString(),
        title: movieData.title,
        tmdbId: movieId.toString(),
        imdbId: movieData.imdb_id || "",
      });
      const year = getYearFromDate(movieData.release_date);
      if (year) params.set("year", year.toString());

      const res = await fetch(`/api/sources?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const normalizedSources = (data.sources || []).map((s: any) => ({
        ...s,
        provider:
          typeof s.provider === "string"
            ? s.provider
            : s.provider?.name || s.provider?.id || "Unknown",
      }));

      const validatedSources = await Promise.all(
        normalizedSources.map(async (s: any) => ({
          ...s,
          valid: await validateSourceUrl(s.url),
        }))
      );
      const healthySources = validatedSources.filter((s: any) => s.valid);

      setStreamSources(healthySources);
      setStreamSubtitles(data.subtitles || []);
    } catch (err) {
      setProvidersError("Failed to load providers. Try again.");
    } finally {
      setProvidersLoading(false);
      setValidating(false);
    }
  }, [movieData, movieId]);

  useEffect(() => {
    if (sheetOpen && streamSources.length === 0) {
      fetchProviderSources();
    }
  }, [sheetOpen, fetchProviderSources, streamSources.length]);

  const playSource = (source: any) => {
    const params = new URLSearchParams({
      url: source.url,
      title: movieData.title,
      type: "movie",
      id: movieId.toString(),
      poster: posterUrl,
    });
    router.push(`/player?${params.toString()}`);
  };

  const handleFavorite = () => {
    if (inFavorites) {
      removeFromFavorites(movieId);
      setInFavorites(false);
    } else {
      addToFavorites(movieData);
      setInFavorites(true);
    }
  };

  const handleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(movieId);
      setInWatchlist(false);
    } else {
      addToWatchlist(movieData);
      setInWatchlist(true);
    }
  };

  const groupedProviders = groupSourcesByProvider(streamSources);

  const backdropUrl = movieData
    ? tmdbService.getBackdropUrl(movieData.backdrop_path, "w1280")
    : "";
  const posterUrl = movieData
    ? tmdbService.getImageUrl(movieData.poster_path, "w500")
    : "";

  // Structured data for SEO
  const jsonLd = movieData
    ? {
        "@context": "https://schema.org",
        "@type": "Movie",
        name: movieData.title,
        image: posterUrl,
        description: movieData.overview,
        datePublished: movieData.release_date,
        aggregateRating: movieData.vote_average
          ? {
              "@type": "AggregateRating",
              ratingValue: movieData.vote_average,
              bestRating: 10,
              ratingCount: movieData.vote_count,
            }
          : undefined,
        duration: movieData.runtime ? `PT${movieData.runtime}M` : undefined,
        genre: movieData.genres?.map((g: any) => g.name),
      }
    : null;

  return (
    <main className="min-h-screen bg-black">
      <Header />

      {/* Structured data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <section className="relative pt-20 w-full h-[90vh] min-h-[600px] overflow-hidden">
        <LampGlow />
        <motion.div
          initial={{ scale: 1.05, filter: "brightness(0.8)" }}
          animate={{ scale: 1, filter: "brightness(1)" }}
          transition={{ duration: 20, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={backdropUrl}
            alt={movieData.title}
            fill
            className="object-cover object-top"
            priority
            quality={100}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent w-[70%]" />
      </section>

      <div className="container-premium -mt-64 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
        >
          <div className="md:col-span-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-2xl border border-white/10"
            >
              <Image
                src={posterUrl}
                alt={movieData.title}
                fill
                className="object-cover"
                quality={85}
              />
            </motion.div>

            <div className="mt-6 space-y-3">
              {/* Watch Now – Opens Provider Sheet */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger>
                  <Button
                    variant="premium"
                    size="xl"
                    className="w-full h-14 text-lg font-semibold"
                    onClick={() => setSheetOpen(true)}
                  >
                    <Play className="mr-2 w-5 h-5 fill-white" />
                    Watch Now
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  variant="glass"
                  className="rounded-t-3xl max-h-[70vh] overflow-y-auto"
                >
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">
                        Choose a Provider
                      </h3>
                      {validating && (
                        <div className="flex items-center gap-2 text-amber-500 text-sm">
                          <Loader2 size={16} className="animate-spin" />
                          <span>Verifying streams…</span>
                        </div>
                      )}
                    </div>

                    {providersLoading && !validating && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2
                          className="animate-spin text-amber-500"
                          size={32}
                        />
                        <span className="ml-3 text-zinc-400">
                          Fetching streams...
                        </span>
                      </div>
                    )}

                    {providersError && (
                      <div className="text-center py-4">
                        <p className="text-red-400 mb-2">{providersError}</p>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={fetchProviderSources}
                        >
                          Retry
                        </Button>
                      </div>
                    )}

                    {!providersLoading &&
                      !validating &&
                      !providersError &&
                      streamSources.length === 0 && (
                        <div className="text-center py-4">
                          <Wifi className="mx-auto text-zinc-500 mb-2" size={32} />
                          <p className="text-zinc-400">
                            No playable sources found for this movie.
                          </p>
                          <p className="text-zinc-500 text-xs mt-1">
                            All available streams were unreachable or blocked.
                          </p>
                        </div>
                      )}

                    {/* Provider list with expandable qualities */}
                    {streamSources.length > 0 && (
                      <div className="space-y-3">
                        {Object.entries(groupedProviders).map(
                          ([providerName, sources]) => (
                            <div
                              key={providerName}
                              className="rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-amber-500/20 transition-all"
                            >
                              <button
                                onClick={() =>
                                  setExpandedProvider(
                                    expandedProvider === providerName
                                      ? null
                                      : providerName
                                  )
                                }
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-full bg-amber-500/10">
                                    <ShieldCheck
                                      size={18}
                                      className="text-emerald-400"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold">
                                      {providerName}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                      {sources.length} healthy stream
                                      {sources.length > 1 ? "s" : ""}
                                    </p>
                                  </div>
                                </div>
                                <ChevronRight
                                  size={18}
                                  className={`text-zinc-400 transition-transform duration-200 ${
                                    expandedProvider === providerName
                                      ? "rotate-90"
                                      : ""
                                  }`}
                                />
                              </button>
                              <AnimatePresence>
                                {expandedProvider === providerName && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4 space-y-2">
                                      {sources.map((source, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => playSource(source)}
                                          className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                                            <span className="text-white text-sm font-medium">
                                              {providerName}
                                            </span>
                                          </div>
                                          <span className="text-xs text-zinc-400 bg-white/5 px-2 py-1 rounded-full">
                                            {source.quality || "Auto"}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* ── Download Section ── */}
              {(() => {
                const mp4Source = streamSources.find(
                  (s: any) => s.type === "mp4" || s.type === "direct"
                );
                const bestStream = streamSources[0];

                if (mp4Source) {
                  if (download.status === "idle") {
                    return (
                      <Button
                        variant="glass"
                        size="xl"
                        className="w-full h-14 text-lg font-medium hover:bg-amber-500/20 hover:border-amber-500/30 transition-all"
                        onClick={() => {
                          const filename = `${movieData.title.replace(
                            /[^a-z0-9]/gi,
                            "_"
                          )}.mp4`;
                          startDownload(mp4Source.url, filename);
                        }}
                      >
                        <Download className="mr-2 w-5 h-5" />
                        Download MP4
                      </Button>
                    );
                  }
                  if (download.status === "downloading") {
                    return (
                      <div className="space-y-2 w-full">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">
                            Downloading…
                          </span>
                          <span className="text-amber-500 font-mono">
                            {download.progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${download.progress}%` }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 w-full"
                          onClick={cancelDownload}
                        >
                          Cancel
                        </Button>
                      </div>
                    );
                  }
                  if (download.status === "complete") {
                    return (
                      <div className="text-center text-green-400 text-sm font-medium py-2">
                        ✅ Download complete!
                        <button
                          onClick={() =>
                            setDownload({
                              status: "idle",
                              progress: 0,
                              filename: "",
                            })
                          }
                          className="ml-2 underline text-zinc-400"
                        >
                          Dismiss
                        </button>
                      </div>
                    );
                  }
                  if (download.status === "error") {
                    return (
                      <div className="text-center text-red-400 text-sm py-2">
                        {download.error || "Download failed"}
                        <button
                          onClick={() =>
                            setDownload({
                              status: "idle",
                              progress: 0,
                              filename: "",
                            })
                          }
                          className="ml-2 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    );
                  }
                  return null;
                }

                // No MP4 – show copy URL
                return (
                  <div className="space-y-2 w-full">
                    <Button
                      variant="glass"
                      size="xl"
                      className="w-full h-14 text-lg font-medium opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Download className="mr-2 w-5 h-5" />
                      Download (HLS only – use button below)
                    </Button>
                    {bestStream && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-10 text-sm font-medium border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => copy(bestStream.url)}
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 w-4 h-4" />
                            Copied! Paste into download manager
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 w-4 h-4" />
                            Copy Stream URL (for IDM / JDownloader)
                          </>
                        )}
                      </Button>
                    )}
                    <p className="text-[10px] text-zinc-500 text-center">
                      HLS streams can be downloaded using external tools like
                      IDM or JDownloader
                    </p>
                  </div>
                );
              })()}

              <Button
                variant={inWatchlist ? "glass" : "outline"}
                size="xl"
                className="w-full h-14 text-lg font-medium"
                onClick={handleWatchlist}
              >
                {inWatchlist ? (
                  <>
                    <Check className="mr-2 w-5 h-5" /> In Watchlist
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 w-5 h-5" /> Add to Watchlist
                  </>
                )}
              </Button>

              <Button
                variant={inFavorites ? "glass" : "ghost"}
                size="xl"
                className={`w-full h-14 text-lg font-medium ${
                  inFavorites ? "text-pink-400" : "text-white/70"
                }`}
                onClick={handleFavorite}
              >
                <Heart
                  className={`mr-2 w-5 h-5 ${
                    inFavorites ? "fill-pink-400" : ""
                  }`}
                />
                {inFavorites ? "Favorited" : "Add to Favorites"}
              </Button>
            </div>
          </div>

          <div className="md:col-span-3 space-y-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4 drop-shadow-2xl">
                {movieData.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-amber-500 rounded-full px-4 py-2">
                  <span className="text-lg">⭐</span>
                  <span className="font-bold text-black">
                    {formatRating(movieData.vote_average)}
                  </span>
                </div>
                <span className="text-zinc-400">
                  {getYearFromDate(movieData.release_date)}
                </span>
                <span className="text-zinc-400">{movieData.runtime} min</span>
                <span className="text-zinc-400">
                  {movieData.vote_count.toLocaleString()} votes
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {movieData.genres?.map((genre: any) => (
                <span
                  key={genre.id}
                  className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white text-sm font-medium"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">Overview</h3>
              <p className="text-zinc-300 leading-relaxed text-lg">
                {movieData.overview}
              </p>
            </div>

            {trailerKey && (
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Trailer</h3>
                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src={tmdbService.getTrailerUrl(trailerKey)}
                    title="Trailer"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {movieData.credits?.cast?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Cast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {movieData.credits.cast.slice(0, 8).map((actor: any) => (
                    <HoverCard key={actor.id}>
                      <HoverCardTrigger>
                        <button className="text-left group w-full">
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-white/10">
                            <Avatar className="w-full h-full rounded-none">
                              <AvatarImage
                                src={tmdbService.getProfileUrl(
                                  actor.profile_path,
                                  "w185"
                                )}
                                alt={actor.name}
                              />
                              <AvatarFallback className="text-2xl font-bold">
                                {actor.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                            {actor.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {actor.character}
                          </p>
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="top"
                        align="center"
                        className="w-56 p-3 bg-neutral-900/95 backdrop-blur-xl border border-white/10"
                      >
                        <div className="flex flex-col items-center text-center">
                          <Avatar className="w-16 h-16 mb-2">
                            <AvatarImage
                              src={tmdbService.getProfileUrl(
                                actor.profile_path,
                                "w185"
                              )}
                            />
                            <AvatarFallback>{actor.name[0]}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-bold text-white">
                            {actor.name}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {actor.character}
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {similarMovies.length > 0 && (
          <section className="mt-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-8">
                Similar Movies
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {similarMovies.map((movie, i) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <MovieCard media={movie} index={i} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        )}
      </div>

      <footer className="border-t border-white/10 py-8 mt-20">
        <div className="container-premium text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} AdwaFlix. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}