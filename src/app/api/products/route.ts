// Route Handlers use the Web Fetch API
import { NextResponse } from 'next/server';
import { getAllProducts } from '../../lib/airtable';
import type { Product } from '../../lib/types';

export const revalidate = 60; // same caching window

export async function GET() {
  try {
    const data: Product[] = await getAllProducts();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate' },
    });
  } catch (err: unknown) {
    console.error('API /products error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: true, message: errorMessage },
      { status: 500 }
    );
  }
}
