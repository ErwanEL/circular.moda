import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  CIRCULAR_WHATSAPP_NUMBER,
  buildCircularProductInterestMessage,
  buildWhatsappUrl,
} from '@/app/lib/product-interest';
import { normalizeArgentinaPhone } from '@/app/lib/argentina-phone';
import { buildProductSlug } from '@/app/lib/product-slug';
import { isSupabaseConfigured, supabase } from '@/app/lib/supabase';
import {
  findProductInterestSeller,
  maybeNotifyProductSeller,
  type ProductInterestSeller,
} from '@/app/lib/whatsapp-product-interest';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

type ProductInterestBody = {
  productId?: unknown;
  productSku?: unknown;
  productSlug?: unknown;
  buyerName?: unknown;
  buyerPhone?: unknown;
  buyerConsent?: unknown;
  buyerConsentSource?: unknown;
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

type InterestInsertRow = {
  id: number;
  code: string;
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

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; message?: unknown };
  const message =
    typeof candidate.message === 'string' ? candidate.message : '';
  return (
    candidate.code === 'PGRST204' ||
    message.includes('Could not find') ||
    message.includes('column')
  );
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

async function insertInterestRequest(input: {
  code: string;
  product: ProductInterestProductRow;
  snapshot: ReturnType<typeof toProductSnapshot>;
  seller: ProductInterestSeller | null;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerConsent: boolean;
  buyerConsentSource: string | null;
  whatsappMessage: string;
}) {
  const basePayload = {
    code: input.code,
    product_id: input.product.id,
    product_sku: input.snapshot.sku,
    product_slug: input.snapshot.slug,
    product_name: input.snapshot.name,
    product_size: input.snapshot.size,
    product_color: input.snapshot.color,
    seller_id: input.product.owner,
    buyer_name: input.buyerName,
    buyer_phone: input.buyerPhone,
    status: 'new',
    availability_confirmed: false,
    source: 'product_detail',
    whatsapp_message: input.whatsappMessage,
  };

  const extendedPayload = {
    ...basePayload,
    buyer_consent_at: input.buyerConsent ? new Date().toISOString() : null,
    buyer_consent_source: input.buyerConsentSource,
    seller_whatsapp: input.seller?.phone ?? null,
  };

  const firstInsert = await supabase
    .from('product_interest_requests')
    .insert(extendedPayload)
    .select('id, code')
    .single();

  if (!firstInsert.error && firstInsert.data) {
    return firstInsert.data as InterestInsertRow;
  }

  if (!isMissingColumnError(firstInsert.error)) {
    throw firstInsert.error;
  }

  const fallbackInsert = await supabase
    .from('product_interest_requests')
    .insert(basePayload)
    .select('id, code')
    .single();

  if (fallbackInsert.error) throw fallbackInsert.error;
  return fallbackInsert.data as InterestInsertRow;
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
    const buyerFieldsProvided =
      'buyerName' in body || 'buyerPhone' in body || 'buyerConsent' in body;
    const buyerName = getTrimmedString(body.buyerName);
    const rawBuyerPhone = getTrimmedString(body.buyerPhone);
    const buyerPhone = rawBuyerPhone
      ? normalizeArgentinaPhone(rawBuyerPhone)
      : null;
    const buyerConsent = body.buyerConsent === true;
    const buyerConsentSource =
      getTrimmedString(body.buyerConsentSource) ?? 'product_detail_form';

    if (buyerFieldsProvided) {
      if (!buyerName) {
        return NextResponse.json(
          { error: 'Ingresa tu nombre' },
          { status: 400, headers: CACHE_HEADERS }
        );
      }

      if (!buyerPhone) {
        return NextResponse.json(
          { error: 'Ingresa un WhatsApp válido' },
          { status: 400, headers: CACHE_HEADERS }
        );
      }

      if (!buyerConsent) {
        return NextResponse.json(
          { error: 'Confirma que podemos compartir tu contacto con la vendedora' },
          { status: 400, headers: CACHE_HEADERS }
        );
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    const snapshot = toProductSnapshot(product, fallbackSlug, origin);
    const seller = await findProductInterestSeller(product.owner);

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = createInterestCode();
      const whatsappMessage = buildCircularProductInterestMessage({
        code,
        product: snapshot,
        buyerName,
        buyerPhone,
      });
      const whatsappUrl =
        buildWhatsappUrl(CIRCULAR_WHATSAPP_NUMBER, whatsappMessage) ??
        `https://wa.me/${CIRCULAR_WHATSAPP_NUMBER}`;

      try {
        const data = await insertInterestRequest({
          code,
          product,
          snapshot,
          seller,
          buyerName,
          buyerPhone,
          buyerConsent,
          buyerConsentSource,
          whatsappMessage,
        });

        const automation = await maybeNotifyProductSeller({
          requestId: data.id,
          seller,
          buyerName,
          buyerPhone,
          buyerConsent,
          product: snapshot,
        });

        return NextResponse.json(
          {
            code,
            whatsappUrl,
            whatsappMessage,
            automation,
          },
          { headers: CACHE_HEADERS }
        );
      } catch (error) {
        const insertError = error as { code?: string; message?: string };
        if (insertError?.code === '23505') {
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
