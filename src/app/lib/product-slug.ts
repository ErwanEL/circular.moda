type ProductSlugSource = {
  id?: unknown;
  sku?: unknown;
  SKU?: unknown;
  slug?: unknown;
  name?: unknown;
  product_name?: unknown;
  public_id?: unknown;
  'Product Name'?: unknown;
};

function toTrimmedString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

export function slugifyProductText(text: string): string {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildProductSlug(source: ProductSlugSource): string | null {
  const productName =
    toTrimmedString(source['Product Name']) ??
    toTrimmedString(source.product_name) ??
    toTrimmedString(source.name);
  const publicId = toTrimmedString(source.public_id);
  const explicitSlug = toTrimmedString(source.slug);
  const sku = toTrimmedString(source.SKU) ?? toTrimmedString(source.sku);

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

  const id = toTrimmedString(source.id);
  if (!id) {
    return null;
  }

  const slug = slugifyProductText(id);
  return slug === '' ? null : slug;
}

export function getProductSlugFromUnknown(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return buildProductSlug(value as ProductSlugSource);
}
