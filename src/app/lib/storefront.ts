export const STOREFRONT_CITY = 'Buenos Aires (CABA)';
// Source: https://buenosaires.gob.ar/gcaba_historico/mapas-tematicos-ba/mapas-de-barrios
export const CABA_NEIGHBORHOODS: readonly string[] = [
  'Agronomía',
  'Almagro',
  'Balvanera',
  'Barracas',
  'Belgrano',
  'Boedo',
  'Caballito',
  'Chacarita',
  'Coghlan',
  'Colegiales',
  'Constitución',
  'Flores',
  'Floresta',
  'La Boca',
  'La Paternal',
  'Liniers',
  'Mataderos',
  'Monserrat',
  'Monte Castro',
  'Nueva Pompeya',
  'Núñez',
  'Palermo',
  'Parque Avellaneda',
  'Parque Chacabuco',
  'Parque Chas',
  'Parque Patricios',
  'Puerto Madero',
  'Recoleta',
  'Retiro',
  'Saavedra',
  'San Cristóbal',
  'San Nicolás',
  'San Telmo',
  'Vélez Sarsfield',
  'Versalles',
  'Villa Crespo',
  'Villa del Parque',
  'Villa Devoto',
  'Villa General Mitre',
  'Villa Lugano',
  'Villa Luro',
  'Villa Ortúzar',
  'Villa Pueyrredón',
  'Villa Real',
  'Villa Riachuelo',
  'Villa Santa Rita',
  'Villa Soldati',
  'Villa Urquiza',
];

export interface StorefrontSettings {
  boutique_name: string;
  bio: string;
  city: string;
  neighborhood: string;
  avatar_url: string | null;
  pinned_product_ids: number[];
}

export function parseStorefront(
  value: Record<string, unknown>
): Omit<StorefrontSettings, 'avatar_url'> {
  const text = (key: string, limit: number) => {
    if (
      typeof value[key] !== 'string' ||
      (value[key] as string).trim().length > limit
    )
      throw new Error(
        'Revisá el nombre (60), la presentación (300) (caracteres).'
      );
    return (value[key] as string).trim();
  };
  const neighborhood =
    value.neighborhood === undefined ? '' : value.neighborhood;
  if (
    typeof neighborhood !== 'string' ||
    (neighborhood !== '' && !CABA_NEIGHBORHOODS.includes(neighborhood))
  )
    throw new Error('Elegí un barrio de CABA de la lista.');
  const ids = value.pinned_product_ids;
  if (
    !Array.isArray(ids) ||
    ids.length > 3 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
  )
    throw new Error('Elegí hasta tres prendas distintas.');
  return {
    boutique_name: text('boutique_name', 60),
    bio: text('bio', 300),
    city: STOREFRONT_CITY,
    neighborhood,
    pinned_product_ids: ids,
  };
}

export function splitStorefrontProducts<T extends { id: string }>(
  products: T[],
  ids: number[]
) {
  const byId = new Map(products.map((p) => [String(p.id), p]));
  const pinned = ids
    .flatMap((id) => {
      const p = byId.get(String(id));
      return p ? [p] : [];
    })
    .slice(0, 3);
  const selected = new Set(pinned.map((p) => p.id));
  return { pinned, rest: products.filter((p) => !selected.has(p.id)) };
}
