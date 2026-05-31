// scripts/generate-sitemap.mjs
import { writeFileSync } from 'fs';
import { tmdbService } from '../src/api/tmdb.ts';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwastream.xyz';

async function generate() {
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

  let movieIds = [];
  let tvIds = [];
  try {
    const [moviesRes, tvRes] = await Promise.all([
      tmdbService.getPopularMovies(1),
      tmdbService.getPopularTVShows(1),
    ]);
    movieIds = moviesRes.results.map((m) => m.id);
    tvIds = tvRes.results.map((t) => t.id);
  } catch {}

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(p => `<url><loc>${siteUrl}${p.path}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`).join('\n')}
  ${movieIds.map(id => `<url><loc>${siteUrl}/movies/${id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n')}
  ${tvIds.map(id => `<url><loc>${siteUrl}/tv/${id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`;

  writeFileSync('public/sitemap.xml', sitemap);
  console.log('✅ sitemap.xml generated successfully');
}

generate().catch(console.error);