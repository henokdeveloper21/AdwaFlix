import { NextResponse } from 'next/server';
import { tmdbService } from '@/api/tmdb';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwastream.xyz';

  // Static pages always included
  const staticPages = [
    { path: '', priority: 1.0, changefreq: 'daily' },
    { path: '/movies', priority: 0.9, changefreq: 'daily' },
    { path: '/tv', priority: 0.9, changefreq: 'daily' },
    { path: '/trending', priority: 0.8, changefreq: 'hourly' },
    { path: '/search', priority: 0.6, changefreq: 'weekly' },
    { path: '/discover', priority: 0.7, changefreq: 'weekly' },
    { path: '/favorites', priority: 0.5, changefreq: 'weekly' },
    { path: '/watchlist', priority: 0.5, changefreq: 'weekly' },
  ];

  let movieIds: number[] = [];
  let tvIds: number[] = [];

  // Fetch popular movies & TV with a hard 2‑second timeout
  const fetchWithTimeout = async (fetcher: () => Promise<any>, timeoutMs: number) => {
    try {
      const result = await Promise.race([
        fetcher(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutMs)
        ),
      ]);
      return result;
    } catch {
      return null;
    }
  };

  try {
    const [moviesRes, tvRes] = await Promise.allSettled([
      fetchWithTimeout(() => tmdbService.getPopularMovies(1), 2000),
      fetchWithTimeout(() => tmdbService.getPopularTVShows(1), 2000),
    ]);

    if (moviesRes.status === 'fulfilled' && moviesRes.value) {
      movieIds = moviesRes.value.results.map((m: any) => m.id);
    }
    if (tvRes.status === 'fulfilled' && tvRes.value) {
      tvIds = tvRes.value.results.map((t: any) => t.id);
    }
  } catch {
    // If anything fails, we still serve the static pages
  }

  const movieUrls = movieIds
    .map(
      (id) =>
        `<url><loc>${siteUrl}/movies/${id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    )
    .join('');
  const tvUrls = tvIds
    .map(
      (id) =>
        `<url><loc>${siteUrl}/tv/${id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    )
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (p) =>
        `<url><loc>${siteUrl}${p.path}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
    )
    .join('\n')}
  ${movieUrls}
  ${tvUrls}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      // Cache aggressively – Google can re‑fetch once a day
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}