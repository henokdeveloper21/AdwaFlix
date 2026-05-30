import { create } from 'zustand';
import { Movie, TVShow, MediaDetail } from '@/types/tmdb';

interface AppStore {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Watchlist
  watchlist: (Movie | TVShow)[];
  addToWatchlist: (item: Movie | TVShow) => void;
  removeFromWatchlist: (id: number) => void;
  isInWatchlist: (id: number) => boolean;

  // Favorites
  favorites: (Movie | TVShow)[];
  addToFavorites: (item: Movie | TVShow) => void;
  removeFromFavorites: (id: number) => void;
  // Alias for convenience (used in pages)
  removeFavorites: (id: number) => void;
  isInFavorites: (id: number) => boolean;

  // Watch History
  history: MediaDetail[];
  addToHistory: (item: MediaDetail) => void;
  clearHistory: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Load from localStorage
  initializeStore: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  watchlist: [],
  addToWatchlist: (item) =>
    set((state) => {
      if (!state.watchlist.find((w) => w.id === item.id)) {
        const updated = [...state.watchlist, item];
        localStorage.setItem('watchlist', JSON.stringify(updated));
        return { watchlist: updated };
      }
      return state;
    }),
  removeFromWatchlist: (id) =>
    set((state) => {
      const updated = state.watchlist.filter((w) => w.id !== id);
      localStorage.setItem('watchlist', JSON.stringify(updated));
      return { watchlist: updated };
    }),
  isInWatchlist: (id) => get().watchlist.some((w) => w.id === id),

  favorites: [],
  addToFavorites: (item) =>
    set((state) => {
      if (!state.favorites.find((f) => f.id === item.id)) {
        const updated = [...state.favorites, item];
        localStorage.setItem('favorites', JSON.stringify(updated));
        return { favorites: updated };
      }
      return state;
    }),
  removeFromFavorites: (id) =>
    set((state) => {
      const updated = state.favorites.filter((f) => f.id !== id);
      localStorage.setItem('favorites', JSON.stringify(updated));
      return { favorites: updated };
    }),
  // Alias – same as removeFromFavorites
  removeFavorites: (id) => get().removeFromFavorites(id),
  isInFavorites: (id) => get().favorites.some((f) => f.id === id),

  history: [],
  addToHistory: (item) =>
    set((state) => {
      const filtered = state.history.filter((h) => h.id !== item.id);
      const updated = [item, ...filtered].slice(0, 100);
      localStorage.setItem('history', JSON.stringify(updated));
      return { history: updated };
    }),
  clearHistory: () => {
    localStorage.removeItem('history');
    set({ history: [] });
  },

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  initializeStore: () => {
    if (typeof window !== 'undefined') {
      const watchlist = localStorage.getItem('watchlist');
      const favorites = localStorage.getItem('favorites');
      const history = localStorage.getItem('history');

      set({
        watchlist: watchlist ? JSON.parse(watchlist) : [],
        favorites: favorites ? JSON.parse(favorites) : [],
        history: history ? JSON.parse(history) : [],
      });
    }
  },
}));