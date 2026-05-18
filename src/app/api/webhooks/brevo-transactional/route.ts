import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { normalizeSubscriberEmail } from '@/app/lib/catalogue-newsletter';

type BrevoEventPayload = Record<string, unknown>;

function extractEvents(payload: unknown): BrevoEventPayload[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is BrevoEventPayload =>
        item != null && typeof item === 'object' && !Array.isArray(item)
    );
  }

  if (payload && typeof payload === 'object') {
    if ('events' in payload && Array.isArray(payload.events)) {
      return extractEvents(payload.events);
    }

    return [payload as BrevoEventPayload];
  }

  return [];
}

function getStringValue(payload: BrevoEventPayload, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

function getEventName(payload: BrevoEventPayload): string {
  return (
    getStringValue(payload, ['event', 'type', 'event_type'])?.toLowerCase() || ''
  );
}

function getMessageId(payload: BrevoEventPayload): string | null {
  return getStringValue(payload, ['message-id', 'messageId', 'message_id']);
}

function getErrorDetails(payload: BrevoEventPayload): string | null {
  return getStringValue(payload, ['reason', 'error', 'description']);
}

async function updateCycleByMessageId(
  messageId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('catalogue_delivery_cycles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('brevo_message_id', messageId);

  if (error) {
    throw error;
  }
}

async function updateSubscriptionByEmail(
  email: string,
  updates: Record<string, unknown>
): Promise<void> {
  const normalizedEmail = normalizeSubscriberEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const { error } = await supabase
    .from('catalogue_subscriptions')
    .update({
      ...updates,
      processing_started_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('email', normalizedEmail);

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const events = extractEvents(body);

    for (const event of events) {
      const eventName = getEventName(event);
      const messageId = getMessageId(event);
      const email =
        getStringValue(event, ['email', 'recipient', 'to']) ?? undefined;
      const errorDetails = getErrorDetails(event);

      if (eventName.includes('deliver')) {
        if (messageId) {
          await updateCycleByMessageId(messageId, { status: 'delivered' });
        }
        continue;
      }

      if (eventName.includes('unsub')) {
        if (email) {
          await updateSubscriptionByEmail(email, { status: 'unsubscribed' });
        }
        if (messageId) {
          await updateCycleByMessageId(messageId, { status: 'unsubscribed' });
        }
        continue;
      }

      if (
        eventName.includes('block') ||
        eventName.includes('hard_bounce') ||
        eventName.includes('spam')
      ) {
        if (email) {
          await updateSubscriptionByEmail(email, {
            status: 'blocked',
            last_error: errorDetails,
          });
        }
        if (messageId) {
          await updateCycleByMessageId(messageId, {
            status: 'blocked',
            last_error: errorDetails,
          });
        }
        continue;
      }

      if (eventName.includes('error') || eventName.includes('invalid')) {
        if (messageId) {
          await updateCycleByMessageId(messageId, {
            status: 'error',
            last_error: errorDetails,
          });
        }
        if (email) {
          await updateSubscriptionByEmail(email, {
            last_error: errorDetails,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[brevo-transactional-webhook] Failed:', error);
    return NextResponse.json(
      { ok: false, message: 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
