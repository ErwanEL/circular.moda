import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import {
  BREVO_DAILY_SEND_CAP,
  type CatalogueSendKind,
  type CatalogueSubscriptionRow,
  NEWSLETTER_PRODUCT_LIMIT,
  buildUnsubscribeUrl,
  calculateNextMonthlySendAt,
  formatCycleDueDate,
  mapProductRowToNewsletterProduct,
  renderCatalogueEmail,
  resolveSiteUrl,
  sendBrevoTransactionalEmail,
} from '@/app/lib/catalogue-newsletter';

type ProductQueryRow = {
  id: string | number;
  name: string | null;
  slug: string | null;
  public_id: string | null;
  price: number | string | null;
  size: string | null;
  images: unknown;
  created_at: string;
};

export const dynamic = 'force-dynamic';

const PROCESSING_STALE_AFTER_HOURS = 6;
const PRODUCT_SELECT = 'id, name, public_id, price, size, images, created_at';

function isAuthorized(request: Request): boolean {
  return (
    request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  );
}

function nextCycleFromCurrentDueDate(currentDueDate: string): string {
  return calculateNextMonthlySendAt(new Date(currentDueDate)).toISOString();
}

async function resetStaleProcessing(now: Date): Promise<void> {
  const staleCutoff = new Date(
    now.getTime() - PROCESSING_STALE_AFTER_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase
    .from('catalogue_subscriptions')
    .update({
      status: 'active',
      processing_started_at: null,
      updated_at: now.toISOString(),
    })
    .eq('status', 'processing')
    .lt('processing_started_at', staleCutoff);

  if (error) {
    console.error(
      '[send-catalogue] Failed to reset stale processing rows:',
      error
    );
  }
}

async function claimDueSubscriptions(
  nowIso: string
): Promise<CatalogueSubscriptionRow[]> {
  const { data: dueRows, error } = await supabase
    .from('catalogue_subscriptions')
    .select('*')
    .eq('status', 'active')
    .lte('next_send_at', nowIso)
    .order('next_send_at', { ascending: true })
    .limit(BREVO_DAILY_SEND_CAP);

  if (error) {
    throw error;
  }

  const claimedRows: CatalogueSubscriptionRow[] = [];

  for (const row of (dueRows ?? []) as CatalogueSubscriptionRow[]) {
    const { data: claimedRow, error: claimError } = await supabase
      .from('catalogue_subscriptions')
      .update({
        status: 'processing',
        processing_started_at: nowIso,
        last_error: null,
        updated_at: nowIso,
      })
      .eq('id', row.id)
      .eq('status', 'active')
      .lte('next_send_at', nowIso)
      .select('*')
      .maybeSingle();

    if (claimError) {
      console.error('[send-catalogue] Failed to claim row:', claimError);
      continue;
    }

    if (claimedRow) {
      claimedRows.push(claimedRow as CatalogueSubscriptionRow);
    }
  }

  return claimedRows;
}

async function fetchProductsForWindow(
  fromIso: string,
  toIso: string
): Promise<ProductQueryRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .gt('created_at', fromIso)
    .lte('created_at', toIso)
    .order('created_at', { ascending: false })
    .limit(NEWSLETTER_PRODUCT_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductQueryRow[];
}

async function fetchLatestCataloguePicks(): Promise<ProductQueryRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false })
    .limit(NEWSLETTER_PRODUCT_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductQueryRow[];
}

async function selectProducts(
  subscription: CatalogueSubscriptionRow,
  nowIso: string
): Promise<{
  intro: string;
  products: NonNullable<ReturnType<typeof mapProductRowToNewsletterProduct>>[];
  sendKind: CatalogueSendKind;
  windowStart: string;
}> {
  const windowStart =
    subscription.last_window_end_at ?? subscription.subscribed_at;
  const newProductRows = await fetchProductsForWindow(windowStart, nowIso);
  const mappedNewProducts = newProductRows
    .map(mapProductRowToNewsletterProduct)
    .filter(
      (
        product
      ): product is NonNullable<
        ReturnType<typeof mapProductRowToNewsletterProduct>
      > => product != null
    );

  if (mappedNewProducts.length > 0) {
    return {
      intro:
        'Estas son las prendas publicadas desde tu último email de novedades.',
      products: mappedNewProducts,
      sendKind: 'new_products',
      windowStart,
    };
  }

  const latestPickRows = await fetchLatestCataloguePicks();
  const mappedLatestPicks = latestPickRows
    .map(mapProductRowToNewsletterProduct)
    .filter(
      (
        product
      ): product is NonNullable<
        ReturnType<typeof mapProductRowToNewsletterProduct>
      > => product != null
    );

  return {
    intro: 'Estas son las últimas publicaciones.',
    products: mappedLatestPicks,
    sendKind: 'latest_picks',
    windowStart,
  };
}

