// Safety refresh for updates made outside the app; app mutations invalidate tags.
export const PRODUCTS_ISR_SECONDS = 3600;
export const PRODUCTS_TAG = 'products';

export function getProductTag(slug: string): string {
  return `product:${slug}`;
}
