"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, X, Search, Heart, Bookmark } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { tmdbService } from "@/api/tmdb";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

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
    setSearchOpen(false);
    setSearchQuery("");
    const href =
      item.media_type === "tv" ? `/tv/${item.id}` : `/movies/${item.id}`;
    router.push(href);
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Movies", href: "/movies" },
    { label: "TV Shows", href: "/tv" },
    { label: "Trending", href: "/trending" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-neutral-950/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex items-center justify-between h-20 md:h-24">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-2xl md:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-red-600"
          >
            ADWAFLIX
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <NavigationMenu variant="luxury" className="hidden md:flex">
          <NavigationMenuList>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    href={item.href}
                    active={isActive}
                    className={
                      isActive ? "text-amber-400" : "text-white/80 hover:text-white"
                    }
                  >
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Search with Autocomplete */}
          <div className="relative flex items-center">
            <AnimatePresence>
              {searchOpen && (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSearchSubmit}
                  className="mr-2 relative"
                >
                  <input
                    type="text"
                    placeholder="Search titles, genres..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    autoFocus
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-full px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 backdrop-blur-md"
                  />
                  {/* Autocomplete dropdown */}
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-12 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3"
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
                              onMouseDown={(e) => e.preventDefault()} // prevent blur
                              onClick={() => handleSuggestionClick(item)}
                              className="w-full flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                            >
                              <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                                {item.poster_path ? (
                                  <img
                                    src={tmdbService.getImageUrl(item.poster_path, "w92")}
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
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                          setShowSuggestions(false);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full text-center text-xs text-zinc-400 hover:text-amber-500 mt-2 py-1"
                      >
                        View all results for "{searchQuery}"
                      </button>
                    </motion.div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
            <Button
              variant="glass"
              size="icon-sm"
              className="rounded-full"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </Button>
          </div>

          <Link href="/favorites">
            <Button variant="glass" size="icon-sm" className="rounded-full">
              <Heart size={18} />
            </Button>
          </Link>
          <Link href="/watchlist">
            <Button variant="glass" size="icon-sm" className="rounded-full">
              <Bookmark size={18} />
            </Button>
          </Link>

          <Avatar glow size="lg" className="cursor-pointer">
            <AvatarImage src="https://ui-avatars.com/api/?name=AdwaFlix&background=random" alt="User" />
            <AvatarFallback>AF</AvatarFallback>
          </Avatar>

          {/* Mobile Menu */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger>
              <Button
                variant="glass"
                size="icon-sm"
                className="md:hidden rounded-full"
                onClick={() => setSheetOpen(true)}
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" variant="glass" className="p-0">
              <div className="flex flex-col gap-6 p-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className="text-xl font-medium text-white/80 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="h-px bg-white/10" />
                <Link
                  href="/favorites"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 text-white/80 hover:text-white"
                >
                  <Heart size={20} /> Favorites
                </Link>
                <Link
                  href="/watchlist"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 text-white/80 hover:text-white"
                >
                  <Bookmark size={20} /> Watchlist
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}