import { isSupabaseConfigured, supabase } from './supabase';
import {
  createInstagramImageMediaContainer,
  getInstagramMediaContainerStatus,
  getInstagramPublishedMedia,
  publishInstagramMediaContainer,
} from './instagram-api';
import {
  INSTAGRAM_PRODUCT_LOOKAHEAD_DEFAULT,
  INSTAGRAM_PRODUCT_POST_LIMIT_DEFAULT,
  INSTAGRAM_PRODUCT_POST_LIMIT_MAX,
  selectInstagramProductCandidates,
  toInstagramTrimmedString,
  type InstagramDryRunPlan,
  type InstagramPostCandidate,
  type InstagramProductRow,
} from './instagram-product-planning';

export {
  INSTAGRAM_PRODUCT_LOOKAHEAD_DEFAULT,
  INSTAGRAM_PRODUCT_POST_LIMIT_DEFAULT,
  INSTAGRAM_PRODUCT_POST_LIMIT_MAX,
  buildInstagramCaption,
  buildInstagramProductImageUrl,
  buildInstagramProductUrl,
  extractPrimaryImageUrl,
  formatInstagramCurrency,
  selectInstagramProductCandidates,
} from './instagram-product-planning';
export type {
  InstagramDryRunPlan,
  InstagramPostCandidate,
  InstagramProductRow,
  InstagramSkippedProduct,
} from './instagram-product-planning';

type InstagramProductPostStatus =
  | 'pending'
  | 'container_created'
  | 'publishing'
  | 'published';

type InstagramProductPostRow = {
  product_id: string | number | null;
  status: InstagramProductPostStatus | string;
};

type InstagramProductPostJournalRow = {
  id: number;
  product_id: string | number | null;
  status: string;
};

type SellerContactRow = {
  id: number | string;
  phone: string | null;
};

export type InstagramManualPublishResult = {
  candidate: InstagramPostCandidate;
  journalId: number;
  containerId: string;
  mediaId: string;
  permalink: string | null;
};

export type InstagramPublishImageMode = 'proxy' | 'source';

const PRODUCT_SELECT = [
  'id',
  'sku',
  'name',
  'public_id',
  'price',
  'size',
  'category',
  'images',
  'created_at',
  'owner',
  'featured',
].join(', ');

const ACTIVE_POST_STATUSES: InstagramProductPostStatus[] = [
  'pending',
  'container_created',
  'publishing',
  'published',
];

function getPostgresErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function isMissingInstagramJournalTable(error: unknown): boolean {
  const code = getPostgresErrorCode(error);
  return code === '42P01' || code === 'PGRST205';
}

async function fetchActiveInstagramPostProductIds(): Promise<{
  productIds: Set<string>;
  journalAvailable: boolean;
  warning?: string;
}> {
  const { data, error } = await supabase
    .from('instagram_product_posts')
    .select('product_id, status')
    .in('status', ACTIVE_POST_STATUSES);

  if (error) {
    if (isMissingInstagramJournalTable(error)) {
      return {
        productIds: new Set(),
        journalAvailable: false,
        warning:
          'instagram_product_posts table is not available yet; duplicate filtering is disabled.',
      };
    }
    throw error;
  }

  const rows = ((data ?? []) as unknown) as InstagramProductPostRow[];
  return {
    productIds: new Set(
      rows
        .map((row) => toInstagramTrimmedString(row.product_id))
        .filter((id): id is string => id != null)
    ),
    journalAvailable: true,
  };
}

async function fetchSellerPhoneById(
  ownerIds: string[]
): Promise<Map<string, string | null>> {
  if (ownerIds.length === 0) {
    return new Map();
  }

  const numericOwnerIds = ownerIds
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isSafeInteger(id) && id > 0);

  if (numericOwnerIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, phone')
    .in('id', numericOwnerIds);

  if (error) {
    throw error;
  }

  return new Map(
    (((data ?? []) as unknown) as SellerContactRow[]).map((row) => [
      String(row.id),
      row.phone,
    ])
  );
}

