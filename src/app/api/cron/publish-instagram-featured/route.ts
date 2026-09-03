import { NextResponse } from 'next/server';
import { getInstagramContentPublishingLimit } from '@/app/lib/instagram-api';
import { resolveSiteUrl } from '@/app/lib/catalogue-newsletter';
import { isSupabaseConfigured } from '@/app/lib/supabase';
import {
  buildInstagramProductDryRun,
  publishInstagramProductManually,
} from '@/app/lib/instagram-products';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(
    secret && request.headers.get('authorization') === `Bearer ${secret}`
  );
}

function getInstagramUserId(): string | null {
  const value = process.env.INSTAGRAM_IG_USER_ID?.trim();
  return value || null;
}

function isPublishingEnabled(): boolean {
  return process.env.INSTAGRAM_PUBLISHING_ENABLED === 'true';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim() !== '') {
    return error;
  }

  return 'Unknown Instagram featured publishing error.';
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: CACHE_HEADERS,
    });
  }

  if (!isPublishingEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Instagram publishing is disabled. Set INSTAGRAM_PUBLISHING_ENABLED=true server-side to allow real posts.',
      },
      { status: 403, headers: CACHE_HEADERS }
    );
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
    const siteUrl = resolveSiteUrl(request);
    const plan = await buildInstagramProductDryRun({
      siteUrl,
      limit: 1,
      featuredOnly: true,
    });
    const quota = await getInstagramContentPublishingLimit(igUserId)
      .then((result) => result.data ?? [])
      .catch((quotaError) => [
        {
          error: getErrorMessage(quotaError),
        },
      ]);
    const candidate = plan.candidates[0];

    if (!candidate) {
      return NextResponse.json(
        {
          ok: true,
          published: false,
          reason: 'no_featured_candidate',
          selected: 0,
          skipped: plan.skipped.length,
          quota,
          warnings: plan.warnings,
        },
        { headers: CACHE_HEADERS }
      );
    }

    const productId = Number.parseInt(candidate.productId, 10);
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      throw new Error(`Invalid product id for Instagram publish: ${candidate.productId}`);
    }

    const result = await publishInstagramProductManually({
      productId,
      siteUrl,
      igUserId,
      imageMode: 'proxy',
    });

    return NextResponse.json(
      {
        ok: true,
        published: true,
        selected: 1,
        skipped: plan.skipped.length,
        quota,
        product: {
          productId: result.candidate.productId,
          productName: result.candidate.productName,
          journalId: result.journalId,
          containerId: result.containerId,
          mediaId: result.mediaId,
          permalink: result.permalink,
        },
        warnings: plan.warnings,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[publish-instagram-featured] Failed:', error);
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error),
      },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
