import { unstable_cache } from 'next/cache';
import type { Product } from './types';
import {
  getProductTag,
  PRODUCTS_ISR_SECONDS,
  PRODUCTS_TAG,
} from './product-cache';
import {
  type ProductsPageCursor,
  getAllProductsFromSupabase,
  getProductsPageFromSupabase,
  getProductBySlugFromSupabase,
} from './supabase-products';

export async function getAllProducts(): Promise<Product[]> {
  return unstable_cache(
    async () => getAllProductsFromSupabase(),
    ['products', 'all'],
    {
      revalidate: PRODUCTS_ISR_SECONDS,
      tags: [PRODUCTS_TAG],
    }
  )();
}

/** Page size and max for products list (keep in sync with API cap) */
export const PRODUCTS_PAGE_SIZE = 20;
export const PRODUCTS_PAGE_MAX = 50;

/**
 * Fetch a page of products (cursor-based). Use for infinite scroll.
 * Returns { products, nextCursor }; nextCursor is null when no more pages.
 */
export async function getProductsPage(
  limit: number,
  cursor?: ProductsPageCursor
): Promise<{ products: Product[]; nextCursor: ProductsPageCursor | null }> {
  const safeLimit = Math.max(1, Math.min(limit, PRODUCTS_PAGE_MAX));
  const cursorKey = cursor
    ? `${cursor.created_at}:${cursor.id}`
    : 'first-page';

  return unstable_cache(
    async () => getProductsPageFromSupabase(safeLimit, cursor),
    ['products', 'page', String(safeLimit), cursorKey],
    {
      revalidate: PRODUCTS_ISR_SECONDS,
      tags: [PRODUCTS_TAG],
    }
  )();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const normalizedSlug = slug.trim();
  if (normalizedSlug === '') {
    return null;
  }

  try {
    return await unstable_cache(
      async () => getProductBySlugFromSupabase(normalizedSlug),
      ['products', 'slug', normalizedSlug],
      {
        revalidate: PRODUCTS_ISR_SECONDS,
        tags: [PRODUCTS_TAG, getProductTag(normalizedSlug)],
      }
    )();
  } catch (error) {
    console.error('Failed to get product by slug:', error);
    return null;
  }
}

// Utility function to check if products data is available
export async function isProductsDataAvailable(): Promise<boolean> {
  try {
    const products = await getAllProducts();
    return products.length > 0;
  } catch {
    return false;
  }
}

// Utility function to get products count
export async function getProductsCount(): Promise<number> {
  try {
    const products = await getAllProducts();
    return products.length;
  } catch {
    return 0;
  }
}
