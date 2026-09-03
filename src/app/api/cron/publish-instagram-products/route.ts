import { NextRequest, NextResponse } from 'next/server';
import {
  getInstagramContentPublishingLimit,
  type InstagramPublishingLimit,
} from '@/app/lib/instagram-api';
import {
  INSTAGRAM_PRODUCT_POST_LIMIT_DEFAULT,
  INSTAGRAM_PRODUCT_POST_LIMIT_MAX,
  buildInstagramProductDryRun,
  publishInstagramProductManually,
  type InstagramPostCandidate,
  type InstagramPublishImageMode,
} from '@/app/lib/instagram-products';
import { resolveSiteUrl } from '@/app/lib/catalogue-newsletter';
import { isSupabaseConfigured } from '@/app/lib/supabase';

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

function parseLimit(value: string | null): number {
  if (!value) {
    return INSTAGRAM_PRODUCT_POST_LIMIT_DEFAULT;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed)) {
    return INSTAGRAM_PRODUCT_POST_LIMIT_DEFAULT;
  }

  return Math.max(1, Math.min(parsed, INSTAGRAM_PRODUCT_POST_LIMIT_MAX));
}

function shouldPublish(request: NextRequest): boolean {
  const value = request.nextUrl.searchParams.get('publish');
  return value === '1' || value === 'true';
}

function shouldCheckQuota(request: NextRequest): boolean {
  const value = request.nextUrl.searchParams.get('checkQuota');
  return value === '1' || value === 'true';
}

function shouldUseFeaturedOnly(request: NextRequest): boolean {
  const value = request.nextUrl.searchParams.get('featuredOnly');
  return value === '1' || value === 'true';
}

function parseImageMode(value: string | null): InstagramPublishImageMode {
  return value === 'source' ? 'source' : 'proxy';
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

  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown Instagram product publishing error.';
    }
  }

  return 'Unknown Instagram product publishing error.';
}

function parseNumericProductId(candidate: InstagramPostCandidate): number {
  const productId = Number.parseInt(candidate.productId, 10);
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    throw new Error(`Invalid product id for Instagram publish: ${candidate.productId}`);
  }
  return productId;
}

async function maybeFetchQuota(
  enabled: boolean
): Promise<InstagramPublishingLimit[] | null> {
  if (!enabled) {
    return null;
  }

  const igUserId = getInstagramUserId();
  if (!igUserId) {
    throw new Error('INSTAGRAM_IG_USER_ID is not configured.');
  }

  const result = await getInstagramContentPublishingLimit(igUserId);
  return result.data ?? [];
}

export async function GET(request: NextRequest) {
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

  const publish = shouldPublish(request);
  if (publish && !isPublishingEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        dryRun: false,
        message:
          'Instagram publishing is disabled. Set INSTAGRAM_PUBLISHING_ENABLED=true server-side to allow real posts.',
      },
      { status: 403, headers: CACHE_HEADERS }
    );
  }

  try {
    const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
    const siteUrl = resolveSiteUrl(request);
    const imageMode = parseImageMode(request.nextUrl.searchParams.get('imageMode'));
    const featuredOnly = shouldUseFeaturedOnly(request);
    const plan = await buildInstagramProductDryRun({
      siteUrl,
      limit,
      featuredOnly,
    });
    const quota = await maybeFetchQuota(shouldCheckQuota(request));
    const igUserId = getInstagramUserId();

    if (publish) {
      if (!igUserId) {
        throw new Error('INSTAGRAM_IG_USER_ID is not configured.');
      }

      const published = [];
      const failed = [];

      for (const candidate of plan.candidates) {
        try {
          const result = await publishInstagramProductManually({
            productId: parseNumericProductId(candidate),
            siteUrl,
            igUserId,
            imageMode,
          });
          published.push({
            productId: result.candidate.productId,
            productName: result.candidate.productName,
            journalId: result.journalId,
            containerId: result.containerId,
            mediaId: result.mediaId,
            permalink: result.permalink,
          });
        } catch (publishError) {
          failed.push({
            productId: candidate.productId,
            productName: candidate.productName,
            message: getErrorMessage(publishError),
          });
        }
      }

      return NextResponse.json(
        {
          ok: failed.length === 0,
          dryRun: false,
          igUserId,
          graphApiVersion: process.env.INSTAGRAM_GRAPH_API_VERSION || 'v26.0',
          imageMode,
          featuredOnly,
          journalAvailable: plan.journalAvailable,
          quota,
          selected: plan.candidates.length,
          published: published.length,
          failed: failed.length,
          warnings: plan.warnings,
          publishedProducts: published,
          failedProducts: failed,
        },
        { status: failed.length === 0 ? 200 : 207, headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        dryRun: true,
        igUserId,
        graphApiVersion: process.env.INSTAGRAM_GRAPH_API_VERSION || 'v26.0',
        imageMode,
        featuredOnly,
        journalAvailable: plan.journalAvailable,
        quota,
        selected: plan.candidates.length,
        skipped: plan.skipped.length,
        warnings: plan.warnings,
        products: plan.candidates,
        skippedProducts: plan.skipped,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[publish-instagram-products] Dry-run failed:', error);
    return NextResponse.json(
      {
        ok: false,
        dryRun: true,
        message: getErrorMessage(error),
      },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
