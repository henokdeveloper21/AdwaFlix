import { NextResponse } from 'next/server';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwastream.xyz';

  const robots = `# AdwaFlix Robots
User-agent: *
Allow: /
Disallow: /api/
Disallow: /player

Sitemap: ${siteUrl}/sitemap.xml
Host: ${siteUrl}
`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}