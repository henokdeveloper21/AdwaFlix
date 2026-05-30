"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Plus, Check, Play } from "lucide-react";
import { Movie, TVShow } from "@/types/tmdb";
import { tmdbService } from "@/api/tmdb";
import { useAppStore } from "@/store/appStore";
import { useState } from "react";
import { formatRating, getMediaTitle } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

interface MovieCardProps {
  media: Movie | TVShow;
  isTV?: boolean;
  index?: number;
}

export function MovieCard({ media, isTV = false, index = 0 }: MovieCardProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useAppStore();
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist(media.id));
  const router = useRouter();

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWatchlist) {
      removeFromWatchlist(media.id);
      setInWatchlist(false);
    } else {
      addToWatchlist(media);
      setInWatchlist(true);
    }
  };

  const href = isTV ? `/tv/${media.id}` : `/movies/${media.id}`;
  const imageUrl = tmdbService.getImageUrl(media.poster_path, "w500");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="group relative w-full"
    >
      <HoverCard>
        <HoverCardTrigger>
          <Link href={href} className="block w-full h-full">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-amber-500/5 group-hover:border-white/20"
            >
              <Image
                src={imageUrl}
                alt={getMediaTitle(media)}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
                quality={90}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
              <div className="absolute top-3 right-3 z-20">
                <div className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 border border-white/20">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-bold text-white">
                    {formatRating(media.vote_average)}
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        </HoverCardTrigger>

        <HoverCardContent side="top" align="center" className="w-72 p-0 overflow-hidden">
          <div className="relative aspect-video">
            <Image
              src={tmdbService.getBackdropUrl(media.backdrop_path, "w780")}
              fill
              alt=""
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
          </div>
          <div className="p-4">
            <h4 className="font-bold text-white line-clamp-1">
              {getMediaTitle(media)}
            </h4>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
              <span>{media.vote_average.toFixed(1)} ★</span>
              <span>•</span>
              <span>
                {new Date(
                  ("release_date" in media
                    ? media.release_date
                    : media.first_air_date) || ""
                ).getFullYear()}
              </span>
              <span>•</span>
              <span className="uppercase">{isTV ? "Series" : "Movie"}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
              {media.overview}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="glass"
                size="sm"
                className="flex-1"
                onClick={() => router.push(href)}
              >
                <Play className="w-4 h-4 mr-1 fill-white" /> Play
              </Button>
              <Button
                variant={inWatchlist ? "glass" : "outline"}
                size="sm"
                className="w-10 p-0"
                onClick={handleWatchlist}
              >
                {inWatchlist ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </motion.div>
  );
}