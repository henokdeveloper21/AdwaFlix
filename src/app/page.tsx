"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Play,
  Zap,
  Download,
  Users,
  TrendingUp,
  ChevronRight,
  Search,
  Tv,
  Film,
  Sparkles,
  Clock,
  Star,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { MovieCard } from "@/components/MovieCard";
import { GoldenPortalHero } from "@/components/GoldenPortalHero";
import { tmdbService } from "@/api/tmdb";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { Movie, TVShow } from "@/types/tmdb";
import { useRouter } from "next/navigation";

// ==============================
// 1. PREMIUM PAGE SKELETON (Liquid Shimmer)
// ==============================
function PremiumPageSkeleton() {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      <div className="h-[100vh] bg-zinc-900 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-shimmer" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 w-48 bg-zinc-800 rounded-full animate-pulse mb-4" />
            <div className="flex gap-4 overflow-hidden">
              {[...Array(6)].map((_, j) => (
                <div
                  key={j}
                  className="w-[180px] md:w-[220px] aspect-[2/3] bg-zinc-800 rounded-2xl animate-pulse shrink-0"
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==============================
// 2. CONTINUE WATCHING CARD
// ==============================
function ContinueWatchingCard({
  title,
  poster,
  progress,
  mediaId,
  mediaType,
}: {
  title: string;
  poster: string;
  progress: number;
  mediaId: number;
  mediaType: string;
}) {
  const router = useRouter();
  const posterUrl = poster
    ? `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL}/w500${poster}`
    : "";

  const handleResume = () => {
    router.push(
      mediaType === "tv" ? `/tv/${mediaId}` : `/movies/${mediaId}`
    );
  };

  return (
    <div className="shrink-0 w-[180px] sm:w-[220px] snap-start relative group cursor-pointer rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shadow-lg hover:border-amber-500/20 transition-all">
      <div className="aspect-[2/3] relative">
        {posterUrl ? (
          <Image
            src={posterUrl}
            fill
            className="object-cover"
            alt={title}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-sm font-medium line-clamp-2">
            {title}
          </p>
          <div className="w-full h-0.5 bg-white/20 rounded-full mt-1 mb-1">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${Math.min(100, (progress / 6000) * 100)}%` }}
            />
          </div>
          <button
            onClick={handleResume}
            className="w-full mt-1 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500 hover:text-black transition-colors"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

// ==============================
// 3. SCROLLABLE ROW (True Horizontal Swiper)
// ==============================
function ScrollableRow({
  title,
  subtitle,
  icon,
  items,
  isTV = false,
  onViewAll,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: (Movie | TVShow)[];
  isTV?: boolean;
  onViewAll?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-16 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3 text-white">
              {icon}
              {title}
            </h2>
            <p className="text-zinc-500 mt-1 text-base font-medium">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onViewAll && (
              <Button
                variant="ghost"
                className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-full px-5 py-2 font-medium text-sm"
                onClick={onViewAll}
              >
                View All <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="relative group">
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-3 shadow-lg hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-3 shadow-lg hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory py-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="shrink-0 w-[160px] sm:w-[200px] md:w-[240px] snap-start"
              >
                <MovieCard media={item} isTV={isTV} index={i} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==============================
// 4. MAIN HOMEPAGE COMPONENT
// ==============================
export default function HomePage() {
  const router = useRouter();
  const [trendingAll, setTrendingAll] = useState<(Movie | TVShow)[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [trendingTV, setTrendingTV] = useState<TVShow[]>([]);
  const [animationMovies, setAnimationMovies] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Search autocomplete state ──────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // ─── Continue Watching ─────────────────────────────────
  const continueWatchingItems = useContinueWatching();

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (value.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSuggestionsLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const data = await tmdbService.searchMulti(value.trim());
          const filtered = data.results
            .filter(
              (item: any) =>
                item.media_type === "movie" || item.media_type === "tv"
            )
            .slice(0, 6);
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        } catch {
          setSuggestions([]);
        } finally {
          setSuggestionsLoading(false);
        }
      }, 350);
    },
    []
  );

  const handleSuggestionClick = (item: any) => {
    setShowSuggestions(false);
    setSearchQuery("");
    const href =
      item.media_type === "tv" ? `/tv/${item.id}` : `/movies/${item.id}`;
    router.push(href);
  };

  // ─── Fetch TMDB data ────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        trending,
        popular,
        tvTrending,
        animation,
        nowPlayingRes,
        upcomingRes,
        topRatedRes,
      ] = await Promise.all([
        tmdbService.getTrending("all", "week"),
        tmdbService.getPopularMovies(),
        tmdbService.getTrendingTVShows("week"),
        tmdbService.discoverMovies({
          with_genres: 16,
          sort_by: "popularity.desc",
        }),
        tmdbService.getNowPlayingMovies(),
        tmdbService.getUpcomingMovies(),
        tmdbService.getTopRatedMovies(),
      ]);

      setTrendingAll(trending.results.slice(0, 20));
      setPopularMovies(popular.results.slice(0, 20));
      setTrendingTV(tvTrending.results.slice(0, 20));
      setAnimationMovies(animation.results.slice(0, 20));
      setNowPlaying(nowPlayingRes.results.slice(0, 20));
      setUpcoming(upcomingRes.results.slice(0, 20));
      setTopRated(topRatedRes.results.slice(0, 20));
    } catch (err) {
      setError("Unable to load content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <PremiumPageSkeleton />;
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <p className="text-zinc-400 text-xl">{error}</p>
        <Button variant="glass" onClick={fetchData} className="ml-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* 1. Golden Portal Hero */}
      {trendingAll.length > 0 && (
        <GoldenPortalHero items={trendingAll} autoPlayInterval={8000} />
      )}

      {/* 2. Glass Search Bar with Live Autocomplete */}
      <section className="relative z-20 -mt-24 px-6">
        <div className="max-w-2xl mx-auto relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                setShowSuggestions(false);
              }
            }}
          >
            <InputGroup
              variant="glass"
              className="h-14 rounded-full px-2 border-white/20 bg-zinc-900/60 backdrop-blur-xl shadow-2xl"
            >
              <InputGroupAddon align="inline-start">
                <Search className="text-amber-500" size={20} />
              </InputGroupAddon>
              <InputGroupInput
                name="search"
                placeholder="Search titles, genres, actors..."
                className="text-lg placeholder:text-zinc-500 border-none focus-visible:ring-0"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() =>
                  suggestions.length > 0 && setShowSuggestions(true)
                }
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <InputGroupAddon align="inline-end">
                <Button
                  variant="glass"
                  size="sm"
                  className="rounded-full border-white/10 hover:bg-amber-500 hover:text-black transition-colors duration-300"
                  type="submit"
                >
                  Search
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </form>

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute top-16 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3"
            >
              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-amber-500"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSuggestionClick(item)}
                      className="w-full flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                        {item.poster_path ? (
                          <img
                            src={tmdbService.getImageUrl(
                              item.poster_path,
                              "w92"
                            )}
                            alt={item.title || item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                            N/A
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium line-clamp-1">
                          {item.title || item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-400 uppercase">
                            {item.media_type === "tv" ? "TV Show" : "Movie"}
                          </span>
                          {item.vote_average > 0 && (
                            <span className="text-xs text-amber-500">
                              ⭐ {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                  setShowSuggestions(false);
                }}
                className="w-full text-center text-xs text-zinc-400 hover:text-amber-500 mt-2 py-1"
              >
                View all results for "{searchQuery}"
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* 2.5 Continue Watching Row */}
      {continueWatchingItems.length > 0 && (
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3 text-white">
                <Play className="text-amber-500 w-7 h-7 fill-amber-500" />{" "}
                Continue Watching
              </h2>
              <p className="text-zinc-500 mt-1 text-base font-medium">
                Pick up where you left off
              </p>
            </div>
            <div className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-4">
              {continueWatchingItems.map((item) => (
                <ContinueWatchingCard
                  key={item.mediaId}
                  title={item.title}
                  poster={item.poster}
                  progress={item.progress}
                  mediaId={item.mediaId}
                  mediaType={item.mediaType}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Feature Cards */}
      <section className="relative z-10 py-24 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            {
              icon: Zap,
              title: "Netflix-Grade Player",
              desc: "Adaptive 4K HDR stream management. DRM‑ready decryption structures.",
            },
            {
              icon: Download,
              title: "Offline Mode",
              desc: "Encrypted background downloads. Pause, resume, and watch locally anytime.",
            },
            {
              icon: Users,
              title: "15+ Providers",
              desc: "Intelligent scraping failover pipelines with automated link synchronization.",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="group"
            >
              <Card className="p-8 bg-zinc-900/30 backdrop-blur-xl border-white/5 hover:border-amber-500/20 transition-all duration-500 rounded-3xl group-hover:-translate-y-1 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                <CardContent className="p-0">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-sm font-medium">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Scrollable Media Rails */}
      {trendingAll.length > 0 && (
        <ScrollableRow
          title="Trending Now"
          subtitle="The most watched cinema this week across all networks."
          icon={<TrendingUp className="text-amber-500 w-7 h-7" />}
          items={trendingAll}
          onViewAll={() => router.push("/trending")}
        />
      )}

      {popularMovies.length > 0 && (
        <ScrollableRow
          title="Popular Movies"
          subtitle="Timeless classics, high-budget blockbusters, and modern hits."
          icon={<Film className="text-amber-500 w-7 h-7" />}
          items={popularMovies}
          onViewAll={() => router.push("/movies")}
        />
      )}

      {trendingTV.length > 0 && (
        <ScrollableRow
          title="Trending TV Shows"
          subtitle="The premium broadcast series everyone is talking about."
          icon={<Tv className="text-amber-500 w-7 h-7" />}
          items={trendingTV}
          isTV
          onViewAll={() => router.push("/tv")}
        />
      )}

      {animationMovies.length > 0 && (
        <ScrollableRow
          title="Animation Masterpieces"
          subtitle="Stunning creative worlds and deep, unforgettable stories."
          icon={<Sparkles className="text-amber-500 w-7 h-7" />}
          items={animationMovies}
          onViewAll={() => router.push("/genre/16")}
        />
      )}

      {nowPlaying.length > 0 && (
        <ScrollableRow
          title="Now Playing"
          subtitle="Fresh updates live in global theaters and streaming setups."
          icon={<Play className="text-amber-500 w-7 h-7 fill-amber-500" />}
          items={nowPlaying}
          onViewAll={() => router.push("/movies")}
        />
      )}

      {upcoming.length > 0 && (
        <ScrollableRow
          title="Coming Soon"
          subtitle="Be the first to track release schedules and future drops."
          icon={<Clock className="text-amber-500 w-7 h-7" />}
          items={upcoming}
          onViewAll={() => router.push("/movies")}
        />
      )}

      {topRated.length > 0 && (
        <ScrollableRow
          title="Top Rated Masterpieces"
          subtitle="Critically acclaimed cinematic history holding premium scores."
          icon={<Star className="text-amber-500 w-7 h-7 fill-amber-500" />}
          items={topRated}
          onViewAll={() => router.push("/movies")}
        />
      )}

      {/* 5. Stats */}
      <section className="relative py-32 border-t border-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { val: "15+", label: "Scraping Engines" },
              { val: "4K HDR", label: "Max Resolution" },
              { val: "50+", label: "Audio Profiles" },
              { val: "9.9/10", label: "User Verdict" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group cursor-default"
              >
                <div className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tighter group-hover:text-amber-500 transition-colors duration-500">
                  {stat.val}
                </div>
                <div className="text-zinc-600 uppercase tracking-[0.2em] text-xs font-bold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="relative py-40 overflow-hidden bg-gradient-to-t from-amber-950/10 to-transparent">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-64 bg-amber-500/5 blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-tight">
              Ready to elevate <br className="hidden md:block" /> your
              streaming?
            </h2>
            <Button
              className="h-20 px-16 rounded-full text-xl font-black bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_40px_rgba(245,158,11,0.35)] hover:from-amber-400 hover:to-amber-500 hover:scale-105 active:scale-95 transition-all duration-300"
              onClick={() => router.push("/movies")}
            >
              Enter ADWAFLIX
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-white/[0.04] py-16 px-6 bg-zinc-950 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col gap-1.5">
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              ADWAFLIX
            </span>
            <p className="text-zinc-600 text-xs font-bold tracking-[0.2em] uppercase">
              Premium Cinematic Experience
            </p>
          </div>
          <div className="text-zinc-700 text-xs font-mono tracking-widest uppercase">
            &copy; {new Date().getFullYear()} ADWAFLIX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}