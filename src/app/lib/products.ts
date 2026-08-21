import { unstable_cache } from 'next/cache';
import type { Product } from './types';
import {
  type ProductFilterOptions,
  type ProductFilters,
  resolveProductFiltersAgainstOptions,
  serializeProductFilters,
} from './product-filters';
import {
  getProductTag,
  PRODUCTS_ISR_SECONDS,
  PRODUCTS_TAG,
} from './product-cache';
import { isSupabaseConfigured, supabase } from './supabase';
import {
  type ProductsPageCursor,
  getAllProductsFromSupabase,
  getFeaturedProductsFromSupabase,
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

/** Products flagged featured = true (curated). Cached, refreshes with PRODUCTS_TAG. */
export async function getFeaturedProductsList(): Promise<Product[]> {
  return unstable_cache(
    async () => getFeaturedProductsFromSupabase(),
    ['products', 'featured'],
    {
      revalidate: PRODUCTS_ISR_SECONDS,
      tags: [PRODUCTS_TAG],
    }
  )();
}

/** Page size and max for products list (keep in sync with API cap) */
export const PRODUCTS_PAGE_SIZE = 20;
export const PRODUCTS_PAGE_MAX = 50;

export type GetProductsPageOptions = ProductFilters & {
  limit: number;
  cursor?: ProductsPageCursor;
};

function normalizeLookupValues(values: string[]): string[] {
  const dedupedValues = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = value.trim();
    if (normalizedValue === '') {
      continue;
    }

    const key = normalizedValue.toLocaleLowerCase();
    if (!dedupedValues.has(key)) {
      dedupedValues.set(key, normalizedValue);
    }
  }

  return [...dedupedValues.values()].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: 'base' })
  );
}

async function getLookupValues(
  table: 'categories' | 'colors' | 'genders',
  column: 'category' | 'color' | 'gender'
): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .order(column, { ascending: true });

    if (error) {
      console.error(`[Supabase] Error fetching ${table}:`, error);
      return [];
    }

    return normalizeLookupValues(
      (data ?? [])
        .map((row) => (row as Record<string, unknown>)[column])
        .filter((value): value is string => typeof value === 'string')
    );
  } catch (error) {
    console.error(`[Supabase] Failed to fetch ${table}:`, error);
    return [];
  }
}

export async function getProductCategories(): Promise<string[]> {
  return unstable_cache(
    async () => getLookupValues('categories', 'category'),
    ['products', 'filters', 'categories'],
    {
      revalidate: PRODUCTS_ISR_SECONDS,
      tags: [PRODUCTS_TAG],
    }
  )();
}

export async function getProductColors(): Promise<string[]> {
  return unstable_cache(
    async () => getLookupValues('colors', 'color'),
    ['products', 'filters', 'colors'],
    {
      revalidate: PRODUCTS_ISR_SECONDS,
      tags: [PRODUCTS_TAG],
    }
  )();
}

export async function getProductGenders(): Promise<string[]> {
  return unstable_cache(
    async () => getLookupValues('genders', 'gender'),
    ['products', 'filters', 'genders'],
    {
      revalidate: PRODUCTS_ISR_SECONDS,
      tags: [PRODUCTS_TAG],
    }
  )();
}

export async function getProductFilterOptions(): Promise<ProductFilterOptions> {
  const [categories, colors, genders] = await Promise.all([
    getProductCategories(),
    getProductColors(),
    getProductGenders(),
  ]);

  return { categories, colors, genders };
}

export async function resolveProductFilters(
  filters: ProductFilters
): Promise<ProductFilters> {
  const options = await getProductFilterOptions();
  return resolveProductFiltersAgainstOptions(filters, options);
}

/**
 * Fetch a page of products (cursor-based). Use for infinite scroll.
 * Returns { products, nextCursor }; nextCursor is null when no more pages.
 */
export async function getProductsPage(
  options: GetProductsPageOptions
): Promise<{ products: Product[]; nextCursor: ProductsPageCursor | null }> {
  const safeLimit = Math.max(1, Math.min(options.limit, PRODUCTS_PAGE_MAX));
  const cursorKey = options.cursor
    ? `${options.cursor.created_at}:${options.cursor.id}`
    : 'first-page';
  const filters: ProductFilters = {
    query: options.query,
    category: options.category,
    color: options.color,
    gender: options.gender,
    size: options.size,
    priceMin: options.priceMin,
    priceMax: options.priceMax,
  };
  const filterKey = serializeProductFilters(filters);

  return unstable_cache(
    async () => getProductsPageFromSupabase(safeLimit, filters, options.cursor),
    ['products', 'page', String(safeLimit), cursorKey, filterKey],
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
