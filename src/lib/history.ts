/**
 * Watch History & Statistics Manager
 * Tracks playback, user preferences, and viewing analytics
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlaybackSession {
  id: string;
  contentId: string;
  contentTitle: string;
  contentType: 'movie' | 'tv';
  timestamp: Date;
  duration: number;
  currentTime: number;
  progress: number; // 0-100
  quality: string;
  provider: string;
  subtitlesUsed: string[];
  deviceInfo: {
    os: string;
    browser: string;
    screenSize: string;
  };
}

export interface ViewerStats {
  totalWatchTime: number; // minutes
  totalMovies: number;
  totalTVShows: number;
  mostWatchedGenre: string;
  averageQuality: string;
  favoriteProviders: string[];
  totalDownloads: number;
  downloadedSize: number; // bytes
}

interface HistoryStore {
  sessions: PlaybackSession[];
  stats: ViewerStats;
  favorites: Set<string>;
  watchlist: Set<string>;

  // Session tracking
  addSession: (session: PlaybackSession) => void;
  getSessionHistory: (limit?: number) => PlaybackSession[];
  removeSession: (sessionId: string) => void;
  clearHistory: () => void;
  
  // Stats
  getStats: () => ViewerStats;
  updateStats: () => void;

  // Favorites & Wishlist
  addToFavorites: (contentId: string) => void;
  removeFromFavorites: (contentId: string) => void;
  isFavorited: (contentId: string) => boolean;

  addToWatchlist: (contentId: string) => void;
  removeFromWatchlist: (contentId: string) => void;
  isInWatchlist: (contentId: string) => boolean;

  // Export data
  exportData: () => string;
  importData: (data: string) => void;
}

export const useHistory = create<HistoryStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      stats: {
        totalWatchTime: 0,
        totalMovies: 0,
        totalTVShows: 0,
        mostWatchedGenre: 'Unknown',
        averageQuality: '720p',
        favoriteProviders: [],
        totalDownloads: 0,
        downloadedSize: 0
      },
      favorites: new Set(),
      watchlist: new Set(),

      addSession: (session) => {
        set(state => ({
          sessions: [session, ...state.sessions].slice(0, 1000) // Keep last 1000
        }));
        get().updateStats();
      },

      getSessionHistory: (limit = 50) => {
        return get().sessions.slice(0, limit);
      },

      removeSession: (sessionId) => {
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== sessionId)
        }));
      },

      clearHistory: () => {
        set({
          sessions: [],
          stats: {
            totalWatchTime: 0,
            totalMovies: 0,
            totalTVShows: 0,
            mostWatchedGenre: 'Unknown',
            averageQuality: '720p',
            favoriteProviders: [],
            totalDownloads: 0,
            downloadedSize: 0
          }
        });
      },

      getStats: () => get().stats,

      updateStats: () => {
        const sessions = get().sessions;

        const totalWatchTime = sessions.reduce((sum, s) => sum + s.duration / 60, 0);
        const totalMovies = new Set(
          sessions.filter(s => s.contentType === 'movie').map(s => s.contentId)
        ).size;
        const totalTVShows = new Set(
          sessions.filter(s => s.contentType === 'tv').map(s => s.contentId)
        ).size;

        const providers = sessions.map(s => s.provider);
        const favoriteProviders = [
          ...new Set(providers)
        ].sort(
          (a, b) =>
            providers.filter(p => p === b).length -
            providers.filter(p => p === a).length
        ).slice(0, 3);

        const qualities = sessions.map(s => s.quality);
        const qualityWeights: Record<string, number> = {};
        qualities.forEach(q => {
          qualityWeights[q] = (qualityWeights[q] || 0) + 1;
        });

        const averageQuality =
          Object.entries(qualityWeights).sort((a, b) => b[1] - a[1])[0]?.[0] || '720p';

        set(state => ({
          stats: {
            ...state.stats,
            totalWatchTime: Math.round(totalWatchTime),
            totalMovies,
            totalTVShows,
            averageQuality,
            favoriteProviders
          }
        }));
      },

      addToFavorites: (contentId) => {
        set(state => {
          state.favorites.add(contentId);
          return { favorites: new Set(state.favorites) };
        });
      },

      removeFromFavorites: (contentId) => {
        set(state => {
          state.favorites.delete(contentId);
          return { favorites: new Set(state.favorites) };
        });
      },

      isFavorited: (contentId) => {
        return get().favorites.has(contentId);
      },

      addToWatchlist: (contentId) => {
        set(state => {
          state.watchlist.add(contentId);
          return { watchlist: new Set(state.watchlist) };
        });
      },

      removeFromWatchlist: (contentId) => {
        set(state => {
          state.watchlist.delete(contentId);
          return { watchlist: new Set(state.watchlist) };
        });
      },

      isInWatchlist: (contentId) => {
        return get().watchlist.has(contentId);
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          sessions: state.sessions,
          favorites: Array.from(state.favorites),
          watchlist: Array.from(state.watchlist),
          exportDate: new Date().toISOString()
        }, null, 2);
      },

      importData: (data) => {
        try {
          const imported = JSON.parse(data);
          set({
            sessions: imported.sessions || [],
            favorites: new Set(imported.favorites || []),
            watchlist: new Set(imported.watchlist || [])
          });
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      }
    }),
    {
      name: 'adwaflix-history-store'
    }
  )
);

/**
 * Track playback session
 */
export function trackPlayback(
  contentId: string,
  contentTitle: string,
  contentType: 'movie' | 'tv',
  duration: number,
  currentTime: number,
  quality: string,
  provider: string,
  subtitles: string[] = []
) {
  const session: PlaybackSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    contentId,
    contentTitle,
    contentType,
    timestamp: new Date(),
    duration,
    currentTime,
    progress: Math.round((currentTime / duration) * 100),
    quality,
    provider,
    subtitlesUsed: subtitles,
    deviceInfo: {
      os: getOS(),
      browser: getBrowser(),
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    }
  };

  useHistory.getState().addSession(session);
}

/**
 * Get operating system
 */
function getOS(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'macOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iPhone') > -1) return 'iOS';
  return 'Unknown';
}

/**
 * Get browser name
 */
function getBrowser(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.indexOf('Edg') > -1) return 'Edge';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  return 'Unknown';
}
