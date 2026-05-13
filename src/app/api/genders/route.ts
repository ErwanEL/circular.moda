import { NextResponse } from 'next/server';
import { PRODUCTS_ISR_SECONDS } from '@/app/lib/product-cache';
import { getProductGenders } from '@/app/lib/products';

const CACHE_HEADERS = {
  'Cache-Control': `s-maxage=${PRODUCTS_ISR_SECONDS}, stale-while-revalidate=${PRODUCTS_ISR_SECONDS}`,
};

export async function GET() {
  try {
    return NextResponse.json({
      genders: await getProductGenders(),
    }, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { genders: [], error: "Une erreur inattendue s'est produite" },
      { status: 500 }
    );
  }
}
