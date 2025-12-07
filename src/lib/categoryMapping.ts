export const CATEGORY_TOPS = 'Partes de Arriba';
export const CATEGORY_BOTTOMS = 'Partes de Abajo';
export const CATEGORY_DRESSES = 'Vestidos y Monos';
export const CATEGORY_OUTERWEAR = 'Ropa de Abrigo';
export const CATEGORY_BEACHWEAR = 'Ropa de Playa';
export const CATEGORY_ACTIVEWEAR = 'Ropa Deportiva y Cómoda';
export const CATEGORY_SHOES = 'Zapatos';
export const CATEGORY_ACCESSORIES = 'Accesorios';
export const CATEGORY_OTHERS = 'Otros';

export const MASTER_CATEGORY_MAPPING: Record<string, string> = {
  // Partes de Arriba
  blouses: CATEGORY_TOPS,
  crop_tops: CATEGORY_TOPS,
  hoodies: CATEGORY_TOPS,
  shirts: CATEGORY_TOPS,
  sweaters: CATEGORY_TOPS,
  t_shirts: CATEGORY_TOPS,
  tank_tops: CATEGORY_TOPS,
  vests: CATEGORY_TOPS,
  body: CATEGORY_TOPS,

  // Partes de Abajo
  jeans: CATEGORY_BOTTOMS,
  shorts: CATEGORY_BOTTOMS,
  skirts: CATEGORY_BOTTOMS,
  trousers: CATEGORY_BOTTOMS,

  // Vestidos y Monos
  casual_dresses: CATEGORY_DRESSES,
  formal_dresses: CATEGORY_DRESSES,
  mini_dresses: CATEGORY_DRESSES,
  jumpsuits_rompers: CATEGORY_DRESSES,

  // Ropa de Abrigo
  blazers: CATEGORY_OUTERWEAR,
  jackets: CATEGORY_OUTERWEAR,

  // Ropa de Playa
  bikinis: CATEGORY_BEACHWEAR,
  cover_ups: CATEGORY_BEACHWEAR,

  // Ropa Deportiva y Cómoda
  lounge_sets: CATEGORY_ACTIVEWEAR,
  sports_bras: CATEGORY_ACTIVEWEAR,

  // Zapatos
  shoes: CATEGORY_SHOES,

  // Accesorios
  accessories: CATEGORY_ACCESSORIES,
};

export const getMasterCategory = (subCategory: string): string => {
  return MASTER_CATEGORY_MAPPING[subCategory] || CATEGORY_OTHERS;
};
