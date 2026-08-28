'use client';

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'flowbite-react';
import {
  HiArrowTrendingUp,
  HiBolt,
  HiCamera,
  HiChartBar,
  HiCheckBadge,
  HiCheckCircle,
  HiExclamationTriangle,
  HiMegaphone,
  HiSparkles,
} from 'react-icons/hi2';
import {
  BOOST_OFFER,
  PREMIUM_OFFER,
  getDefaultOfferForFeature,
  type MonetizationFeature,
  type MonetizationOffer,
  type MonetizationSource,
} from '@/app/lib/monetization-interest';
import Button from '@/app/ui/button';

type TeaserIntent = {
  feature: MonetizationFeature;
  source: MonetizationSource;
  productId?: number | string;
  productName?: string;
};

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const INTEREST_STORAGE_KEY = 'circular.monetizationInterest.v1';

const PREMIUM_FEATURE_CARDS: Array<{
  label: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  feature: MonetizationFeature;
}> = [
  {
    label: 'Completar con IA',
    detail: 'Título, categoría, color y descripción sugeridos.',
    icon: HiBolt,
    feature: 'ai_listing',
  },
  {
    label: 'Optimizar fotos',
    detail: 'Mejoras automáticas para que se vean mejor.',
    icon: HiCamera,
    feature: 'photo_optimization',
  },
  {
    label: 'Estadísticas',
    detail: 'Vistas, clics e interés por tus prendas.',
    icon: HiChartBar,
    feature: 'stats',
  },
  {
    label: 'Badge Plus',
    detail: 'Más confianza en tu perfil vendedor.',
    icon: HiCheckBadge,
    feature: 'seller_badge',
  },
  {
    label: 'Boost incluido',
    detail: 'Más visibilidad para alguna publicación.',
    icon: HiArrowTrendingUp,
    feature: 'plus',
  },
  {
    label: 'Campañas Circular',
    detail: 'Prioridad para selecciones y campañas pagas.',
    icon: HiMegaphone,
    feature: 'meta_campaign_visibility',
  },
];

function recordLocalDebugEvent(intent: TeaserIntent, offer: MonetizationOffer) {
  const event = {
    ...intent,
    event: 'submit',
    offerId: offer.id,
    offerTitle: offer.title,
    createdAt: new Date().toISOString(),
  };

  try {
    const current = JSON.parse(
      window.localStorage.getItem(INTEREST_STORAGE_KEY) ?? '[]'
    );
    const next = Array.isArray(current) ? [...current, event] : [event];
    window.localStorage.setItem(INTEREST_STORAGE_KEY, JSON.stringify(next));
  } catch {
    window.localStorage.setItem(INTEREST_STORAGE_KEY, JSON.stringify([event]));
  }

  console.info('[Monetization teaser]', event);
}

function getModalCopy(feature: MonetizationFeature, productName?: string) {
  if (feature === 'boost') {
    return {
      title: 'Boostear prenda',
      description: productName
        ? `Estamos preparando boosts para darle más visibilidad a "${productName}".`
        : 'Estamos preparando boosts para darle más visibilidad a tus prendas.',
      offer: BOOST_OFFER,
    };
  }

  if (feature === 'meta_campaign_visibility') {
    return {
      title: 'Campañas Circular',
      description:
        'Estamos preparando prioridad para vendedoras Plus en selecciones y anuncios de Circular.',
      offer: PREMIUM_OFFER,
    };
  }

  if (feature === 'photo_optimization') {
    return {
      title: 'Optimizar fotos con Plus',
      description:
        'Estamos preparando mejoras automáticas para que tus fotos pesen menos y se vean bien en el catálogo.',
      offer: PREMIUM_OFFER,
    };
  }

  if (feature === 'ai_listing') {
    return {
      title: 'Completar con IA',
      description:
        'Estamos preparando ayuda con IA para sugerir título, categoría, color y descripción.',
      offer: PREMIUM_OFFER,
    };
  }

  if (feature === 'stats') {
    return {
      title: 'Estadísticas Plus',
      description:
        'Estamos preparando estadísticas simples para entender qué prendas generan vistas, clics e interés.',
      offer: PREMIUM_OFFER,
    };
  }

  return {
    title: 'Circular Plus',
    description:
      'Estamos preparando un plan simple para publicar más rápido y conseguir más visibilidad.',
    offer: PREMIUM_OFFER,
  };
}

async function submitInterest(intent: TeaserIntent, offer: MonetizationOffer) {
  const response = await fetch('/api/monetization-interest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      feature: intent.feature,
      source: intent.source,
      productId: intent.productId,
      productName: intent.productName,
      offerId: offer.id,
      offerTitle: offer.title,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error ??
        'No pudimos registrar tu interés. Probá de nuevo en unos segundos.'
    );
  }

  return payload as { message?: string };
}

