import { NextRequest, NextResponse } from 'next/server';

/**
 * Tries to extract the final stream URL and headers from a base64url-encoded
 * data parameter. It can be:
 *   - a JSON string like {"url":"...","headers":{...}}
 *   - a direct URL string
 */
function resolveUrl(data: string): { url: string; headers: Record<string, string> } | null {
  // Try multiple base64 decoding variants
  let decoded = '';
  try {
    decoded = Buffer.from(data, 'base64url').toString('utf-8');
  } catch {
    try {
      decoded = Buffer.from(data, 'base64').toString('utf-8');
    } catch {
      return null;
    }
  }

  if (!decoded) return null;

  // First try JSON
  try {
    const parsed = JSON.parse(decoded);
    if (parsed.url && typeof parsed.url === 'string') {
      return { url: parsed.url, headers: parsed.headers || {} };
    }
  } catch {}

  // If it's not JSON, treat the decoded string itself as a URL
  if (decoded.startsWith('http')) {
    return { url: decoded, headers: {} };
  }

  return null;
}

export async function GET(req: NextRequest) {
  const dataParam = req.nextUrl.searchParams.get('data');
  if (!dataParam) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  try {
    let current = dataParam;
    let url: string | null = null;
    let headers: Record<string, string> = {};
    let depth = 0;
    const maxDepth = 5;

    // Recursively unwrap proxy layers
    while (depth < maxDepth) {
      const resolved = resolveUrl(current);
      if (!resolved) break;

      url = resolved.url;
      headers = { ...headers, ...resolved.headers };

      // Check if the new URL is itself a proxy call
      const isProxy = url.includes('/api/proxy') || url.includes('/v1/proxy');
      if (!isProxy) break;

      // Extract the nested data parameter
      try {
        const parsedUrl = new URL(
          url,
          `http://${req.headers.get('host') || 'localhost'}`
        );
        const nestedData = parsedUrl.searchParams.get('data');
        if (!nestedData) break;
        current = nestedData;
        depth++;
      } catch {
        break;
      }
    }

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid final URL' }, { status: 400 });
    }

    // Fetch the actual stream with the collected headers
    const response = await fetch(url, { headers });
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error.message);
    return NextResponse.json(
      { error: 'Proxy fetch failed', details: error.message },
      { status: 502 }
    );
  }
}