import type { Product } from './types';
import {
  type ProductsPageCursor,
  getAllProductsFromSupabase,
  getProductsPageFromSupabase,
  getProductBySlugFromSupabase,
} from './supabase-products';

// In-memory cache with TTL
let cache: Product[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getAllProducts(): Promise<Product[]> {
  // Check in-memory cache first
  if (cache.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL) {
    return [...cache];
  }

  // Load exclusively from Supabase
  const allProducts = await getAllProductsFromSupabase();

  // Update cache
  cache = allProducts;
  cacheTimestamp = Date.now();

  return [...allProducts];
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
  return getProductsPageFromSupabase(safeLimit, cursor);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    // Look up product in Supabase only
    const supabaseProduct = await getProductBySlugFromSupabase(slug);
    return supabaseProduct;
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
