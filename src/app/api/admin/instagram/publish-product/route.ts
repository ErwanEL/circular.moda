import { NextRequest, NextResponse } from 'next/server';
import {
  prepareInstagramProductForManualPublish,
  publishInstagramProductManually,
  type InstagramPublishImageMode,
} from '@/app/lib/instagram-products';
import { resolveSiteUrl } from '@/app/lib/catalogue-newsletter';
import { isSupabaseConfigured } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};
const CONFIRMATION_TEXT = 'PUBLISH_TO_INSTAGRAM';

type PublishBody = {
  productId?: unknown;
  confirm?: unknown;
  imageMode?: unknown;
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(
    secret && request.headers.get('authorization') === `Bearer ${secret}`
  );
}

function parseProductId(value: unknown): number | null {
  const raw =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : '';

  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function getInstagramUserId(): string | null {
  const value = process.env.INSTAGRAM_IG_USER_ID?.trim();
  return value || null;
}

function parseImageMode(value: unknown): InstagramPublishImageMode {
  return value === 'source' ? 'source' : 'proxy';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim() !== '') {
    return error;
  }

  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown Instagram manual publish error.';
    }
  }

  return 'Unknown Instagram manual publish error.';
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: CACHE_HEADERS,
    });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, message: 'Supabase is not configured.' },
      { status: 503, headers: CACHE_HEADERS }
    );
  }

  const igUserId = getInstagramUserId();
  if (!igUserId) {
    return NextResponse.json(
      { ok: false, message: 'INSTAGRAM_IG_USER_ID is not configured.' },
      { status: 503, headers: CACHE_HEADERS }
    );
  }

  try {
    const body = (await request.json()) as PublishBody;
    const productId = parseProductId(body.productId);

    if (!productId) {
      return NextResponse.json(
        { ok: false, message: 'Missing or invalid productId.' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    const siteUrl = resolveSiteUrl(request);
    const imageMode = parseImageMode(body.imageMode);
    const candidate = await prepareInstagramProductForManualPublish({
      productId,
      siteUrl,
      imageMode,
    });

    if (body.confirm !== CONFIRMATION_TEXT) {
      return NextResponse.json(
        {
          ok: true,
          dryRun: true,
          confirmationRequired: CONFIRMATION_TEXT,
          message:
            'Product is ready for manual Instagram publishing. Repeat with confirm=PUBLISH_TO_INSTAGRAM to publish.',
          imageMode,
          product: candidate,
        },
        { headers: CACHE_HEADERS }
      );
    }

    const result = await publishInstagramProductManually({
      productId,
      siteUrl,
      igUserId,
      imageMode,
    });

    return NextResponse.json(
      {
        ok: true,
        dryRun: false,
        journalId: result.journalId,
        containerId: result.containerId,
        mediaId: result.mediaId,
        permalink: result.permalink,
        product: result.candidate,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[admin-instagram-publish-product] Failed:', error);
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error),
      },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
