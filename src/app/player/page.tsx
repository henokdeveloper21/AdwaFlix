"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { NetflixVideoPlayer } from "@/components/NetflixVideoPlayer";
import type { SubtitleTrack, ProviderSource } from "@/components/NetflixVideoPlayer";

function PlayerContent() {
  const searchParams = useSearchParams();

  const url = searchParams.get("url") || "";
  const title = searchParams.get("title") || "Now Playing";
  const type = searchParams.get("type") as "movie" | "tv" | null;
  const mediaId = searchParams.get("id");
  const season = searchParams.get("season") || "1";
  const episode = searchParams.get("episode") || "1";
  const poster = searchParams.get("poster") || undefined;   // 🆕 poster

  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [sources, setSources] = useState<ProviderSource[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch sources & subtitles from API
  useEffect(() => {
    if (!type || !mediaId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type, id: mediaId, season, episode });
        const res = await fetch(`/api/sources?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setSources(data.sources || []);
          setSubtitles(data.subtitles || []);
        }
      } catch (err) {
        console.error("Failed to load sources/subtitles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type, mediaId, season, episode]);

  // Provider switching
  const handleSourceChange = useCallback(
    (newSource: ProviderSource) => {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("url", newSource.url);
      window.history.replaceState({}, "", `/player?${newParams.toString()}`);
      setPlayerKey((prev) => prev + 1);
    },
    [searchParams]
  );

  const handleErrorRetry = useCallback(async (): Promise<ProviderSource | null> => {
    const currentIndex = sources.findIndex((s) => s.url === url);
    const nextSource = sources[currentIndex + 1];
    if (nextSource) {
      setPlayerKey((prev) => prev + 1);
      return nextSource;
    }
    return null;
  }, [sources, url]);

  const [playerKey, setPlayerKey] = useState(0);

  // 🆕 Enhanced progress saving for Continue Watching
  const handleProgressSave = useCallback(
    (time: number) => {
      if (typeof window !== "undefined") {
        const key = `resume-${title}`;
        const data = {
          title,
          poster: poster || "",           // store poster URL
          mediaId: Number(mediaId) || 0,
          mediaType: type || "movie",
          progress: time,
          timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(data));
      }
    },
    [title, poster, mediaId, type]
  );

  if (!url) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 text-lg">No video URL provided.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="pt-24 px-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-amber-500">Loading streams...</p>
          </div>
        ) : (
          <NetflixVideoPlayer
            key={playerKey}
            src={url}
            title={title}
            poster={poster}
            subtitles={subtitles}
            sources={sources}
            onSourceChange={handleSourceChange}
            onErrorRetry={handleErrorRetry}
            onProgressSave={handleProgressSave}
            onComplete={() => console.log("Video completed")}
          />
        )}
      </div>
    </main>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-amber-500 text-2xl font-bold">Loading player...</div>}>
      <PlayerContent />
    </Suspense>
  );
}