async function fetchProductRowById(
  productId: number
): Promise<InstagramProductRow | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (((data as unknown) as InstagramProductRow)) : null;
}

async function findActivePostForProduct(
  productId: number
): Promise<InstagramProductPostJournalRow | null> {
  const { data, error } = await supabase
    .from('instagram_product_posts')
    .select('id, product_id, status')
    .eq('product_id', productId)
    .in('status', ACTIVE_POST_STATUSES)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as InstagramProductPostJournalRow | null;
}

async function prepareSingleInstagramProductCandidate(input: {
  productId: number;
  siteUrl: string;
}): Promise<InstagramPostCandidate> {
  const row = await fetchProductRowById(input.productId);
  if (!row) {
    throw new Error(`Product ${input.productId} was not found.`);
  }

  const ownerId = toInstagramTrimmedString(row.owner);
  const sellerPhoneById = ownerId
    ? await fetchSellerPhoneById([ownerId])
    : new Map<string, string | null>();
  const selection = selectInstagramProductCandidates({
    rows: [row],
    publishedProductIds: new Set(),
    sellerPhoneById,
    siteUrl: input.siteUrl,
    limit: 1,
  });

  const candidate = selection.candidates[0];
  if (!candidate) {
    const reason = selection.skipped[0]?.reason ?? 'not_eligible';
    throw new Error(`Product ${input.productId} is not eligible: ${reason}.`);
  }

  return candidate;
}

async function assertPublicImageIsReachable(imageUrl: string): Promise<void> {
  let response = await fetch(imageUrl, {
    method: 'HEAD',
    headers: { 'User-Agent': 'ModaCircular-InstagramPublisher/1.0' },
  });

  if (response.status === 405 || response.status === 501) {
    response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'ModaCircular-InstagramPublisher/1.0' },
    });
  }

  if (!response.ok) {
    throw new Error(
      `Instagram image URL is not publicly reachable (${response.status}).`
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('image/jpeg')) {
    throw new Error(
      `Instagram image URL must return image/jpeg, got ${contentType || 'no content type'}.`
    );
  }
}

function resolvePublishCandidateImage(
  candidate: InstagramPostCandidate,
  imageMode: InstagramPublishImageMode
): InstagramPostCandidate {
  if (imageMode === 'source') {
    return {
      ...candidate,
      instagramImageUrl: candidate.sourceImageUrl,
    };
  }

  return candidate;
}

