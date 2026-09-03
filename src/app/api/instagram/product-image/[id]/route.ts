import { NextRequest, NextResponse } from 'next/server';
import { extractPrimaryImageUrl } from '@/app/lib/instagram-products';
import { isSupabaseConfigured, supabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

const IMAGE_CACHE_MAX_AGE = 60 * 60 * 24 * 7;
const MAX_INSTAGRAM_IMAGE_SIZE = 1440;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProductImageRow = {
  id: string | number;
  name: string | null;
  images: unknown;
};

function parseProductId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function fetchProductImage(productId: number): Promise<ProductImageRow | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, images')
    .eq('id', productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ProductImageRow | null;
}

async function renderInstagramJpeg(sourceUrl: string): Promise<Buffer> {
  const response = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'ModaCircular-InstagramImage/1.0' },
    next: { revalidate: false },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source image (${response.status}).`);
  }

  const sharp = (await import('sharp')).default;
  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  let pipeline = sharp(sourceBuffer);

  try {
    const meta = await sharp(sourceBuffer).metadata();
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
    // If metadata cannot be read, continue with a plain JPEG conversion.
  }

  return pipeline
    .resize(MAX_INSTAGRAM_IMAGE_SIZE, MAX_INSTAGRAM_IMAGE_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured.' },
        { status: 503 }
      );
    }

    const { id: rawId } = await context.params;
    const productId = parseProductId(rawId);
    if (!productId) {
      return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
    }

    const product = await fetchProductImage(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const sourceImageUrl = extractPrimaryImageUrl(product.images);
    if (!sourceImageUrl) {
      return NextResponse.json(
        { error: 'Product has no public image.' },
        { status: 404 }
      );
    }

    const jpeg = await renderInstagramJpeg(sourceImageUrl);

    return new NextResponse(jpeg, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': `public, max-age=${IMAGE_CACHE_MAX_AGE}, s-maxage=${IMAGE_CACHE_MAX_AGE}, stale-while-revalidate=86400`,
      },
    });
  } catch (error) {
    console.error('[instagram-product-image] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to render Instagram image.' },
      { status: 502 }
    );
  }
}
