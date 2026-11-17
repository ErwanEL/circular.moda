import { ImageMemoryCache, parseImageSize } from '../../lib/image-proxy-cache';
import { NextRequest, NextResponse } from 'next/server';

// Binary images belong in the CDN, not Next.js's serialized Data Cache.
const CACHE_MAX_AGE = 60 * 60 * 24 * 7;
const imageCache = new ImageMemoryCache(32 * 1024 * 1024, CACHE_MAX_AGE * 1000);

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

/** Fetch and resize only on a CDN and in-process cache miss. */
async function fetchAndProcessImage(
  sourceUrl: string,
  w?: number,
  h?: number
): Promise<{ body: Buffer; contentType: string }> {
  const res = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'ModaCircular-ImageProxy/1.0' },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
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
  let buffer: Buffer = Buffer.from(arrayBuffer);

  if ((w !== undefined && w > 0) || (h !== undefined && h > 0)) {
    try {
      const sharp = (await import('sharp')).default;
      let pipeline = sharp(buffer);
      // Auto-orient only genuinely-sideways photos: a 90°/270° EXIF tag on a
      // landscape-stored image. Portrait images carrying such a tag are already
      // upright (stale tag) and must be left alone.
      try {
        const meta = await sharp(buffer).metadata();
        const orientation = meta.orientation ?? 1;
        const isQuarterTurn = orientation >= 5 && orientation <= 8;
        if (
          isQuarterTurn &&
          typeof meta.width === 'number' &&
          typeof meta.height === 'number' &&
          meta.width > meta.height
        ) {
          pipeline = pipeline.rotate();
        }
      } catch {
        // If metadata can't be read, leave orientation untouched.
      }
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
    body: buffer,
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

  // URLSearchParams already decoded this value. Decoding twice corrupts object names.
  const sourceUrl = encodedUrl;

  if (!isAllowedSupabaseUrl(sourceUrl)) {
    return NextResponse.json(
      { error: 'URL must be a Supabase storage public object URL' },
      { status: 403 }
    );
  }

  const size = parseImageSize(wParam, hParam);
  if (!size) {
    return NextResponse.json(
      { error: 'Unsupported image dimensions' },
      { status: 400 }
    );
  }
  const { w, h } = size;
  // Redirect extraneous query parameters to one CDN key per supported variant.
  const canonical = new URL(request.url);
  canonical.search = new URLSearchParams({ url: sourceUrl }).toString();
  if (w !== undefined) canonical.searchParams.set('w', String(w));
  if (h !== undefined) canonical.searchParams.set('h', String(h));
  if (canonical.search !== new URL(request.url).search) {
    return NextResponse.redirect(canonical, 307);
  }

  try {
    const payload = await imageCache.get(canonical.search, () =>
      fetchAndProcessImage(sourceUrl, w, h)
    );
    return new NextResponse(payload.body, {
      headers: {
        'Content-Type': payload.contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`,
      },
    });
  } catch (err) {
    console.error('[image proxy] fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
