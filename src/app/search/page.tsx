"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ArrowLeft, X } from "lucide-react";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { GridSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { tmdbService } from "@/api/tmdb";

export default function SearchPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Handle search from URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q") || "";
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, []);

  // Focus input on mount with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await tmdbService.searchMulti(searchQuery);
      const filtered = data.results.filter(
        (item: any) => item.poster_path && (item.title || item.name)
      );
      setResults(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Update URL without full page reload
    const newUrl = value.trim()
      ? `/search?q=${encodeURIComponent(value)}`
      : "/search";
    window.history.replaceState({}, "", newUrl);

    // Debounce search
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => performSearch(value), 500);
    setDebounceTimer(timer);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    window.history.replaceState({}, "", "/search");
    searchInputRef.current?.focus();
  };

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <div className="container-premium pt-28 pb-24">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <InputGroup variant="glass" className="h-16 rounded-2xl px-3">
            <InputGroupAddon align="inline-start">
              <Search className="text-amber-500" size={24} />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              type="text"
              placeholder='Search movies, shows, people... (press "/")'
              value={query}
              onChange={handleInputChange}
              className="text-xl placeholder:text-zinc-500"
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearSearch}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </Button>
              </InputGroupAddon>
            )}
          </InputGroup>
        </motion.div>

        {/* Results Area */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-red-400 font-semibold mb-4">{error}</p>
            <Button variant="glass" onClick={() => performSearch(query)}>
              Retry
            </Button>
          </motion.div>
        )}

        {loading ? (
          <GridSkeleton count={12} />
        ) : query && results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Search size={64} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-400 text-lg">
              No results for "{query}"
            </p>
            <p className="text-zinc-600 mt-2">
              Try a different search term or browse categories
            </p>
          </motion.div>
        ) : (
          results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-zinc-400 text-sm">
                Found {results.length} result
                {results.length !== 1 ? "s" : ""} for "{query}"
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {results.map((item, index) => (
                  <MovieCard
                    key={item.id}
                    media={item}
                    isTV={item.media_type === "tv"}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          )
        )}
      </div>

      <footer className="border-t border-white/10 py-8">
        <div className="container-premium text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} AdwaFlix. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}