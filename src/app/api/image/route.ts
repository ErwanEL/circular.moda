import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const CACHE_MAX_ENTRIES = 200;
const CACHE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds for Cache-Control
const DATA_CACHE_REVALIDATE = 86400 * 7; // 7 days for unstable_cache (shared across instances)

type CacheEntry = {
  body: Buffer;
  contentType: string;
  timestamp: number;
};

/** Serializable shape for unstable_cache (Buffer is not JSON-serializable) */
type CachedImagePayload = {
  bodyBase64: string;
  contentType: string;
};

const memoryCache = new Map<string, CacheEntry>();

function getCacheKey(url: string, w?: number, h?: number): string {
  return [url, w ?? '', h ?? ''].join('|');
}

function pruneCache(): void {
  if (memoryCache.size <= CACHE_MAX_ENTRIES) return;
  const entries = Array.from(memoryCache.entries()).sort(
    (a, b) => a[1].timestamp - b[1].timestamp
  );
  const toDelete = entries.slice(0, memoryCache.size - CACHE_MAX_ENTRIES);
  toDelete.forEach(([key]) => memoryCache.delete(key));
}

function isAllowedSupabaseUrl(url: string): boolean {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return false;
  try {
    const parsed = new URL(url);
    const allowed = new URL(baseUrl);
    return (
      parsed.origin === allowed.origin &&
      parsed.pathname.startsWith('/storage/v1/object/public/')
    );
  } catch {
    return false;
  }
}

/** Fetches from Supabase and optionally resizes; returns serializable payload for unstable_cache */
async function fetchAndProcessImage(
  sourceUrl: string,
  w?: number,
  h?: number
): Promise<CachedImagePayload> {
  const res = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'ModaCircular-ImageProxy/1.0' },
    next: { revalidate: false },
  });

  if (!res.ok) {
    throw new Error(`Upstream returned ${res.status}`);
  }

  let contentType = 'image/jpeg';
  const contentTypeHeader = res.headers.get('content-type');
  if (contentTypeHeader?.startsWith('image/')) {
    contentType = contentTypeHeader.split(';')[0].trim();
  }

  const arrayBuffer = await res.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  if ((w !== undefined && w > 0) || (h !== undefined && h > 0)) {
    try {
      const sharp = (await import('sharp')).default;
      let pipeline = sharp(buffer);
      const width = w && w > 0 ? w : undefined;
      const height = h && h > 0 ? h : undefined;
      if (width ?? height) {
        pipeline = pipeline.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
      buffer = await pipeline.webp({ quality: 85 }).toBuffer();
      contentType = 'image/webp';
    } catch {
      // Keep original buffer and contentType if sharp fails
    }
  }

  return {
    bodyBase64: buffer.toString('base64'),
    contentType,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const encodedUrl = searchParams.get('url');
  const wParam = searchParams.get('w');
  const hParam = searchParams.get('h');

  if (!encodedUrl) {
    return NextResponse.json(
      { error: 'Missing url query parameter' },
      { status: 400 }
    );
  }

  let sourceUrl: string;
  try {
    sourceUrl = decodeURIComponent(encodedUrl);
  } catch {
    return NextResponse.json(
      { error: 'Invalid url encoding' },
      { status: 400 }
    );
  }

  if (!isAllowedSupabaseUrl(sourceUrl)) {
    return NextResponse.json(
      { error: 'URL must be a Supabase storage public object URL' },
      { status: 403 }
    );
  }

  const w = wParam ? parseInt(wParam, 10) : undefined;
  const h = hParam ? parseInt(hParam, 10) : undefined;
  const cacheKey = getCacheKey(sourceUrl, w, h);
  const isDev = process.env.NODE_ENV === 'development';

  // 1. In-memory cache (fast, per-instance)
  const memCached = !isDev ? memoryCache.get(cacheKey) : undefined;
  if (memCached) {
    return new NextResponse(memCached.body, {
      headers: {
        'Content-Type': memCached.contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`,
      },
    });
  }

  // 2. Data cache (shared across serverless instances, reduces Supabase egress)
  const getCachedImage = unstable_cache(
    () => fetchAndProcessImage(sourceUrl, w, h),
    ['image', cacheKey],
    { revalidate: DATA_CACHE_REVALIDATE }
  );

  let payload: CachedImagePayload;
  try {
    payload = await getCachedImage();
  } catch (err) {
    console.error('[image proxy] fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 502 }
    );
  }

  const buffer = Buffer.from(payload.bodyBase64, 'base64');

  if (!isDev) {
    pruneCache();
    memoryCache.set(cacheKey, {
      body: buffer,
      contentType: payload.contentType,
      timestamp: Date.now(),
    });
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': payload.contentType,
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`,
    },
  });
}
