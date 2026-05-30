"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { tmdbService } from "@/api/tmdb";

interface Props {
  item: {
    title: string;
    poster: string;
    mediaId: number;
    mediaType: 'movie' | 'tv';
    progress: number;
  };
}

export function ContinueWatchingCard({ item }: Props) {
  const router = useRouter();
  const posterUrl = item.poster ? tmdbService.getImageUrl(item.poster) : '';

  const handleResume = () => {
    // Navigate to detail page, then auto-open provider? Or just go to detail.
    router.push(item.mediaType === 'tv' ? `/tv/${item.mediaId}` : `/movies/${item.mediaId}`);
  };

  return (
    <div className="shrink-0 w-[200px] sm:w-[240px] snap-start relative group cursor-pointer rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
      <div className="aspect-[2/3] relative">
        {posterUrl ? (
          <Image src={posterUrl} fill className="object-cover" alt={item.title} />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-sm font-medium line-clamp-2">{item.title}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-zinc-400">Progress</span>
            <button
              onClick={handleResume}
              className="p-1.5 rounded-full bg-amber-500 text-black hover:bg-amber-400 transition-colors"
            >
              <Play size={14} fill="currentColor" />
            </button>
          </div>
          <div className="w-full h-0.5 bg-white/20 rounded-full mt-1">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(item.progress / 6000) * 100}%` }} /> {/* dummy percent */}
          </div>
        </div>
      </div>
    </div>
  );
}