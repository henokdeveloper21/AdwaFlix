import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const KEY_BASE64 = 'YThmMmExYjVlOWM0NzA4MTRmNmIyYzNhNWQ4ZTdmOWMxYTJiM2M0ZDVlM2Y3YThiOGNhZDFlMmQwYTRkNWM1Yg==';
const SERVERS = [
  'https://uwu.eat-peach.sbs/moviebox',
  'https://usa.eat-peach.sbs/holly',
  'https://usa.eat-peach.sbs/air',
  'https://usa.eat-peach.sbs/multi',
  'https://uwu.eat-peach.sbs/net',
];

const HEADERS = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://peachify.top/',
  Origin: 'https://peachify.top',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

export async function GET(request: NextRequest) {
  const tmdbId = request.nextUrl.searchParams.get('tmdbId');
  const type = request.nextUrl.searchParams.get('type') || 'movie';
  const season = request.nextUrl.searchParams.get('season');
  const episode = request.nextUrl.searchParams.get('episode');

  if (!tmdbId) {
    return NextResponse.json({ error: 'Missing tmdbId' }, { status: 400 });
  }

  try {
    const sources = await fetchPeachifySources(tmdbId, type, season, episode);
    return NextResponse.json({ sources });
  } catch (error: any) {
    console.error('Peachify API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchPeachifySources(
  tmdbId: string,
  type: string,
  season?: string | null,
  episode?: string | null
) {
  const allSources: any[] = [];

  for (const server of SERVERS) {
    const url = buildUrl(server, tmdbId, type, season, episode);
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) continue;
      const body = await res.json();
      let data = body;
      if (body.isEncrypted && body.data) {
        const decrypted = decryptPayload(body.data);
        if (!decrypted) continue;
        data = decrypted;
      }
      const rawSources = data.sources || [];
      const rawSubtitles = data.subtitles || [];
      const parsed = parseSources(rawSources, rawSubtitles);
      allSources.push(...parsed);
    } catch (e) {
      // silent fail
    }
  }
  const seen = new Set<string>();
  return allSources.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

function buildUrl(
  server: string,
  tmdbId: string,
  type: string,
  season?: string | null,
  episode?: string | null
) {
  if (type === 'movie') return `${server}/movie/${tmdbId}`;
  return `${server}/tv/${tmdbId}/${season || '1'}/${episode || '1'}`;
}

// ----- AES-256-GCM decryption using Node.js crypto -----
function decryptPayload(payload: string): any {
  const parts = payload.split('.');
  if (parts.length !== 3) throw new Error('Invalid payload format');
  const iv = base64UrlToBuffer(parts[0]);
  const ciphertext = base64UrlToBuffer(parts[1]);
  const authTag = base64UrlToBuffer(parts[2]);

  // Derive the real key: base64(KEY_BASE64) -> hex string -> bytes
  const hexKey = Buffer.from(KEY_BASE64, 'base64').toString('utf-8');
  const key = hexToBuffer(hexKey);
  if (key.length !== 32) throw new Error('Invalid key length');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf-8'));
}

function base64UrlToBuffer(str: string): Buffer {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';
  return Buffer.from(base64, 'base64');
}

function hexToBuffer(hex: string): Buffer {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
  return Buffer.from(hex, 'hex');
}

function parseSources(rawSources: any[], rawSubtitles: any[]) {
  const sources: any[] = [];
  for (const raw of rawSources) {
    const url = pickString(raw, ['url', 'src', 'file', 'stream', 'streamUrl', 'playbackUrl']);
    if (!url) continue;
    const typeRaw = (pickString(raw, ['type', 'format', 'container']) || '').toLowerCase();
    const isHls = typeRaw.includes('hls') || typeRaw.includes('m3u8') || url.includes('.m3u8');
    const type = isHls ? 'hls' : 'mp4';
    const qualityRaw = pickNumber(raw, ['quality', 'resolution', 'height', 'res']);
    const quality = qualityRaw ? String(qualityRaw) : 'Auto';
    const headers = extractHeaders(raw) || {
      Referer: 'https://peachify.top/',
      Origin: 'https://peachify.top',
      'User-Agent': HEADERS['User-Agent'],
    };
    const subtitles = rawSubtitles.map((sub: any) => ({
      url: pickString(sub, ['url', 'file', 'src']) || '',
      label: pickString(sub, ['label', 'name', 'language']) || 'Unknown',
      format: 'vtt',
    }));
    sources.push({
      url,
      type,
      quality,
      headers,
      subtitles,
      provider: { id: 'peachify', name: 'Peachify' },
    });
  }
  return sources;
}

function pickString(obj: any, keys: string[]): string | null {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
  }
  return null;
}

function pickNumber(obj: any, keys: string[]): number | null {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'number' && isFinite(val)) return val;
    if (typeof val === 'string') {
      const match = val.match(/\d{3,4}/);
      if (match) return parseInt(match[0]);
      const num = Number(val);
      if (isFinite(num)) return num;
    }
  }
  return null;
}

function extractHeaders(raw: any): Record<string, string> | null {
  const obj = raw.headers ?? raw.header ?? raw.requestHeaders ?? raw.httpHeaders;
  if (!obj || typeof obj !== 'object') return null;
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && k) headers[k] = v;
  }
  return Object.keys(headers).length ? headers : null;
}