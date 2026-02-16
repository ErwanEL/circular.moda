// Route Handlers use the Web Fetch API
import { type NextRequest, NextResponse } from 'next/server';
import { getAllProducts, getProductsPage, PRODUCTS_PAGE_MAX } from '../../lib/products';
import type { Product, ProductsPageResponse } from '../../lib/types';
import type { ProductsPageCursor } from '../../lib/supabase-products';

const CACHE_HEADERS = { 'Cache-Control': 's-maxage=60, stale-while-revalidate' };

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

    const usePagination = limitParam != null || cursorParam != null;
    if (usePagination) {
      const limit = Math.min(
        parseInt(limitParam ?? '20', 10) || 20,
        PRODUCTS_PAGE_MAX
      );
      const cursor = parseCursor(cursorParam ?? null);
      const { products, nextCursor } = await getProductsPage(limit, cursor);
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
