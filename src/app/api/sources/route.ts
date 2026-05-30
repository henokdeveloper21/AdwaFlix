import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://henaaklu-cinepro-backend.hf.space';

const FETCH_TIMEOUT_MS = 60000; // 60 seconds – enough for cold starts

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Backend request timed out');
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'movie' | 'tv' | null;
  const id = searchParams.get('id');
  const season = searchParams.get('season') || '1';
  const episode = searchParams.get('episode') || '1';

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
  }

  let backendUrl = '';
  if (type === 'movie') {
    backendUrl = `${BACKEND_URL}/v1/movies/${id}`;
  } else {
    backendUrl = `${BACKEND_URL}/v1/tv/${id}/seasons/${season}/episodes/${episode}`;
  }

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(backendUrl, {}, FETCH_TIMEOUT_MS);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Backend returned ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      const sources = data.sources || data.result?.sources || [];
      const subtitles = data.subtitles || data.result?.subtitles || [];

      // Normalize provider names to strings
      const normalizedSources = sources.map((s: any) => ({
        ...s,
        provider:
          typeof s.provider === 'string'
            ? s.provider
            : s.provider?.name || s.provider?.id || 'Unknown',
      }));

      return NextResponse.json({
        success: true,
        sources: normalizedSources,
        subtitles,
      });
    } catch (error: any) {
      lastError = error;
      console.error(`Backend error (attempt ${attempt + 1}):`, error.message);

      if (attempt < maxRetries - 1) {
        // Wait 2, 4, then 6 seconds before next attempt
        await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  }

  // All attempts failed
  return NextResponse.json(
    {
      error: 'Backend is waking up. Please try again in a few seconds.',
      success: false,
    },
    { status: 500 }
  );
}