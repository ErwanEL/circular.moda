import { NextRequest, NextResponse } from 'next/server';
import {
  type IntroductionStatus,
  isIntroductionStatus,
} from '@/app/lib/product-interest';
import { getRequestHost, isLocalAdminRequest } from '@/app/lib/local-admin-access';
import { isSupabaseConfigured, supabase } from '@/app/lib/supabase';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

type InterestRequestRow = {
  id: number;
  code: string;
  product_id: number | null;
  product_sku: string;
  product_slug: string | null;
  product_name: string | null;
  product_size: string | null;
  product_color: string | null;
  seller_id: number | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  status: IntroductionStatus;
  availability_confirmed: boolean;
  source: string;
  whatsapp_message: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type SellerRow = {
  id: number;
  name: string | null;
  phone: string | null;
};

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? '50', 10);
  if (!Number.isSafeInteger(parsed)) return 50;
  return Math.max(1, Math.min(parsed, 100));
}

async function enrichRows(rows: InterestRequestRow[]) {
  const sellerIds = [
    ...new Set(
      rows
        .map((row) => row.seller_id)
        .filter((sellerId): sellerId is number => typeof sellerId === 'number')
    ),
  ];

  const sellers = new Map<number, SellerRow>();

  if (sellerIds.length > 0) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, phone')
      .in('id', sellerIds);

    if (error) {
      console.error('[Admin Introductions] Seller fetch failed:', error);
    }

    for (const seller of (data ?? []) as SellerRow[]) {
      sellers.set(seller.id, seller);
    }
  }

  return rows.map((row) => {
    const seller = row.seller_id ? sellers.get(row.seller_id) : null;

    return {
      ...row,
      seller: seller
        ? {
            id: String(seller.id),
            name: seller.name,
            phone: seller.phone,
          }
        : null,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    if (!isLocalAdminRequest(getRequestHost(request.headers))) {
      return NextResponse.json(
        { error: 'Not found', requests: [] },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured', requests: [] },
        { status: 503, headers: CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseLimit(searchParams.get('limit'));

    let query = supabase
      .from('product_interest_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all' && isIntroductionStatus(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Admin Introductions] Fetch failed:', error);
      return NextResponse.json(
        {
          error:
            'Impossible de charger les demandes. Vérifie que docs/sql/product-interest-requests.sql a été exécuté.',
          requests: [],
        },
        { status: 500, headers: CACHE_HEADERS }
      );
    }

    const requests = await enrichRows((data ?? []) as InterestRequestRow[]);
    return NextResponse.json({ requests }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('[Admin Introductions] Unexpected error:', error);
    return NextResponse.json(
      {
        error: "Une erreur inattendue s'est produite",
        requests: [],
      },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
