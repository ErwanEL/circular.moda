import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import {
  normalizeSubscriberEmail,
  parseUnsubscribeToken,
  unlinkBrevoCatalogueContact,
} from '@/app/lib/catalogue-newsletter';

type UnsubscribePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type UnsubscribeResult = {
  title: string;
  description: string;
  isSuccess: boolean;
};

async function unsubscribeEmail(email: string): Promise<UnsubscribeResult> {
  const normalizedEmail = normalizeSubscriberEmail(email);
  if (!normalizedEmail) {
    return {
      title: 'Enlace inválido',
      description: 'No pudimos validar tu solicitud de baja.',
      isSuccess: false,
    };
  }

  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from('catalogue_subscriptions')
    .update({
      status: 'unsubscribed',
      processing_started_at: null,
      updated_at: nowIso,
    })
    .eq('email', normalizedEmail);

  if (error) {
    console.error('[newsletter/unsubscribe] Failed to update subscription:', error);
    return {
      title: 'No pudimos procesar la baja',
      description:
        'Hubo un problema al actualizar tu suscripción. Probá de nuevo en unos minutos.',
      isSuccess: false,
    };
  }

  try {
    await unlinkBrevoCatalogueContact(normalizedEmail);
  } catch (brevoError) {
    console.error('[newsletter/unsubscribe] Failed to unlink Brevo contact:', brevoError);
  }

  return {
    title: 'Tu baja fue confirmada',
    description:
      'Ya no vas a recibir las novedades mensuales del catálogo. Si querés volver a suscribirte, podés hacerlo desde la página de productos.',
    isSuccess: true,
  };
}

export default async function NewsletterUnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const resolvedSearchParams = await searchParams;
  const tokenParam = resolvedSearchParams.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  const email = token ? parseUnsubscribeToken(token) : null;
  const result = email
    ? await unsubscribeEmail(email)
    : {
        title: 'Enlace inválido',
        description: 'El enlace de baja es inválido o está incompleto.',
        isSuccess: false,
      };

  return (
    <main className="min-h-screen bg-[#f7f4e8] px-4 py-16">
      <section className="mx-auto max-w-2xl rounded-[32px] border border-[#dce6c6] bg-white/90 p-8 shadow-[0_24px_70px_rgba(151,171,111,0.18)] sm:p-10">
        <span
          className={`inline-flex rounded-full px-4 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${
            result.isSuccess
              ? 'bg-[#eef7da] text-[#69963c]'
              : 'bg-[#f8e7df] text-[#a4513d]'
          }`}
        >
          Newsletter
        </span>
        <h1 className="mt-5 text-3xl font-semibold text-[#1f2a1b] sm:text-4xl">
          {result.title}
        </h1>
        <p className="mt-4 max-w-[46ch] text-lg leading-8 text-[#5c6655]">
          {result.description}
        </p>
        <div className="mt-8">
          <Link
            href="/products"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#6f9f3b] px-6 text-sm font-semibold text-white transition hover:bg-[#5f8c32]"
          >
            Volver al catálogo
          </Link>
        </div>
      </section>
    </main>
  );
}
