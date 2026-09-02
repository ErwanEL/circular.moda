import { NextRequest, NextResponse } from 'next/server';
import { isIntroductionStatus } from '@/app/lib/product-interest';
import { getRequestHost, isLocalAdminRequest } from '@/app/lib/local-admin-access';
import { isSupabaseConfigured, supabase } from '@/app/lib/supabase';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateBody = {
  buyerName?: unknown;
  buyerPhone?: unknown;
  notes?: unknown;
  status?: unknown;
  availabilityConfirmed?: unknown;
};

function getTrimmedStringOrNull(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getRequestId(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!isLocalAdminRequest(getRequestHost(request.headers))) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 503, headers: CACHE_HEADERS }
      );
    }

    const { id: rawId } = await context.params;
    const id = getRequestId(rawId);

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid introduction id' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    const body = (await request.json()) as UpdateBody;
    const updateData: Record<string, unknown> = {};

    if ('buyerName' in body) {
      updateData.buyer_name = getTrimmedStringOrNull(body.buyerName);
    }

    if ('buyerPhone' in body) {
      updateData.buyer_phone = getTrimmedStringOrNull(body.buyerPhone);
    }

    if ('notes' in body) {
      updateData.notes = getTrimmedStringOrNull(body.notes);
    }

    if ('availabilityConfirmed' in body) {
      updateData.availability_confirmed = body.availabilityConfirmed === true;
    }

    if ('status' in body) {
      if (!isIntroductionStatus(body.status)) {
        return NextResponse.json(
          { error: 'Invalid introduction status' },
          { status: 400, headers: CACHE_HEADERS }
        );
      }
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No field to update' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    const { data, error } = await supabase
      .from('product_interest_requests')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[Admin Introduction] Update failed:', error);
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour: ${error.message}` },
        { status: 500, headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json({ request: data }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('[Admin Introduction] Unexpected error:', error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite" },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    if (!isLocalAdminRequest(getRequestHost(_request.headers))) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 503, headers: CACHE_HEADERS }
      );
    }

    const { id: rawId } = await context.params;
    const id = getRequestId(rawId);

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid introduction id' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    const { data, error } = await supabase
      .from('product_interest_requests')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[Admin Introduction] Delete failed:', error);
      return NextResponse.json(
        { error: `Erreur lors de la suppression: ${error.message}` },
        { status: 500, headers: CACHE_HEADERS }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Introduction not found' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json({ deletedId: id }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('[Admin Introduction] Unexpected delete error:', error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite" },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
