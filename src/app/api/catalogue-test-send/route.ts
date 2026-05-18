import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import {
  NEWSLETTER_PRODUCT_LIMIT,
  buildUnsubscribeUrl,
  mapProductRowToNewsletterProduct,
  normalizeSubscriberEmail,
  renderCatalogueEmail,
  resolveSiteUrl,
  sendBrevoTransactionalEmail,
} from '@/app/lib/catalogue-newsletter';

type ProductQueryRow = {
  id: string | number;
  name: string | null;
  slug: string | null;
  public_id: string | null;
  price: number | string | null;
  size: string | null;
  images: unknown;
  created_at: string;
};

type TestSendRequestBody = {
  email?: string;
  secret?: string;
  subject?: string;
};

const PRODUCT_SELECT =
  'id, name, slug, public_id, price, size, images, created_at';

function getTestSecret(): string {
  const secret =
    process.env.NEWSLETTER_TEST_SECRET ?? process.env.CRON_SECRET ?? '';

  if (secret === '') {
    throw new Error(
      'NEWSLETTER_TEST_SECRET or CRON_SECRET must be configured to use the test send route.'
    );
  }

  return secret;
}

function isAuthorized(providedSecret: string | null): boolean {
  return providedSecret === getTestSecret();
}

async function fetchLatestProducts(): Promise<
  NonNullable<ReturnType<typeof mapProductRowToNewsletterProduct>>[]
> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false })
    .limit(NEWSLETTER_PRODUCT_LIMIT);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProductQueryRow[])
    .map(mapProductRowToNewsletterProduct)
    .filter(
      (product): product is NonNullable<
        ReturnType<typeof mapProductRowToNewsletterProduct>
      > => product != null
    );
}

async function sendTestTemplate(input: {
  email: string;
  request: Request;
  subject?: string;
}) {
  const siteUrl = resolveSiteUrl(input.request);
  const products = await fetchLatestProducts();

  if (products.length === 0) {
    throw new Error('No products available to build the test newsletter.');
  }

  const htmlContent = renderCatalogueEmail({
    intro:
      'Este es un envío de prueba del template de novedades con las últimas prendas del catálogo.',
    products,
    catalogueUrl: siteUrl,
    unsubscribeUrl: buildUnsubscribeUrl(siteUrl, input.email),
  });

  const messageId = await sendBrevoTransactionalEmail({
    to: input.email,
    subject: input.subject?.trim() || 'Prueba template newsletter circular.moda',
    htmlContent,
    tags: ['catalogue-newsletter-test'],
  });

  return {
    ok: true,
    sentTo: input.email,
    productCount: products.length,
    messageId,
  };
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = normalizeSubscriberEmail(url.searchParams.get('email') ?? '');
    const secret = url.searchParams.get('secret');
    const subject = url.searchParams.get('subject') ?? undefined;

    if (!isAuthorized(secret)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Missing or invalid email. Use /api/catalogue-test-send?email=tu@email.com&secret=...',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      await sendTestTemplate({ email, request, subject })
    );
  } catch (error) {
    console.error('[catalogue-test-send] Failed:', error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unknown test send error.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TestSendRequestBody;
    const email = body.email ? normalizeSubscriberEmail(body.email) : null;
    const secret = body.secret ?? null;

    if (!isAuthorized(secret)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Ingresá un email válido para el envío de prueba.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      await sendTestTemplate({
        email,
        request,
        subject: body.subject,
      })
    );
  } catch (error) {
    console.error('[catalogue-test-send] Failed:', error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unknown test send error.',
      },
      { status: 500 }
    );
  }
}
