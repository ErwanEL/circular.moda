import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/app/lib/supabase';
import {
  verifyMetaSignature,
  verifyWhatsappWebhookToken,
} from '@/app/lib/whatsapp-api';
import {
  findProductInterestSeller,
  insertWhatsappLog,
  maybeNotifyProductSeller,
  updateInterestRequest,
} from '@/app/lib/whatsapp-product-interest';
import type { ProductInterestSnapshot } from '@/app/lib/product-interest';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

type WhatsappWebhookStatus = {
  id?: unknown;
  status?: unknown;
  timestamp?: unknown;
  recipient_id?: unknown;
  errors?: unknown;
};

type WhatsappWebhookContact = {
  wa_id?: unknown;
  profile?: {
    name?: unknown;
  };
};

type WhatsappWebhookMessage = {
  id?: unknown;
  from?: unknown;
  type?: unknown;
  text?: {
    body?: unknown;
  };
};

type WhatsappWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: {
          phone_number_id?: unknown;
        };
        statuses?: WhatsappWebhookStatus[];
        messages?: WhatsappWebhookMessage[];
        contacts?: WhatsappWebhookContact[];
      };
    }>;
  }>;
};

type InterestRequestRow = {
  id: number;
  code: string;
  product_sku: string;
  product_slug: string | null;
  product_name: string | null;
  product_size: string | null;
  product_color: string | null;
  seller_id: number | null;
  seller_notification_message_id: string | null;
};

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function extractStatuses(payload: WhatsappWebhookPayload) {
  const statuses: Array<{
    messageId: string;
    status: string;
    recipientPhone: string | null;
    phoneNumberId: string | null;
    payload: WhatsappWebhookStatus;
  }> = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const phoneNumberId = getString(
        change.value?.metadata?.phone_number_id
      );

      for (const status of change.value?.statuses ?? []) {
        const messageId = getString(status.id);
        const statusValue = getString(status.status);
        if (!messageId || !statusValue) continue;

        statuses.push({
          messageId,
          status: statusValue,
          recipientPhone: getString(status.recipient_id),
          phoneNumberId,
          payload: status,
        });
      }
    }
  }

  return statuses;
}

function extractInterestCode(message: string) {
  const match = message.match(/\bINT-[A-F0-9]{6}\b/i);
  return match ? match[0].toUpperCase() : null;
}

function normalizeInboundPhone(waId: string | null) {
  return waId ? `+${waId.replace(/\D/g, '')}` : null;
}

function getContactName(
  contacts: WhatsappWebhookContact[] | undefined,
  waId: string | null
) {
  if (!waId) return null;

  const contact = contacts?.find((item) => getString(item.wa_id) === waId);
  return getString(contact?.profile?.name);
}

function getProductUrl(request: InterestRequestRow) {
  return request.product_slug
    ? `https://circular.moda/products/${request.product_slug}`
    : null;
}

function toProductSnapshot(request: InterestRequestRow): ProductInterestSnapshot {
  return {
    sku: request.product_sku,
    name: request.product_name,
    size: request.product_size,
    color: request.product_color,
    url: getProductUrl(request),
  };
}

