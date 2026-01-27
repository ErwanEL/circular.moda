import { NextRequest, NextResponse } from 'next/server';
import { getProductBySlug } from '../../lib/products';

const FETCH_TIMEOUT_MS = 10_000; // 10s for crawlers
const CACHE_MAX_AGE = 60 * 60 * 24; // 24h – WhatsApp caches aggressively

/**
 * Proxies the first product image for OG/twitter cards.
 * Crawlers (WhatsApp, Facebook, etc.) hit this URL instead of Supabase Storage
 * to avoid timeouts when the storage URL is slow or unreachable for bots.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://circular.moda';
  const fallbackImageUrl = `${baseUrl}/roommates-fashion-fun_simple_compose.png`;

  if (!slug || slug.trim() === '') {
    return NextResponse.redirect(fallbackImageUrl, 302);
  }

  try {
    const product = await getProductBySlug(slug.trim());
    if (!product?.Images?.length) {
      return NextResponse.redirect(fallbackImageUrl, 302);
    }

    const first = product.Images[0];
    const imageUrl =
      typeof first === 'string' ? first : (first as { url: string }).url;
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return NextResponse.redirect(fallbackImageUrl, 302);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const imageRes = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'facebookexternalhit/1.1; WhatsApp/2.0; Bot (og-image-proxy)',
      },
    });
    clearTimeout(timeoutId);

    if (!imageRes.ok || !imageRes.body) {
      return NextResponse.redirect(fallbackImageUrl, 302);
    }

    const contentType =
      imageRes.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`,
      },
    });
  } catch {
    return NextResponse.redirect(fallbackImageUrl, 302);
  }
}
