import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import {
  calculateNextMonthlySendAt,
  normalizeSubscriberEmail,
  unlinkBrevoCatalogueContact,
  upsertBrevoCatalogueContact,
} from '@/app/lib/catalogue-newsletter';

type SubscribeRequestBody = {
  email?: string;
};

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let email: string | null = null;
  let brevoSubscriptionCreated = false;

  try {
    const body = (await request.json()) as SubscribeRequestBody;
    email = body.email ? normalizeSubscriberEmail(body.email) : null;

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Ingresá un email válido para suscribirte.',
        },
        { status: 400 }
      );
    }

    await upsertBrevoCatalogueContact(email);
    brevoSubscriptionCreated = true;

    const now = new Date();
    const nextSendAt = calculateNextMonthlySendAt(now).toISOString();
    const nowIso = now.toISOString();
    const { data: existingSubscription, error: existingSubscriptionError } =
      await supabase
        .from('catalogue_subscriptions')
        .select(
          'id, email, status, subscribed_at, next_send_at, last_sent_at, last_window_end_at'
        )
        .eq('email', email)
        .maybeSingle();

    if (existingSubscriptionError) {
      throw existingSubscriptionError;
    }

    const shouldKeepExistingSchedule =
      existingSubscription?.status === 'active' &&
      typeof existingSubscription.next_send_at === 'string' &&
      existingSubscription.next_send_at !== '';

    const { error } = await supabase.from('catalogue_subscriptions').upsert(
      {
        email,
        status: 'active',
        subscribed_at: shouldKeepExistingSchedule
          ? existingSubscription?.subscribed_at
          : nowIso,
        next_send_at: shouldKeepExistingSchedule
          ? existingSubscription?.next_send_at
          : nextSendAt,
        last_sent_at: shouldKeepExistingSchedule
          ? existingSubscription?.last_sent_at
          : null,
        last_window_end_at: shouldKeepExistingSchedule
          ? existingSubscription?.last_window_end_at
          : null,
        processing_started_at: null,
        last_error: null,
        updated_at: nowIso,
      },
      {
        onConflict: 'email',
        ignoreDuplicates: false,
      }
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      message: shouldKeepExistingSchedule
        ? 'Tu suscripción ya estaba activa. Te vamos a seguir enviando las novedades mensuales del catálogo.'
        : 'Listo. Ya quedaste suscripto para recibir las novedades mensuales del catálogo.',
    });
  } catch (error) {
    if (email && brevoSubscriptionCreated) {
      try {
        await unlinkBrevoCatalogueContact(email);
      } catch (rollbackError) {
        console.error(
          '[catalogue-subscribe] Failed to rollback Brevo subscription after route error:',
          rollbackError
        );
      }
    }

    console.error('[catalogue-subscribe] Failed to subscribe contact:', error);
    return NextResponse.json(
      {
        ok: false,
        message:
          'No pudimos registrar tu email en este momento. Volvé a intentarlo en unos minutos.',
      },
      { status: 500 }
    );
  }
}
