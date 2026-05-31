import { NextResponse } from 'next/server';
import { tmdbService } from '@/api/tmdb';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwastream.xyz';

  // Static pages – always included
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

  // Fetch trending movies and TV shows to generate dynamic URLs
  let movieIds: number[] = [];
  let tvIds: number[] = [];

  try {
    const [moviesRes, tvRes] = await Promise.allSettled([
      tmdbService.getPopularMovies(1),
      tmdbService.getPopularTVShows(1),
    ]);

    if (moviesRes.status === 'fulfilled') {
      movieIds = moviesRes.value.results.map((m: any) => m.id);
    }
    if (tvRes.status === 'fulfilled') {
      tvIds = tvRes.value.results.map((t: any) => t.id);
    }
  } catch {
    // If TMDB fails, we still serve the static pages
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${staticPages
    .map(
      (p) =>
        `<url><loc>${siteUrl}${p.path}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
    )
    .join('')}
  ${movieUrls}
  ${tvUrls}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
    },
  });
}