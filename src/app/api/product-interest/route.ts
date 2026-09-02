import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  CIRCULAR_WHATSAPP_NUMBER,
  buildCircularProductInterestMessage,
  buildWhatsappUrl,
} from '@/app/lib/product-interest';
import { buildProductSlug } from '@/app/lib/product-slug';
import { isSupabaseConfigured, supabase } from '@/app/lib/supabase';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

type ProductInterestBody = {
  productId?: unknown;
  productSku?: unknown;
  productSlug?: unknown;
};

type ProductInterestProductRow = {
  id: number;
  public_id: string | null;
  sku: string | null;
  name: string | null;
  size: string | null;
  color: string | null;
  owner: number | null;
};

function getTrimmedString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getNumericId(value: unknown) {
  const raw = typeof value === 'number' ? String(value) : getTrimmedString(value);
  if (!raw || !/^\d+$/.test(raw)) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function getRequestOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return new URL(request.url).origin;

  const protocol = request.headers.get('x-forwarded-proto') ?? 'https';
  return `${protocol}://${host}`;
}

function createInterestCode() {
  return `INT-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function toProductSnapshot(
  row: ProductInterestProductRow,
  fallbackSlug: string | null,
  origin: string
) {
  const slug =
    buildProductSlug({
      id: row.id,
      public_id: row.public_id,
      sku: row.sku,
      name: row.name,
    }) ?? fallbackSlug;
  const productUrl = slug ? new URL(`/products/${slug}`, origin).toString() : null;

  return {
    sku: row.sku ?? `PRODUCT-${row.id}`,
    name: row.name,
    size: row.size,
    color: row.color,
    url: productUrl,
    slug,
  };
}

async function findProduct(body: ProductInterestBody) {
  const productId = getNumericId(body.productId);
  const productSku = getTrimmedString(body.productSku);
  const productSlug = getTrimmedString(body.productSlug);
  const select = 'id, public_id, sku, name, size, color, owner';

  if (productId) {
    const { data, error } = await supabase
      .from('products')
      .select(select)
      .eq('id', productId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as ProductInterestProductRow;
  }

  if (productSku) {
    const { data, error } = await supabase
      .from('products')
      .select(select)
      .eq('sku', productSku)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as ProductInterestProductRow;
  }

  if (productSlug) {
    const publicIdMatch = productSlug.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
    );
    const publicId = publicIdMatch?.[1] ?? null;

    if (publicId) {
      const { data, error } = await supabase
        .from('products')
        .select(select)
        .eq('public_id', publicId)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as ProductInterestProductRow;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 503, headers: CACHE_HEADERS }
      );
    }

    const body = (await request.json()) as ProductInterestBody;
    const origin = getRequestOrigin(request);
    const fallbackSlug = getTrimmedString(body.productSlug);
    const product = await findProduct(body);

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    const snapshot = toProductSnapshot(product, fallbackSlug, origin);

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = createInterestCode();
      const whatsappMessage = buildCircularProductInterestMessage({
        code,
        product: snapshot,
      });
      const whatsappUrl =
        buildWhatsappUrl(CIRCULAR_WHATSAPP_NUMBER, whatsappMessage) ??
        `https://wa.me/${CIRCULAR_WHATSAPP_NUMBER}`;

      const { data, error } = await supabase
        .from('product_interest_requests')
        .insert({
          code,
          product_id: product.id,
          product_sku: snapshot.sku,
          product_slug: snapshot.slug,
          product_name: snapshot.name,
          product_size: snapshot.size,
          product_color: snapshot.color,
          seller_id: product.owner,
          status: 'new',
          availability_confirmed: false,
          source: 'product_detail',
          whatsapp_message: whatsappMessage,
        })
        .select('id, code')
        .single();

      if (!error && data) {
        return NextResponse.json(
          { code, whatsappUrl, whatsappMessage },
          { headers: CACHE_HEADERS }
        );
      }

      if (error?.code === '23505') {
        continue;
      }

      console.error('[Product Interest] Insert failed:', error);
      return NextResponse.json(
        {
          error:
            'No se pudo crear la solicitud de contacto. WhatsApp seguirá disponible.',
        },
        { status: 500, headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        error:
          'No se pudo generar un código de contacto. WhatsApp seguirá disponible.',
      },
      { status: 500, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[Product Interest] Unexpected error:', error);
    return NextResponse.json(
      {
        error:
          'No se pudo preparar la solicitud de contacto. WhatsApp seguirá disponible.',
      },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