async function recordCycle(input: {
  subscriptionId: string;
  cycleDueDate: string;
  windowStart: string;
  windowEnd: string;
  sendKind: CatalogueSendKind;
  productCount: number;
  messageId: string | null;
  status: string;
  lastError?: string | null;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase.from('catalogue_delivery_cycles').upsert(
    {
      subscription_id: input.subscriptionId,
      cycle_due_date: input.cycleDueDate,
      window_start_at: input.windowStart,
      window_end_at: input.windowEnd,
      send_kind: input.sendKind,
      product_count: input.productCount,
      brevo_message_id: input.messageId,
      status: input.status,
      last_error: input.lastError ?? null,
      updated_at: nowIso,
    },
    {
      onConflict: 'subscription_id,cycle_due_date',
      ignoreDuplicates: false,
    }
  );

  if (error) {
    throw error;
  }
}

async function releaseSubscription(input: {
  subscriptionId: string;
  nextSendAt?: string;
  nowIso: string;
  lastWindowEndAt?: string | null;
  lastSentAt?: string | null;
  status: 'active' | 'blocked' | 'unsubscribed';
  lastError?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('catalogue_subscriptions')
    .update({
      status: input.status,
      next_send_at: input.nextSendAt,
      last_window_end_at: input.lastWindowEndAt ?? null,
      last_sent_at: input.lastSentAt ?? null,
      processing_started_at: null,
      last_error: input.lastError ?? null,
      updated_at: input.nowIso,
    })
    .eq('id', input.subscriptionId);

  if (error) {
    throw error;
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const siteUrl = resolveSiteUrl(request);
  const now = new Date();
  const nowIso = now.toISOString();

  try {
    await resetStaleProcessing(now);
    const claimedSubscriptions = await claimDueSubscriptions(nowIso);

    let sent = 0;
    let fallbackSent = 0;
    let failed = 0;

    for (const subscription of claimedSubscriptions) {
      const cycleDueDate = formatCycleDueDate(subscription.next_send_at);

      try {
        const selection = await selectProducts(subscription, nowIso);
        const products = selection.products;

        if (products.length === 0) {
          throw new Error('No catalogue products available to send.');
        }

        const unsubscribeUrl = buildUnsubscribeUrl(siteUrl, subscription.email);
        const htmlContent = renderCatalogueEmail({
          intro: selection.intro,
          products,
          catalogueUrl: siteUrl,
          unsubscribeUrl,
        });

        const messageId = await sendBrevoTransactionalEmail({
          to: subscription.email,
          subject: 'Novedades del catálogo de circular.moda',
          htmlContent,
          tags: [
            'catalogue-newsletter',
            `subscription:${subscription.id}`,
            `cycle:${cycleDueDate}`,
          ],
        });

        await recordCycle({
          subscriptionId: subscription.id,
          cycleDueDate,
          windowStart: selection.windowStart,
          windowEnd: nowIso,
          sendKind: selection.sendKind,
          productCount: products.length,
          messageId,
          status: 'sent',
        });

        await releaseSubscription({
          subscriptionId: subscription.id,
          nextSendAt: nextCycleFromCurrentDueDate(subscription.next_send_at),
          nowIso,
          lastWindowEndAt: nowIso,
          lastSentAt: nowIso,
          status: 'active',
        });

        sent += 1;
        if (selection.sendKind === 'latest_picks') {
          fallbackSent += 1;
        }
      } catch (subscriptionError) {
        failed += 1;
        const errorMessage =
          subscriptionError instanceof Error
            ? subscriptionError.message
            : 'Unknown catalogue send error';

        console.error(
          `[send-catalogue] Failed for ${subscription.email}:`,
          subscriptionError
        );

        try {
          await recordCycle({
            subscriptionId: subscription.id,
            cycleDueDate,
            windowStart:
              subscription.last_window_end_at ?? subscription.subscribed_at,
            windowEnd: nowIso,
            sendKind: 'latest_picks',
            productCount: 0,
            messageId: null,
            status: 'error',
            lastError: errorMessage,
          });
        } catch (cycleError) {
          console.error(
            '[send-catalogue] Failed to record error cycle:',
            cycleError
          );
        }

        await releaseSubscription({
          subscriptionId: subscription.id,
          nowIso,
          status: 'active',
          lastError: errorMessage,
          nextSendAt: subscription.next_send_at,
          lastWindowEndAt: subscription.last_window_end_at,
          lastSentAt: subscription.last_sent_at,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      claimed: claimedSubscriptions.length,
      sent,
      fallbackSent,
      failed,
    });
  } catch (error) {
    console.error('[send-catalogue] Cron failed:', error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unknown cron execution error',
      },
      { status: 500 }
    );
  }
}
