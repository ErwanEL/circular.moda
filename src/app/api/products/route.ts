// Route Handlers use the Web Fetch API
import { type NextRequest, NextResponse } from 'next/server';
import {
  getAllProducts,
  getProductsPage,
  PRODUCTS_PAGE_MAX,
  resolveProductFilters,
} from '../../lib/products';
import {
  hasActiveProductFilters,
  normalizeProductFiltersInput,
} from '../../lib/product-filters';
import type { Product, ProductsPageResponse } from '../../lib/types';
import type { ProductsPageCursor } from '../../lib/supabase-products';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

function parseCursor(encoded: string | null): ProductsPageCursor | undefined {
  if (!encoded || encoded === '') return undefined;
  try {
    const json = Buffer.from(encoded, 'base64').toString('utf8');
    const o = JSON.parse(json) as { created_at?: string; id?: string };
    if (typeof o?.created_at === 'string' && typeof o?.id === 'string') {
      return { created_at: o.created_at, id: o.id };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function encodeCursor(cursor: ProductsPageCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const cursorParam = searchParams.get('cursor');
    const rawFilters = normalizeProductFiltersInput({
      q: searchParams.get('q'),
      category: searchParams.get('category'),
      color: searchParams.get('color'),
      gender: searchParams.get('gender'),
      size: searchParams.get('size'),
      priceMin: searchParams.get('priceMin'),
      priceMax: searchParams.get('priceMax'),
    });

    const usePagination =
      limitParam != null ||
      cursorParam != null ||
      hasActiveProductFilters(rawFilters);
    if (usePagination) {
      const filters = await resolveProductFilters(rawFilters);
      const limit = Math.min(
        parseInt(limitParam ?? '20', 10) || 20,
        PRODUCTS_PAGE_MAX
      );
      const cursor = parseCursor(cursorParam ?? null);
      const { products, nextCursor } = await getProductsPage({
        limit,
        cursor,
        ...filters,
      });
      const body: ProductsPageResponse = {
        products,
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
        hasMore: nextCursor != null,
      };
      return NextResponse.json(body, { headers: CACHE_HEADERS });
    }

    const data: Product[] = await getAllProducts();
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (err: unknown) {
    console.error('API /products error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: true, message: errorMessage },
      { status: 500 }
    );
  }
}