function OfferSummary({ offer }: { offer: MonetizationOffer }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-gray-950">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold text-emerald-700 uppercase">Oferta</p>
          <h3 className="mt-1 text-lg font-bold">{offer.title}</h3>
          <p className="mt-1 text-sm leading-6 text-gray-700">{offer.detail}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {offer.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm text-gray-800">
            <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MonetizationInterestModal({
  intent,
  onClose,
}: {
  intent: TeaserIntent | null;
  onClose: () => void;
}) {
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: 'idle',
  });
  const copy = useMemo(
    () =>
      intent
        ? getModalCopy(intent.feature, intent.productName)
        : {
            title: '',
            description: '',
            offer: getDefaultOfferForFeature('plus'),
          },
    [intent]
  );

  async function handleSubmit() {
    if (!intent || submitState.status === 'submitting') return;

    setSubmitState({ status: 'submitting' });
    try {
      await submitInterest(intent, copy.offer);
      recordLocalDebugEvent(intent, copy.offer);
      setSubmitState({
        status: 'success',
        message:
          'Tu interés quedó registrado. Te vamos a contactar pronto cuando esta opción esté disponible.',
      });
    } catch (error) {
      setSubmitState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No pudimos registrar tu interés. Probá de nuevo en unos segundos.',
      });
    }
  }

  function handleClose() {
    setSubmitState({ status: 'idle' });
    onClose();
  }

  return (
    <Modal show={intent != null} onClose={handleClose} size="3xl" dismissible>
      <ModalHeader>{copy.title}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
            {copy.description}
          </p>

          <OfferSummary offer={copy.offer} />

          {submitState.status === 'success' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
              <div className="flex gap-3">
                <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Interés registrado</p>
                  <p className="mt-1 text-sm">{submitState.message}</p>
                </div>
              </div>
            </div>
          )}

          {submitState.status === 'error' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
              <div className="flex gap-3">
                <HiExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{submitState.message}</p>
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="secondary"
          size="sm"
          text="Cerrar"
          onClick={handleClose}
        />
        {submitState.status !== 'success' && (
          <Button
            variant="primary"
            solid
            size="sm"
            text={
              submitState.status === 'submitting'
                ? 'Registrando...'
                : 'Me interesa'
            }
            onClick={handleSubmit}
            disabled={submitState.status === 'submitting'}
          />
        )}
      </ModalFooter>
    </Modal>
  );
}

export function MonetizationTeaserProvider({
  children,
}: {
  children: (openTeaser: (intent: TeaserIntent) => void) => ReactNode;
}) {
  const [intent, setIntent] = useState<TeaserIntent | null>(null);

  return (
    <>
      {children(setIntent)}
      <MonetizationInterestModal
        intent={intent}
        onClose={() => setIntent(null)}
      />
    </>
  );
}

export function PlusTeaserCard({
  source,
  onOpen,
  compact = false,
}: {
  source: MonetizationSource;
  onOpen: (intent: TeaserIntent) => void;
  compact?: boolean;
}) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <HiSparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">
              {PREMIUM_OFFER.title}
            </h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Próximamente
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
            {PREMIUM_OFFER.detail}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PREMIUM_FEATURE_CARDS.map((item) => (
            <div
              key={item.label}
              className="flex min-h-12 items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm font-medium text-gray-700"
            >
              <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                <span className="block">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 font-normal text-gray-500">
                  {item.detail}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Button
          variant="primary"
          solid
          size="sm"
          text="Me interesa Plus"
          onClick={() => onOpen({ feature: 'plus', source })}
          className="w-full sm:w-auto"
        />
      </div>
    </section>
  );
}

export function BoostTeaserButton({
  productId,
  productName,
  source = 'me_product_card',
  onOpen,
  className = '',
}: {
  productId?: number | string;
  productName?: string;
  source?: MonetizationSource;
  onOpen: (intent: TeaserIntent) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onOpen({
          feature: 'boost',
          source,
          productId,
          productName,
        })
      }
      className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100 focus:ring-2 focus:ring-amber-300 focus:outline-none ${className}`}
    >
      <HiArrowTrendingUp className="h-4 w-4" />
      Boostear
    </button>
  );
}

export function LockedPlusTools({
  source,
  onOpen,
}: {
  source: MonetizationSource;
  onOpen: (intent: TeaserIntent) => void;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">
            Herramientas Plus
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Publicá más rápido, mejorá tus anuncios y ganá visibilidad.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">
          Teaser
        </span>
      </div>

      <div>
        <Button
          variant="primary"
          solid
          size="sm"
          text="Me interesa Plus"
          onClick={() => onOpen({ feature: 'plus', source })}
          className="w-full"
        />
      </div>
    </section>
  );
}