async function handleIncomingInterestMessage(input: {
  message: WhatsappWebhookMessage;
  contacts: WhatsappWebhookContact[] | undefined;
  phoneNumberId: string | null;
}) {
  const body = getString(input.message.text?.body);
  const waId = getString(input.message.from);
  const messageId = getString(input.message.id);
  const code = body ? extractInterestCode(body) : null;
  const buyerPhone = normalizeInboundPhone(waId);
  const buyerName = getContactName(input.contacts, waId) ?? 'Compradora';

  let requestRow: InterestRequestRow | null = null;

  if (code) {
    const { data, error } = await supabase
      .from('product_interest_requests')
      .select(
        [
          'id',
          'code',
          'product_sku',
          'product_slug',
          'product_name',
          'product_size',
          'product_color',
          'seller_id',
          'seller_notification_message_id',
        ].join(', ')
      )
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('[WhatsApp Webhook] Interest request lookup failed:', error);
    } else {
      requestRow = data as InterestRequestRow | null;
    }
  }

  await insertWhatsappLog({
    product_interest_request_id: requestRow?.id ?? null,
    direction: 'inbound',
    recipient_phone: buyerPhone,
    message_id: messageId,
    status: code ? 'matched_interest_code' : 'unmatched',
    payload: {
      phoneNumberId: input.phoneNumberId,
      waId,
      profileName: buyerName,
      code,
      body,
    },
  });

  if (!requestRow || !buyerPhone) {
    return {
      matched: Boolean(requestRow),
      sellerNotified: false,
      reason: requestRow ? 'buyer_phone_missing' : 'interest_code_not_found',
    };
  }

  await updateInterestRequest(requestRow.id, {
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    buyer_consent_at: new Date().toISOString(),
    buyer_consent_source: 'whatsapp_inbound_message',
  });

  if (requestRow.seller_notification_message_id) {
    return {
      matched: true,
      sellerNotified: false,
      reason: 'already_notified',
    };
  }

  const seller = await findProductInterestSeller(requestRow.seller_id);
  const automation = await maybeNotifyProductSeller({
    requestId: requestRow.id,
    seller,
    buyerName,
    buyerPhone,
    buyerConsent: true,
    product: toProductSnapshot(requestRow),
  });

  return {
    matched: true,
    sellerNotified: automation.sellerNotified,
    reason: automation.reason,
  };
}

async function storeStatus(input: {
  messageId: string;
  status: string;
  recipientPhone: string | null;
  phoneNumberId: string | null;
  payload: WhatsappWebhookStatus;
}) {
  const { data: matchingRequest, error: matchError } = await supabase
    .from('product_interest_requests')
    .select('id')
    .eq('seller_notification_message_id', input.messageId)
    .maybeSingle();

  if (matchError) {
    console.error('[WhatsApp Webhook] Request match failed:', matchError);
  }

  const requestId =
    matchingRequest &&
    typeof matchingRequest === 'object' &&
    'id' in matchingRequest
      ? matchingRequest.id
      : null;

  const { error: logError } = await supabase
    .from('whatsapp_message_logs')
    .insert({
      product_interest_request_id: requestId,
      direction: 'status',
      recipient_phone: input.recipientPhone,
      message_id: input.messageId,
      status: input.status,
      payload: {
        phoneNumberId: input.phoneNumberId,
        status: input.payload,
      },
    });

  if (logError) {
    console.error('[WhatsApp Webhook] Status log failed:', logError);
  }

  if (requestId) {
    const { error: updateError } = await supabase
      .from('product_interest_requests')
      .update({
        last_whatsapp_status: input.status,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[WhatsApp Webhook] Request status update failed:', updateError);
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const verificationResponse = verifyWhatsappWebhookToken(
    searchParams.get('hub.mode'),
    searchParams.get('hub.verify_token'),
    searchParams.get('hub.challenge')
  );

  if (verificationResponse) return verificationResponse;

  return NextResponse.json(
    { error: 'Invalid WhatsApp webhook verification' },
    { status: 403, headers: CACHE_HEADERS }
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifyMetaSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json(
      { error: 'Invalid WhatsApp webhook signature' },
      { status: 401, headers: CACHE_HEADERS }
    );
  }

  let payload: WhatsappWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhatsappWebhookPayload;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  if (!isSupabaseConfigured()) {
    console.error('[WhatsApp Webhook] Supabase is not configured');
    return NextResponse.json(
      { ok: true, stored: false },
      { headers: CACHE_HEADERS }
    );
  }

  const statuses = extractStatuses(payload);
  const inboundResults: unknown[] = [];

  for (const status of statuses) {
    await storeStatus(status);
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const phoneNumberId = getString(
        change.value?.metadata?.phone_number_id
      );

      for (const message of change.value?.messages ?? []) {
        if (getString(message.type) !== 'text') continue;
        inboundResults.push(
          await handleIncomingInterestMessage({
            message,
            contacts: change.value?.contacts,
            phoneNumberId,
          })
        );
      }
    }
  }

  return NextResponse.json(
    { ok: true, statuses: statuses.length, inbound: inboundResults.length },
    { headers: CACHE_HEADERS }
  );
}
