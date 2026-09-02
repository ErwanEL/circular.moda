import { NextRequest, NextResponse } from 'next/server';
import {
  BOOST_OFFER,
  PREMIUM_OFFER,
  isMonetizationFeature,
  isMonetizationSource,
} from '@/app/lib/monetization-interest';
import { isSupabaseConfigured, supabase } from '@/app/lib/supabase';
import { createClient } from '@/app/lib/supabase/server';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

type MonetizationInterestBody = {
  feature?: unknown;
  source?: unknown;
  productId?: unknown;
  productName?: unknown;
  offerId?: unknown;
  offerTitle?: unknown;
  offerPrice?: unknown;
};

function getTrimmedString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getNumericId(value: unknown) {
  const raw =
    typeof value === 'number' ? String(value) : getTrimmedString(value);
  if (!raw || !/^\d+$/.test(raw)) return null;

  const parsed = Number.parseInt(raw, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 503, headers: CACHE_HEADERS }
      );
    }

    const sessionSupabase = await createClient();
    const {
      data: { user: authUser },
    } = await sessionSupabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: 'Necesitás iniciar sesión para registrar tu interés.' },
        { status: 401, headers: CACHE_HEADERS }
      );
    }

    const body = (await request.json()) as MonetizationInterestBody;

    if (!isMonetizationFeature(body.feature)) {
      return NextResponse.json(
        { error: 'Feature inválida.' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    if (!isMonetizationSource(body.source)) {
      return NextResponse.json(
        { error: 'Origen inválido.' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    const expectedOffer =
      body.feature === 'boost' ? BOOST_OFFER : PREMIUM_OFFER;
    const offerId = getTrimmedString(body.offerId) ?? expectedOffer.id;
    const offerTitle = getTrimmedString(body.offerTitle) ?? expectedOffer.title;
    const offerPrice = getTrimmedString(body.offerPrice) ?? expectedOffer.price;

    if (offerId !== expectedOffer.id) {
      return NextResponse.json(
        { error: 'Oferta inválida.' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id, name, phone')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (sellerError) {
      console.error(
        '[Monetization Interest] Seller lookup failed:',
        sellerError
      );
      return NextResponse.json(
        { error: 'No pudimos identificar tu perfil vendedor.' },
        { status: 500, headers: CACHE_HEADERS }
      );
    }

    const productId = getNumericId(body.productId);
    let productName = getTrimmedString(body.productName);

    if (productId) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, owner')
        .eq('id', productId)
        .maybeSingle();

      if (productError) {
        console.error(
          '[Monetization Interest] Product lookup failed:',
          productError
        );
        return NextResponse.json(
          { error: 'No pudimos verificar la prenda.' },
          { status: 500, headers: CACHE_HEADERS }
        );
      }

      if (!product) {
        return NextResponse.json(
          { error: 'Prenda no encontrada.' },
          { status: 404, headers: CACHE_HEADERS }
        );
      }

      if (seller?.id != null && product.owner !== seller.id) {
        return NextResponse.json(
          {
            error:
              'No podés registrar interés sobre una prenda de otra cuenta.',
          },
          { status: 403, headers: CACHE_HEADERS }
        );
      }

      productName = product.name ?? productName;
    }

    const { data, error } = await supabase
      .from('monetization_interest_requests')
      .insert({
        auth_user_id: authUser.id,
        seller_id: seller?.id ?? null,
        seller_email: authUser.email ?? null,
        seller_name: seller?.name ?? null,
        seller_phone: seller?.phone ?? null,
        feature: body.feature,
        source: body.source,
        offer_id: offerId,
        offer_title: offerTitle,
        offer_price: offerPrice,
        product_id: productId,
        product_name: productName,
        status: 'new',
        metadata: {
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          ip: getClientIp(request),
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Monetization Interest] Insert failed:', error);
      return NextResponse.json(
        {
          error:
            'No pudimos registrar tu interés. Verificá que la tabla Supabase de monetización exista.',
        },
        { status: 500, headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        id: data.id,
        message:
          'Tu interés quedó registrado. Te vamos a contactar pronto cuando esta opción esté disponible.',
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[Monetization Interest] Unexpected error:', error);
    return NextResponse.json(
      {
        error:
          'No pudimos registrar tu interés. Probá de nuevo en unos segundos.',
      },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
