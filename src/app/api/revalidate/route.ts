import { NextRequest, NextResponse } from 'next/server';
import { getProductSlugFromUnknown } from '@/app/lib/product-slug';
import { revalidateProductContent } from '@/app/lib/product-revalidation';

type RevalidateRequestBody = {
  secret?: string;
  slug?: string;
  oldSlug?: string;
  paths?: string[];
  event?: string;
  record?: unknown;
  oldRecord?: unknown;
  old_record?: unknown;
};

function readBearerToken(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function normalizeSlug(slug?: string | null): string | null {
  if (typeof slug !== 'string') {
    return null;
  }

  const trimmed = slug.trim();
  return trimmed === '' ? null : trimmed;
}

function getSecret(request: NextRequest, body: RevalidateRequestBody): string | null {
  return (
    request.headers.get('x-revalidate-secret') ??
    readBearerToken(request.headers.get('authorization')) ??
    body.secret ??
    new URL(request.url).searchParams.get('secret')
  );
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.REVALIDATE_SECRET;
  if (!configuredSecret) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET is not configured' },
      { status: 500 }
    );
  }

  let body: RevalidateRequestBody = {};
  try {
    body = (await request.json()) as RevalidateRequestBody;
  } catch {
    body = {};
  }

  if (getSecret(request, body) !== configuredSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    const slug =
      normalizeSlug(body.slug) ?? getProductSlugFromUnknown(body.record);
    const oldSlug =
      normalizeSlug(body.oldSlug) ??
      getProductSlugFromUnknown(body.oldRecord) ??
      getProductSlugFromUnknown(body.old_record);

    const result = revalidateProductContent({
      slug,
      oldSlug,
      paths: Array.isArray(body.paths) ? body.paths : undefined,
    });

    return NextResponse.json({
      ok: true,
      event: body.event ?? null,
      slug,
      oldSlug,
      revalidatedAt: new Date().toISOString(),
      paths: result.paths,
      tags: result.tags,
      note: 'Caches are invalidated now. The pages are regenerated on the next request.',
    });
  } catch (error) {
    console.error('Failed to revalidate product content:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate product content' },
      { status: 500 }
    );
  }
}
