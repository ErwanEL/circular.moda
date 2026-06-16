/**
 * Affiliate products (sponsored).
 *
 * Static, hand-curated source of affiliate products to interleave into the
 * public `/products` catalogue grid as clearly labeled "Patrocinado" cards.
 *
 * These products are NOT part of the Supabase/Airtable catalogue. They must
 * NOT appear in product detail pages (`/products/[slug]`), `/api/products`,
 * filters, the sitemap, or the monthly catalogue newsletter. They are rendered
 * client-side in the grid only and link out directly to the Temu affiliate URL.
 */

export interface AffiliateProduct {
  /** Stable, app-internal id. Prefixed `aff-` to avoid clashing with catalogue ids. */
  id: string;
  /** Source of the affiliate program. */
  source: 'temu';
  /** Outbound affiliate URL (opened in a new tab). */
  url: string;
  /** Spanish display title. */
  title: string;
  /** Price in ARS (Argentine pesos), as shown on the source listing. */
  priceArs: number;
  /** Human-readable sales count label, e.g. "4.9K+". */
  salesLabel: string;
  /** Local image asset path under `public/`. */
  image: string;
  /** Short category label for the card. */
  category: string;
}

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  {
    id: 'aff-temu-electric-lint-remover',
    source: 'temu',
    url: 'https://temu.to/k/gcpnh09ag6n',
    title:
      'Recortador Eléctrico de Pelusas Recargable, 6 Cuchillas, Pantalla LED Digital',
    priceArs: 15496,
    salesLabel: '4.9K+',
    image: '/affiliate/electric-lint-remover.webp',
    category: 'Cuidado de prendas',
  },
  {
    id: 'aff-temu-storage-bags-90l',
    source: 'temu',
    url: 'https://temu.to/k/g15pkhjjppn',
    title:
      'Juego de 3 Bolsas de Almacenamiento Extragrandes con Cremallera (90L)',
    priceArs: 17825,
    salesLabel: '68K+',
    image: '/affiliate/storage-bags-90l.webp',
    category: 'Organización',
  },
  {
    id: 'aff-temu-metal-shoe-rack',
    source: 'temu',
    url: 'https://temu.to/k/guutqplc5at',
    title:
      'Organizador Zapatero Metálico Independiente, Robusto y Ahorrador de Espacio',
    priceArs: 30179,
    salesLabel: '6.2K+',
    image: '/affiliate/metal-shoe-rack.webp',
    category: 'Organización',
  },
];

/**
 * Display frequency for affiliate cards in the catalogue grid.
 *
 * Conservative on purpose so sponsored cards never dominate the page:
 * the first appears after 20 organic product cards, then one every 24.
 * Affiliate products are rotated in array order.
 */
export const AFFILIATE_DISPLAY = {
  /** Index of the first organic card before which an affiliate card appears. */
  start: 20,
  /** Spacing (in organic cards) between affiliate cards after the first. */
  step: 24,
  /** Don't render any affiliate cards until at least this many products loaded. */
  minProducts: 20,
} as const;

/** Disclosure label required on every affiliate card. */
export const AFFILIATE_DISCLOSURE = 'Patrocinado';
