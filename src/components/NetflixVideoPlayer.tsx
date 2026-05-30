"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  ChevronDown,
  Subtitles,
  SkipBack,
  SkipForward,
  Gauge,
  PictureInPicture2,
  Cast,
  Info,
  Loader2,
  ChevronRight,
  FastForward,
  RotateCw,
  Flag,
  Palette,
  AudioLines,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Hls from "hls.js";

// ---------- TYPES ----------
export interface SubtitleTrack {
  url: string;
  label: string;
  lang: string;
}

export interface ProviderSource {
  provider: string;
  url: string;
  quality: string;
  type: "hls" | "dash" | "direct";
}

export interface AudioTrack {
  id: number;
  name: string;
  lang: string;
}

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  subtitles?: SubtitleTrack[];
  sources?: ProviderSource[];
  onSourceChange?: (source: ProviderSource) => void;
  onErrorRetry?: () => Promise<ProviderSource | null>;
  onTimeUpdate?: (time: number) => void;
  onComplete?: () => void;
  resumeTime?: number;
  introEnd?: number;
  creditsStart?: number;
  onProgressSave?: (time: number) => void;
  thumbnailVtt?: string;
  onNextEpisode?: () => void;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  selectedQuality: string;
  selectedSubtitle: string | null; // Changed to match by URL for uniqueness
  selectedAudio: number;
  bufferedProgress: number;
  playbackSpeed: number;
  isPiP: boolean;
}

interface SubtitleStyle {
  fontSize: string;
  color: string;
  background: string;
  textShadow: string;
}

