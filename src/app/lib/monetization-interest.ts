export const MONETIZATION_FEATURES = [
  'boost',
  'plus',
  'ai_listing',
  'photo_optimization',
  'stats',
  'seller_badge',
  'meta_campaign_visibility',
] as const;

export const MONETIZATION_SOURCES = [
  'me_banner',
  'me_sidebar',
  'me_product_card',
  'after_publish',
  'edit_product',
  'upload_form',
] as const;

export type MonetizationFeature = (typeof MONETIZATION_FEATURES)[number];
export type MonetizationSource = (typeof MONETIZATION_SOURCES)[number];

export type MonetizationOffer = {
  id: string;
  title: string;
  price: string;
  detail: string;
  features: string[];
};

export const PREMIUM_OFFER: MonetizationOffer = {
  id: 'circular_plus_founder',
  title: 'Circular Plus fundador',
  price: 'ARS 4.900 / mes',
  detail: 'Un plan simple para publicar mejor y vender con más visibilidad.',
  features: [
    'Completar publicación con IA',
    'Optimización automática de fotos',
    'Estadísticas de vistas, clics e interés',
    'Badge vendedor Plus',
    'Boost incluido',
    'Prioridad en selecciones Circular',
    'Opción para campañas pagas de Circular',
  ],
};

export const BOOST_OFFER: MonetizationOffer = {
  id: 'boost_single',
  title: 'Boost de prenda',
  price: 'ARS 2.500',
  detail: 'Una prenda destacada temporalmente para medir demanda.',
  features: [
    'Más visibilidad en el catálogo',
    'Posición destacada temporal',
    'Señal visual de prenda destacada',
    'Medición de clics e interés generado',
  ],
};

export function isMonetizationFeature(
  value: unknown
): value is MonetizationFeature {
  return (
    typeof value === 'string' &&
    MONETIZATION_FEATURES.includes(value as MonetizationFeature)
  );
}

export function isMonetizationSource(
  value: unknown
): value is MonetizationSource {
  return (
    typeof value === 'string' &&
    MONETIZATION_SOURCES.includes(value as MonetizationSource)
  );
}

export function getDefaultOfferForFeature(feature: MonetizationFeature) {
  return feature === 'boost' ? BOOST_OFFER : PREMIUM_OFFER;
}
