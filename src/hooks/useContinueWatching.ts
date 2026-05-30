"use client";
import { useEffect, useState } from 'react';

export interface ContinueWatchingItem {
  title: string;
  poster: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  progress: number;
  timestamp: number;
}

export function useContinueWatching() {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);

  useEffect(() => {
    const load = () => {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('resume-'));
      const results: ContinueWatchingItem[] = [];
      for (const key of keys) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          if (data.title && data.mediaId && data.progress > 0) {
            results.push(data as ContinueWatchingItem);
          }
        } catch {}
      }
      results.sort((a, b) => b.timestamp - a.timestamp);
      setItems(results);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  return items;
}