export const INSTAGRAM_PRODUCT_POST_LIMIT_DEFAULT = 3;
export const INSTAGRAM_PRODUCT_POST_LIMIT_MAX = 10;
export const INSTAGRAM_PRODUCT_LOOKAHEAD_DEFAULT = 50;

export type InstagramProductRow = {
  id: string | number;
  sku?: string | null;
  name?: string | null;
  public_id?: string | null;
  slug?: string | null;
  price?: number | string | null;
  size?: string | null;
  category?: string | null;
  stock?: number | string | null;
  images?: unknown;
  created_at?: string | null;
  owner?: number | string | null;
  featured?: boolean | null;
};

export type InstagramPostCandidate = {
  productId: string;
  productName: string;
  productUrl: string;
  instagramImageUrl: string;
  sourceImageUrl: string;
  caption: string;
  price: number | null;
  size: string | null;
  category: string | null;
  featured: boolean;
  createdAt: string | null;
};

export type InstagramSkippedProduct = {
  productId: string;
  productName: string | null;
  reason: string;
};

export type InstagramDryRunPlan = {
  candidates: InstagramPostCandidate[];
  skipped: InstagramSkippedProduct[];
  warnings: string[];
  journalAvailable: boolean;
};

export function toInstagramTrimmedString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/$/, '');
}

function slugifyProductText(text: string): string {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildInstagramProductSlug(row: InstagramProductRow): string | null {
  const productName = toInstagramTrimmedString(row.name);
  const publicId = toInstagramTrimmedString(row.public_id);
  const explicitSlug = toInstagramTrimmedString(row.slug);
  const sku = toInstagramTrimmedString(row.sku);

  if (publicId && productName) {
    return `${slugifyProductText(productName)}-${publicId}`;
  }

  if (publicId) {
    return publicId;
  }

  if (explicitSlug) {
    return explicitSlug;
  }

  if (sku) {
    const slug = slugifyProductText(sku);
    return slug === '' ? null : slug;
  }

  if (productName) {
    const slug = slugifyProductText(productName);
    return slug === '' ? null : slug;
  }

  const id = toInstagramTrimmedString(row.id);
  if (!id) {
    return null;
  }

  const slug = slugifyProductText(id);
  return slug === '' ? null : slug;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function extractPrimaryImageUrl(images: unknown): string | null {
  if (Array.isArray(images)) {
    for (const image of images) {
      if (typeof image === 'string' && isHttpUrl(image)) {
        return image;
      }

      if (
        image &&
        typeof image === 'object' &&
        'url' in image &&
        typeof image.url === 'string' &&
        isHttpUrl(image.url)
      ) {
        return image.url;
      }
    }
  }

  if (typeof images === 'string') {
    try {
      return extractPrimaryImageUrl(JSON.parse(images));
    } catch {
      return isHttpUrl(images) ? images : null;
    }
  }

  return null;
}

export function buildInstagramProductUrl(input: {
  siteUrl: string;
  slug: string;
}): string {
  return new URL(
    `/products/${input.slug}`,
    normalizeSiteUrl(input.siteUrl)
  ).toString();
}

export function buildInstagramProductImageUrl(input: {
  siteUrl: string;
  productId: string;
}): string {
  return new URL(
    `/api/instagram/product-image/${input.productId}`,
    normalizeSiteUrl(input.siteUrl)
  ).toString();
}

export function formatInstagramCurrency(value: number | null): string | null {
  if (value == null) {
    return null;
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildInstagramCaption(input: {
  productName: string;
  productUrl: string;
  price: number | null;
  size: string | null;
  category: string | null;
}): string {
  const details = [
    formatInstagramCurrency(input.price),
    input.size ? `Talle ${input.size}` : null,
    input.category,
  ].filter((value): value is string => Boolean(value));

  const lines = [
    input.productName,
    '',
    details.length > 0 ? details.join(' · ') : null,
    '',
    'Disponible en circular.moda.',
    'Link directo en bio.',
    '',
    'Detalle del producto:',
    input.productUrl,
    '',
    '#CircularModa #ModaCircular #RopaSegundaMano #BuenosAires',
  ].filter((value): value is string => value != null);

  return lines.join('\n').slice(0, 2200);
}

export function selectInstagramProductCandidates(input: {
  rows: InstagramProductRow[];
  publishedProductIds: Set<string>;
  sellerPhoneById: Map<string, string | null>;
  siteUrl: string;
  limit: number;
}): {
  candidates: InstagramPostCandidate[];
  skipped: InstagramSkippedProduct[];
} {
  const candidates: InstagramPostCandidate[] = [];
  const skipped: InstagramSkippedProduct[] = [];
  const sortedRows = [...input.rows].sort((a, b) => {
    if (a.featured === b.featured) return 0;
    return a.featured ? -1 : 1;
  });

  for (const row of sortedRows) {
    const productId = toInstagramTrimmedString(row.id);
    const productName = toInstagramTrimmedString(row.name);

    const skip = (reason: string) => {
      skipped.push({
        productId: productId ?? 'unknown',
        productName,
        reason,
      });
    };

    if (!productId) {
      skip('missing_product_id');
      continue;
    }

    if (input.publishedProductIds.has(productId)) {
      skip('already_published_or_in_progress');
      continue;
    }

    if (!productName) {
      skip('missing_name');
      continue;
    }

    const stock = toNumber(row.stock);
    if (stock != null && stock <= 0) {
      skip('out_of_stock');
      continue;
    }

    const ownerId = toInstagramTrimmedString(row.owner);
    if (!ownerId) {
      skip('missing_owner');
      continue;
    }

    if (!input.sellerPhoneById.has(ownerId) || !input.sellerPhoneById.get(ownerId)) {
      skip('seller_contact_missing');
      continue;
    }

    const slug = buildInstagramProductSlug(row);
    if (!slug) {
      skip('missing_slug');
      continue;
    }

    const sourceImageUrl = extractPrimaryImageUrl(row.images);
    if (!sourceImageUrl) {
      skip('missing_public_image');
      continue;
    }

    const productUrl = buildInstagramProductUrl({
      siteUrl: input.siteUrl,
      slug,
    });
    const price = toNumber(row.price);
    const size = toInstagramTrimmedString(row.size);
    const category = toInstagramTrimmedString(row.category);
    const instagramImageUrl = buildInstagramProductImageUrl({
      siteUrl: input.siteUrl,
      productId,
    });

    candidates.push({
      productId,
      productName,
      productUrl,
      instagramImageUrl,
      sourceImageUrl,
      caption: buildInstagramCaption({
        productName,
        productUrl,
        price,
        size,
        category,
      }),
      price,
      size,
      category,
      featured: row.featured === true,
      createdAt: row.created_at ?? null,
    });

    if (candidates.length >= input.limit) {
      break;
    }
  }

  return { candidates, skipped };
}