async function createPendingJournalRow(
  candidate: InstagramPostCandidate
): Promise<number> {
  const { data, error } = await supabase
    .from('instagram_product_posts')
    .insert({
      product_id: Number(candidate.productId),
      product_slug: candidate.productUrl.split('/products/')[1] ?? null,
      product_name: candidate.productName,
      product_url: candidate.productUrl,
      image_url: candidate.instagramImageUrl,
      source_image_url: candidate.sourceImageUrl,
      caption: candidate.caption,
      status: 'pending',
      error: null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return Number((data as { id: number }).id);
}

async function updateJournalRow(
  journalId: number,
  values: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('instagram_product_posts')
    .update(values)
    .eq('id', journalId);

  if (error) {
    throw error;
  }
}

async function waitForInstagramContainer(containerId: string): Promise<void> {
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const status = await getInstagramMediaContainerStatus(containerId);

    if (status.status_code === 'FINISHED') {
      return;
    }

    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
      throw new Error(
        `Instagram container ${containerId} ended with ${status.status_code}: ${status.status ?? 'no status details'}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error(`Instagram container ${containerId} did not finish in time.`);
}

export async function prepareInstagramProductForManualPublish(input: {
  productId: number;
  siteUrl: string;
  imageMode?: InstagramPublishImageMode;
}): Promise<InstagramPostCandidate> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const existingPost = await findActivePostForProduct(input.productId);
  if (existingPost) {
    throw new Error(
      `Product ${input.productId} already has an active Instagram post row (${existingPost.status}).`
    );
  }

  const candidate = await prepareSingleInstagramProductCandidate(input);
  return resolvePublishCandidateImage(candidate, input.imageMode ?? 'proxy');
}

export async function publishInstagramProductManually(input: {
  productId: number;
  siteUrl: string;
  igUserId: string;
  imageMode?: InstagramPublishImageMode;
}): Promise<InstagramManualPublishResult> {
  const candidate = await prepareInstagramProductForManualPublish(input);
  await assertPublicImageIsReachable(candidate.instagramImageUrl);

  const journalId = await createPendingJournalRow(candidate);

  try {
    const container = await createInstagramImageMediaContainer({
      igUserId: input.igUserId,
      imageUrl: candidate.instagramImageUrl,
      caption: candidate.caption,
    });

    await updateJournalRow(journalId, {
      status: 'container_created',
      instagram_container_id: container.id,
      error: null,
    });

    await waitForInstagramContainer(container.id);

    await updateJournalRow(journalId, {
      status: 'publishing',
      error: null,
    });

    const media = await publishInstagramMediaContainer({
      igUserId: input.igUserId,
      creationId: container.id,
    });
    const publishedMedia = await getInstagramPublishedMedia(media.id).catch(
      () => ({ id: media.id, permalink: undefined })
    );
    const permalink = publishedMedia.permalink ?? null;

    await updateJournalRow(journalId, {
      status: 'published',
      instagram_media_id: media.id,
      instagram_permalink: permalink,
      published_at: new Date().toISOString(),
      error: null,
    });

    return {
      candidate,
      journalId,
      containerId: container.id,
      mediaId: media.id,
      permalink,
    };
  } catch (error) {
    await updateJournalRow(journalId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown Instagram error.',
    }).catch((journalError) => {
      console.error(
        '[instagram-products] Failed to record publish error:',
        journalError
      );
    });
    throw error;
  }
}

export async function buildInstagramProductDryRun(input: {
  siteUrl: string;
  limit?: number;
  lookahead?: number;
  featuredOnly?: boolean;
}): Promise<InstagramDryRunPlan> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const limit = Math.max(
    1,
    Math.min(
      input.limit ?? INSTAGRAM_PRODUCT_POST_LIMIT_DEFAULT,
      INSTAGRAM_PRODUCT_POST_LIMIT_MAX
    )
  );
  const lookahead = Math.max(
    limit,
    Math.min(input.lookahead ?? INSTAGRAM_PRODUCT_LOOKAHEAD_DEFAULT, 100)
  );
  const warnings: string[] = [];

  const { productIds, journalAvailable, warning } =
    await fetchActiveInstagramPostProductIds();
  if (warning) {
    warnings.push(warning);
  }

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false });

  if (input.featuredOnly) {
    query = query.eq('featured', true);
  }

  const { data, error } = await query.limit(lookahead);

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as unknown) as InstagramProductRow[];
  const ownerIds = [
    ...new Set(
      rows
        .map((row) => toInstagramTrimmedString(row.owner))
        .filter((id): id is string => id != null)
    ),
  ];

  let sellerPhoneById = new Map<string, string | null>();
  try {
    sellerPhoneById = await fetchSellerPhoneById(ownerIds);
  } catch (sellerError) {
    warnings.push(
      sellerError instanceof Error
        ? `Seller contact lookup failed: ${sellerError.message}`
        : 'Seller contact lookup failed.'
    );
  }

  const selection = selectInstagramProductCandidates({
    rows,
    publishedProductIds: productIds,
    sellerPhoneById,
    siteUrl: input.siteUrl,
    limit,
  });

  return {
    ...selection,
    warnings,
    journalAvailable,
  };
}
