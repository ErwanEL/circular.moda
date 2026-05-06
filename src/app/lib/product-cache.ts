export const PRODUCTS_ISR_SECONDS = 300;
export const PRODUCTS_TAG = 'products';

export function getProductTag(slug: string): string {
  return `product:${slug}`;
}