export function NetflixVideoPlayer({
  src,
  title,
  poster,
  subtitles = [],
  sources = [],
  onSourceChange,
  onErrorRetry,
  onTimeUpdate,
  onComplete,
  resumeTime = 0,
  introEnd,
  creditsStart,
  onProgressSave,
  thumbnailVtt,
  onNextEpisode,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const progressSaveIntervalRef = useRef<NodeJS.Timeout>();

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: resumeTime,
    duration: 0,
    volume: 1,
    isMuted: true,
    isFullscreen: false,
    showControls: true,
    selectedQuality: "auto",
    selectedSubtitle: null,
    selectedAudio: -1,
    bufferedProgress: 0,
    playbackSpeed: 1,
    isPiP: false,
  });

  const [menus, setMenus] = useState({
    quality: false,
    subtitle: false,
    subtitleCustomize: false,
    audio: false,
    speed: false,
    settings: false,
    provider: false,
  });

  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontSize: "100%",
    color: "#ffffff",
    background: "rgba(0, 0, 0, 0)",
    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
  });

  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState({
    visible: false,
    x: 0,
    time: 0,
  });

  const [loop, setLoop] = useState(false);
  const [autoNext, setAutoNext] = useState(true);

  const closeMenus = () =>
    setMenus({
      quality: false,
      subtitle: false,
      subtitleCustomize: false,
      audio: false,
      speed: false,
      settings: false,
      provider: false,
    });

  const toggleMenu = (menu: keyof typeof menus) => {
    setMenus((prev) => {
      const newState = { quality: false, subtitle: false, subtitleCustomize: false, audio: false, speed: false, settings: false, provider: false };
      newState[menu] = !prev[menu];
      return newState;
    });
  };

  // ─── Native Subtitle Track Management ─────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force browser to respect exactly the track we chose
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const selectedSub = subtitles.find((s) => s.url === state.selectedSubtitle);
      if (selectedSub && track.label === selectedSub.label) {
        track.mode = "showing";
      } else {
        track.mode = "hidden";
      }
    }
  }, [state.selectedSubtitle, subtitles]);

  // ─── HLS / Native Setup ────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let hls: Hls | null = null;

    const isHls = src.includes(".m3u8") || src.includes("/api/proxy") || src.includes("data=");
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    const initPlayer = () => {
      setIsLoading(false);
      if (resumeTime > 0) video.currentTime = resumeTime;
      video.play().catch(() => {
        setState((prev) => ({ ...prev, isPlaying: false, showControls: true }));
      });
    };

    if (isHls && Hls.isSupported() && !isSafari) {
      hls = new Hls({
        maxMaxBufferLength: 60,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, _data) => {
        initPlayer();
        if (hls && hls.audioTracks) {
          setAudioTracks(
            hls.audioTracks.map((t, index) => ({
              id: index,
              name: t.name,
              lang: t.lang || "Unknown",
            }))
          );
          setState((prev) => ({ ...prev, selectedAudio: hls!.audioTrack }));
        }
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_event, data) => {
        setState((prev) => ({ ...prev, selectedAudio: data.id }));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              handleMediaError();
              break;
          }
        }
      });
    } else {
      video.src = src;
      video.addEventListener("loadedmetadata", initPlayer, { once: true });
    }

    const handleMediaError = () => {
      setError("Stream connection lost. Rerouting to optimal provider...");
      if (onErrorRetry && sources.length > 1) {
        onErrorRetry().then((newSource) => {
          if (newSource && videoRef.current) {
            videoRef.current.src = newSource.url;
            videoRef.current.play().catch(() => {});
            setError(null);
          }
        });
      } else {
        setIsLoading(false);
        setError("Playback failed. Please select an alternative source.");
      }
    };

    video.addEventListener("error", handleMediaError);

    return () => {
      video.removeEventListener("error", handleMediaError);
      if (hls) hls.destroy();
    };
  }, [src, sources.length, onErrorRetry, resumeTime]);

  // ─── Video Event Listeners ────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdateEvent = () => {
      setState((prev) => ({ ...prev, currentTime: video.currentTime }));
      onTimeUpdate?.(video.currentTime);
    };

    const onDurationChange = () => setState((prev) => ({ ...prev, duration: video.duration }));
    const onPlay = () => setState((prev) => ({ ...prev, isPlaying: true }));
    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false }));
    const onEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      onComplete?.();
      if (autoNext && onNextEpisode) {
        setTimeout(() => onNextEpisode(), 2000);
      }
    };

    const onProgressEvent = () => {
      if (video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        setState((prev) => ({
          ...prev,
          bufferedProgress: (end / video.duration) * 100,
        }));
      }
    };

    video.addEventListener("timeupdate", onTimeUpdateEvent);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("progress", onProgressEvent);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("waiting", () => setIsLoading(true));
    video.addEventListener("playing", () => setIsLoading(false));

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdateEvent);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("progress", onProgressEvent);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("waiting", () => setIsLoading(true));
      video.removeEventListener("playing", () => setIsLoading(false));
    };
  }, [onTimeUpdate, onComplete, autoNext, onNextEpisode]);

  // ─── Continue Watching Progress Saving ────────────────
  useEffect(() => {
    if (!onProgressSave) return;
    progressSaveIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        onProgressSave(video.currentTime);
      }
    }, 5000);
    return () => clearInterval(progressSaveIntervalRef.current);
  }, [onProgressSave]);

  // ─── Auto‑hide Controls ───────────────────────────────
  const resetControlsTimeout = useCallback(() => {
    setState((prev) => ({ ...prev, showControls: true }));
    clearTimeout(controlsTimeoutRef.current);
    if (state.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, showControls: false }));
        closeMenus();
      }, 3500);
    }
  }, [state.isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [state.isPlaying, resetControlsTimeout]);

  // ─── Core Controls ─────────────────────────────────────
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  }, []);

  const setVolumeLevel = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, value));
    video.volume = clamped;
    setState((prev) => ({ ...prev, volume: clamped, isMuted: clamped === 0 }));
  };

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !state.isMuted;
    if (!video.muted && state.volume === 0) video.volume = 1;
    setState((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
      volume: video.muted ? 0 : state.volume || 1,
    }));
  }, [state.isMuted, state.volume]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setState((prev) => ({ ...prev, isFullscreen: true }));
      } else {
        await document.exitFullscreen();
        setState((prev) => ({ ...prev, isFullscreen: false }));
      }
    } catch {}
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setState((prev) => ({ ...prev, isPiP: false }));
      } else {
        await video.requestPictureInPicture();
        setState((prev) => ({ ...prev, isPiP: true }));
      }
    } catch {}
  }, []);

  const toggleSubtitles = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedSubtitle: prev.selectedSubtitle ? null : subtitles[0]?.url || null,
    }));
  }, [subtitles]);

  const changeQuality = useCallback(
    (qualityLabel: string) => {
      setState((prev) => ({ ...prev, selectedQuality: qualityLabel }));
      const hls = hlsRef.current;
      if (hls && qualityLabel !== "auto") {
        const height = parseInt(qualityLabel);
        if (!isNaN(height)) {
          const levelIndex = hls.levels.findIndex((level) => level.height === height);
          if (levelIndex >= 0) hls.currentLevel = levelIndex;
        }
      } else if (hls) {
        hls.currentLevel = -1; // auto
      }
      setMenus((prev) => ({ ...prev, quality: false }));
    },
    []
  );

  const changeAudio = useCallback((id: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = id;
    }
    setState((prev) => ({ ...prev, selectedAudio: id }));
    setMenus((prev) => ({ ...prev, audio: false }));
  }, []);

  const changePlaybackSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = speed;
    setState((prev) => ({ ...prev, playbackSpeed: speed }));
    setMenus((prev) => ({ ...prev, speed: false }));
  }, []);

  const skipIntro = () => {
    if (introEnd && videoRef.current) videoRef.current.currentTime = introEnd;
  };
  const skipCredits = () => {
    if (creditsStart && videoRef.current) videoRef.current.currentTime = creditsStart;
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  };

  // ─── Keyboard Shortcuts ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "f") toggleFullscreen();
      else if (e.key === "m") toggleMute();
      else if (e.key === "ArrowRight") skip(10);
      else if (e.key === "ArrowLeft") skip(-10);
      else if (e.key === "ArrowUp") setVolumeLevel(Math.min(state.volume + 0.1, 1));
      else if (e.key === "ArrowDown") setVolumeLevel(Math.max(state.volume - 0.1, 0));
      else if (e.key === "c") toggleSubtitles();
      else if (e.key === "p") togglePiP();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.volume, togglePlayPause, toggleFullscreen, toggleMute, skip, setVolumeLevel, toggleSubtitles, togglePiP]);

  // ─── Media Session API ────────────────────────────────
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: "AdwaFlix",
      artwork: poster ? [{ src: poster, sizes: "512x512", type: "image/jpeg" }] : [],
    });
    navigator.mediaSession.setActionHandler("play", togglePlayPause);
    navigator.mediaSession.setActionHandler("pause", togglePlayPause);
    navigator.mediaSession.setActionHandler("seekforward", () => skip(10));
    navigator.mediaSession.setActionHandler("seekbackward", () => skip(-10));
  }, [title, poster, togglePlayPause, skip]);

  // ─── Double Tap to Seek ────
  const [tapTimestamp, setTapTimestamp] = useState(0);
  const handleVideoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - tapTimestamp < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      skip(x < rect.width / 2 ? -10 : 10);
    } else {
      togglePlayPause();
    }
    setTapTimestamp(now);
  };

  // Quality levels from HLS manifest
  const availableQualities = useMemo(() => {
    const hls = hlsRef.current;
    if (!hls || !hls.levels || hls.levels.length === 0) return ["Auto", "1080p", "720p", "480p", "360p"];
    const heights = hls.levels.map((level) => level.height).filter(Boolean);
    const unique = [...new Set(heights)].sort((a, b) => b - a);
    if (unique.length === 0) return ["Auto"];
    return ["Auto", ...unique.map((h) => `${h}p`)];
  }, [hlsRef.current]);

  const showNextEpisode = onNextEpisode && state.duration > 0 && state.currentTime > state.duration - 30;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-[#050505] group overflow-hidden select-none font-sans",
        state.isFullscreen
          ? "h-screen rounded-none"
          : "aspect-video max-h-[85vh] rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-white/5"
      )}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => state.isPlaying && setState((prev) => ({ ...prev, showControls: false }))}
    >
      {/* Dynamic Subtitle Styles Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
          video::-webkit-media-text-track-display {
            overflow: visible !important;
            -webkit-box-sizing: border-box;
          }
          video::cue {
            font-size: ${subtitleStyle.fontSize};
            color: ${subtitleStyle.color};
            background-color: ${subtitleStyle.background};
            text-shadow: ${subtitleStyle.textShadow};
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-weight: 500;
            line-height: normal;
          }
        `
      }} />

      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        onClick={handleVideoClick}
        loop={loop}
      >
        {/* Render all subtitle tracks so the browser has access to them */}
        {subtitles.map((sub) => (
          <track 
            key={sub.url} 
            src={sub.url} 
            kind="subtitles" 
            label={sub.label} 
            srcLang={sub.lang} 
          />
        ))}
      </video>

      {/* AdwaFlix Ultra-Luxury Premium Header */}
      <AnimatePresence>
        {state.showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-6 md:left-8 z-20 pointer-events-none"
          >
            <div className="flex items-center gap-3 drop-shadow-2xl">
              <h1 className="text-2xl md:text-3xl font-black tracking-widest uppercase">
                <span className="bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(191,149,63,0.4)]">
                  ADWA
                </span>
                <span className="text-white/90 font-light drop-shadow-md">FLIX</span>
              </h1>
              <div className="px-2 py-0.5 rounded bg-black/40 border border-[#BF953F]/30 backdrop-blur-md shadow-[0_0_10px_rgba(191,149,63,0.1)]">
                <span className="text-[9px] md:text-[10px] font-bold text-[#BF953F] tracking-[0.2em] uppercase">Premium</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
          >
            <Loader2 className="animate-spin text-[#BF953F]" size={48} strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl z-20">
          <div className="p-6 max-w-md text-center border border-white/10 rounded-2xl">
            <Info className="mx-auto text-red-400 mb-2" size={24} />
            <p className="text-white text-sm mb-3">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-white border border-white/20">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Next Episode Overlay */}
      {showNextEpisode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-24 right-6 z-30"
        >
          <Button
            size="lg"
            className="rounded-full bg-[#BF953F]/90 hover:bg-[#BF953F] text-black gap-2 font-bold shadow-[0_0_15px_rgba(191,149,63,0.4)]"
            onClick={onNextEpisode}
          >
            Next Episode <FastForward size={18} />
          </Button>
        </motion.div>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {state.showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-8 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none"
          >
            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
              {/* Added padding top so title doesn't overlap the new Header */}
              <h3 className="text-white font-medium text-lg md:text-xl drop-shadow-md tracking-wide line-clamp-1 max-w-[50%] mt-12 md:mt-14">
                {title}
              </h3>

              <div className="flex items-center gap-2 md:gap-3 mt-4 md:mt-2">
                {introEnd && state.currentTime > 0 && state.currentTime < introEnd && (
                  <Button variant="ghost" size="sm" className="rounded-full text-white bg-white/10 hover:bg-white/20 border border-white/10" onClick={skipIntro}>
                    Skip Intro <ChevronRight size={14} className="ml-1" />
                  </Button>
                )}
                {creditsStart && state.currentTime > creditsStart && (
                  <Button variant="ghost" size="sm" className="rounded-full text-white bg-white/10 hover:bg-white/20 border border-white/10" onClick={skipCredits}>
                    Skip Credits <ChevronRight size={14} className="ml-1" />
                  </Button>
                )}

                {sources.length > 1 && (
                  <div className="relative">
                    <Button variant="ghost" className="text-white hover:text-[#BF953F] hover:bg-white/10 rounded-full h-10 w-10 p-0" onClick={() => toggleMenu("provider")}>
                      <Cast size={20} />
                    </Button>
                    {menus.provider && (
                      <div className="absolute top-full right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[180px] shadow-2xl z-30">
                        {sources.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              onSourceChange?.(s);
                              closeMenus();
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#BF953F]/20 rounded-lg text-white text-sm flex justify-between transition-colors items-center"
                          >
                            <span className="font-medium">{s.provider}</span>
                            <span className="text-[#BF953F] text-xs font-semibold px-2 py-0.5 bg-[#BF953F]/10 rounded">{s.quality}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button variant="ghost" className="text-white hover:text-[#BF953F] hover:bg-white/10 rounded-full h-10 w-10 p-0" onClick={() => toggleMenu("settings")}>
                  <Settings size={20} />
                </Button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-4 pointer-events-auto w-full">
              {/* Progress Bar with Thumbnail Preview */}
              <div
                className="relative w-full h-1.5 bg-white/20 rounded-full cursor-pointer group/progress transition-all hover:h-2.5"
                onMouseMove={(e) => {
                  if (!thumbnailVtt) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  setThumbnailPreview({ visible: true, x, time: (x / rect.width) * state.duration });
                }}
                onMouseLeave={() => setThumbnailPreview((prev) => ({ ...prev, visible: false }))}
              >
                <div className="absolute h-full bg-white/40 rounded-full transition-all" style={{ width: `${state.bufferedProgress}%` }} />
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_12px_rgba(191,149,63,0.6)] transition-all"
                  style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ left: `calc(${(state.currentTime / state.duration) * 100}% - 8px)` }}
                />
                <input
                  type="range"
                  min="0"
                  max={state.duration || 1}
                  value={state.currentTime}
                  onChange={(e) => {
                    if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {thumbnailPreview.visible && thumbnailVtt && (
                  <div
                    className="absolute bottom-6 left-0 -translate-x-1/2 bg-[#050505] border border-white/10 rounded-lg p-1.5 shadow-2xl pointer-events-none"
                    style={{ left: thumbnailPreview.x }}
                  >
                    <img src={`${thumbnailVtt}#t=${Math.floor(thumbnailPreview.time)}`} alt="preview" className="w-36 rounded" />
                    <p className="text-white text-xs text-center mt-1.5 font-medium">{formatTime(thumbnailPreview.time)}</p>
                  </div>
                )}
              </div>

              {/* Control Buttons Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 md:gap-3">
                  <Button variant="ghost" onClick={togglePlayPause} className="text-white hover:text-[#BF953F] p-2 hover:bg-transparent transition-transform hover:scale-110">
                    {state.isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                  </Button>
                  <Button variant="ghost" onClick={() => skip(-10)} className="text-white/80 hover:text-white p-2 hover:bg-transparent">
                    <SkipBack size={22} />
                  </Button>
                  <Button variant="ghost" onClick={() => skip(10)} className="text-white/80 hover:text-white p-2 hover:bg-transparent">
                    <SkipForward size={22} />
                  </Button>

                  <div className="flex items-center gap-2 group/volume ml-1 md:ml-3">
                    <Button variant="ghost" onClick={toggleMute} className="text-white/80 hover:text-white p-2 hover:bg-transparent">
                      {state.isMuted || state.volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={state.volume}
                      onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                      className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 rounded-full appearance-none accent-[#BF953F] cursor-pointer"
                    />
                  </div>

                  <span className="text-white/80 text-sm font-medium tracking-wide ml-2 hidden sm:block">
                    {formatTime(state.currentTime)} <span className="opacity-50 mx-1">/</span> {formatTime(state.duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                  
                  {/* Audio Tracks Menu */}
                  {audioTracks.length > 1 && (
                     <div className="relative">
                     <Button
                       variant="ghost"
                       onClick={() => toggleMenu("audio")}
                       className={cn("p-2 hover:bg-transparent transition-colors", menus.audio ? "text-[#BF953F]" : "text-white/80 hover:text-white")}
                     >
                       <AudioLines size={22} />
                     </Button>
                     {menus.audio && (
                       <div className="absolute bottom-full right-0 mb-4 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[160px] z-30 shadow-2xl">
                         <div className="text-zinc-400 text-xs px-4 py-1 mb-1 font-semibold uppercase tracking-wider">Audio Tracks</div>
                         {audioTracks.map((track) => (
                           <button
                             key={track.id}
                             onClick={() => changeAudio(track.id)}
                             className={cn(
                               "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
                               state.selectedAudio === track.id ? "bg-[#BF953F]/20 text-[#BF953F]" : "text-white hover:bg-white/10"
                             )}
                           >
                             {track.name || track.lang}
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                  )}

                  {/* Subtitles Menu */}
                  {subtitles.length > 0 && (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        onClick={() => toggleMenu("subtitle")}
                        className={cn("p-2 hover:bg-transparent transition-colors", state.selectedSubtitle ? "text-[#BF953F]" : "text-white/80 hover:text-white")}
                      >
                        <Subtitles size={22} />
                      </Button>
                      
                      {menus.subtitle && !menus.subtitleCustomize && (
                        <div className="absolute bottom-full right-0 mb-4 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[180px] z-30 shadow-2xl">
                           <div className="text-zinc-400 text-xs px-4 py-1 mb-1 font-semibold uppercase tracking-wider">Subtitles</div>
                          <button
                            onClick={() => { setState((prev) => ({ ...prev, selectedSubtitle: null })); closeMenus(); }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg text-white text-sm"
                          >
                            Off
                          </button>
                          {subtitles.map((sub) => (
                            <button
                              key={sub.url}
                              onClick={() => { setState((prev) => ({ ...prev, selectedSubtitle: sub.url })); closeMenus(); }}
                              className={cn(
                                "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
                                state.selectedSubtitle === sub.url ? "bg-[#BF953F]/20 text-[#BF953F]" : "text-white hover:bg-white/10"
                              )}
                            >
                              {sub.label}
                            </button>
                          ))}
                          <div className="h-[1px] bg-white/10 my-1 mx-2" />
                          <button
                            onClick={() => setMenus(prev => ({...prev, subtitleCustomize: true}))}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg text-zinc-300 text-sm flex items-center justify-between"
                          >
                            Customize <Palette size={14} className="text-zinc-400" />
                          </button>
                        </div>
                      )}

                      {/* Subtitle Customization Sub-menu */}
                      {menus.subtitle && menus.subtitleCustomize && (
                        <div className="absolute bottom-full right-0 mb-4 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 min-w-[240px] z-30 shadow-2xl">
                          <div className="flex items-center gap-2 text-white mb-3">
                             <button onClick={() => setMenus(prev => ({...prev, subtitleCustomize: false}))} className="p-1 hover:bg-white/10 rounded-md">
                                <ChevronLeft size={16} />
                             </button>
                             <span className="text-sm font-semibold">Subtitle Appearance</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                                <span className="text-xs text-zinc-400 mb-1 block">Size</span>
                                <div className="flex gap-1">
                                    {["75%", "100%", "150%", "200%"].map(size => (
                                        <button key={size} onClick={() => setSubtitleStyle(prev => ({...prev, fontSize: size}))} className={cn("flex-1 py-1 rounded text-xs", subtitleStyle.fontSize === size ? "bg-[#BF953F] text-black font-bold" : "bg-white/10 text-white hover:bg-white/20")}>
                                            {size === "75%" ? "S" : size === "100%" ? "M" : size === "150%" ? "L" : "XL"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-xs text-zinc-400 mb-1 block">Color</span>
                                <div className="flex gap-2">
                                    {["#ffffff", "#ffff00", "#00ffff", "#ff00ff"].map(color => (
                                        <button key={color} onClick={() => setSubtitleStyle(prev => ({...prev, color}))} className={cn("w-6 h-6 rounded-full border-2", subtitleStyle.color === color ? "border-[#BF953F] scale-110" : "border-transparent")} style={{ backgroundColor: color }} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-zinc-400 mb-1 block">Background</span>
                                <div className="flex gap-1">
                                    {[{label: 'None', val: 'rgba(0,0,0,0)'}, {label: 'Dark', val: 'rgba(0,0,0,0.5)'}, {label: 'Solid', val: '#000000'}].map(bg => (
                                        <button key={bg.label} onClick={() => setSubtitleStyle(prev => ({...prev, background: bg.val}))} className={cn("flex-1 py-1.5 rounded text-xs", subtitleStyle.background === bg.val ? "bg-[#BF953F] text-black font-bold" : "bg-white/10 text-white hover:bg-white/20")}>
                                            {bg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-zinc-400 mb-1 block">Edge Style</span>
                                <div className="flex gap-1">
                                    {[{label: 'Shadow', val: '2px 2px 4px rgba(0,0,0,0.8)'}, {label: 'Outline', val: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'}, {label: 'None', val: 'none'}].map(edge => (
                                        <button key={edge.label} onClick={() => setSubtitleStyle(prev => ({...prev, textShadow: edge.val}))} className={cn("flex-1 py-1.5 rounded text-xs", subtitleStyle.textShadow === edge.val ? "bg-[#BF953F] text-black font-bold" : "bg-white/10 text-white hover:bg-white/20")}>
                                            {edge.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Playback Speed */}
                  <div className="relative">
                    <Button variant="ghost" onClick={() => toggleMenu("speed")} className="text-white/80 hover:text-white p-2 hover:bg-transparent text-xs font-bold w-10">
                      {state.playbackSpeed}x
                    </Button>
                    {menus.speed && (
                      <div className="absolute bottom-full right-0 mb-4 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[100px] z-30 shadow-2xl">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => changePlaybackSpeed(speed)}
                            className={cn(
                              "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
                              state.playbackSpeed === speed ? "bg-[#BF953F]/20 text-[#BF953F]" : "text-white hover:bg-white/10"
                            )}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quality */}
                  <div className="relative">
                    <Button variant="ghost" onClick={() => toggleMenu("quality")} className="text-white/80 hover:text-white p-2 hover:bg-transparent flex items-center gap-1">
                      <Gauge size={22} />
                      <ChevronDown size={14} className="opacity-70" />
                    </Button>
                    {menus.quality && (
                      <div className="absolute bottom-full right-0 mb-4 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[140px] z-30 shadow-2xl">
                        <div className="text-zinc-400 text-xs px-4 py-1 mb-1">Slow connection? Try 480p</div>
                        {availableQualities.map((quality) => (
                          <button
                            key={quality}
                            onClick={() => changeQuality(quality)}
                            className={cn(
                              "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
                              state.selectedQuality === quality ? "bg-[#BF953F]/20 text-[#BF953F]" : "text-white hover:bg-white/10"
                            )}
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PiP */}
                  <Button variant="ghost" onClick={togglePiP} className="text-white/80 hover:text-white p-2 hover:bg-transparent">
                    <PictureInPicture2 size={22} />
                  </Button>

                  {/* Fullscreen */}
                  <Button variant="ghost" onClick={toggleFullscreen} className="text-white/80 hover:text-white p-2 hover:bg-transparent">
                    {state.isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Menu */}
      <AnimatePresence>
        {menus.settings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-16 right-6 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 min-w-[200px] shadow-2xl"
          >
            <button
              onClick={() => { setLoop(!loop); closeMenus(); }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors",
                loop ? "bg-[#BF953F]/20 text-[#BF953F]" : "text-white hover:bg-white/10"
              )}
            >
              <RotateCw size={16} /> Loop Playback {loop && <span className="ml-auto text-xs">On</span>}
            </button>
            <button
              onClick={() => { setAutoNext(!autoNext); closeMenus(); }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors mt-1",
                autoNext ? "bg-[#BF953F]/20 text-[#BF953F]" : "text-white hover:bg-white/10"
              )}
            >
              <FastForward size={16} /> Auto‑Next {autoNext && <span className="ml-auto text-xs">On</span>}
            </button>
            <div className="h-[1px] bg-white/10 my-2" />
            <button
              onClick={() => { closeMenus(); alert("Thanks for your report!"); }}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm flex items-center gap-3 text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Flag size={16} /> Report Issue
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcut hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/20 text-[10px] pointer-events-none select-none drop-shadow-md">
        Space: Play · F: Full · M: Mute · ←→ Skip · C: Subtitles · P: PiP
      </div>
    </div>
  );
}