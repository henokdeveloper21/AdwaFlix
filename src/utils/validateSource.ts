/**
 * Quickly checks if a stream URL returns video content.
 * We fetch the first few bytes using a Range request.
 * Returns true if the content‑type starts with "video/" or is an HLS playlist.
 */
export async function validateSourceUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      headers: {
        Range: 'bytes=0-1023',   // only need the first 1 KB
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return false;

    const contentType = response.headers.get('content-type') || '';
    const isHls = contentType.includes('application/vnd.apple.mpegurl') ||
                  contentType.includes('application/x-mpegurl') ||
                  url.endsWith('.m3u8');

    // Video types or HLS
    if (contentType.startsWith('video/') || isHls) {
      return true;
    }

    // If content type is not set, check if it's not HTML/plain text
    if (!contentType || contentType.includes('octet-stream')) {
      // peek at the first bytes
      const text = await response.text();
      // If it starts with '<' or '#' it might be HTML or HLS manifest (which starts with #)
      if (text.startsWith('#EXTM3U')) return true;   // HLS manifest
      if (text.startsWith('<')) return false;        // HTML error page
      // could be binary – accept if it's not obvious error
      return text.length > 0;
    }

    return false;
  } catch {
    return false;
  }
}