/**
 * Mapeo de valores de BD a etiquetas en español (Argentina) para la UI.
 * El valor enviado al backend sigue siendo el de la BD.
 */

const COLOR_LABELS: Record<string, string> = {
  black: 'Negro',
  white: 'Blanco',
  red: 'Rojo',
  blue: 'Azul',
  green: 'Verde',
  yellow: 'Amarillo',
  orange: 'Naranja',
  pink: 'Rosa',
  purple: 'Violeta',
  brown: 'Marrón',
  grey: 'Gris',
  gray: 'Gris',
  beige: 'Beige',
  navy: 'Azul marino',
  gold: 'Dorado',
  silver: 'Plateado',
  cream: 'Crema',
  burgundy: 'Bordeaux',
  mustard: 'Mostaza',
  coral: 'Coral',
  mint: 'Menta',
  lavender: 'Lavanda',
  olive: 'Oliva',
  tan: 'Tostado',
  charcoal: 'Carbón',
  ivory: 'Marfil',
  nude: 'Nude',
  multicolor: 'Multicolor',
  other: 'Otro',
};

const CATEGORY_LABELS: Record<string, string> = {
  dress: 'Vestido',
  dresses: 'Vestidos',
  pants: 'Pantalón',
  trousers: 'Pantalón',
  skirt: 'Pollera',
  skirts: 'Polleras',
  jacket: 'Campera / Saco',
  jackets: 'Camperas / Sacos',
  coat: 'Abrigo',
  coats: 'Abrigos',
  shirt: 'Remera / Camisa',
  shirts: 'Remeras / Camisas',
  t_shirt: 'Remera',
  tshirt: 'Remera',
  blouse: 'Blusa',
  blouses: 'Blusas',
  sweater: 'Sweater',
  sweaters: 'Sweaters',
  hoodie: 'Buzo con capucha',
  hoodies: 'Buzos con capucha',
  shorts: 'Short',
  jeans: 'Jeans',
  top: 'Top',
  tops: 'Tops',
  cardigan: 'Cardigan',
  cardigans: 'Cardigans',
  vest: 'Chaleco',
  vests: 'Chalecos',
  blazer: 'Blazer',
  blazers: 'Blazers',
  swimwear: 'Malla / Traje de baño',
  shoes: 'Zapatos',
  boots: 'Botas',
  sandals: 'Sandalias',
  accessory: 'Accesorio',
  accessories: 'Accesorios',
  bag: 'Cartera / Bolso',
  bags: 'Carteras / Bolsos',
  casual: 'Casual',
  formal: 'Formal',
  casual_wear: 'Ropa casual',
  formal_wear: 'Ropa formal',
  sportswear: 'Ropa deportiva',
  outerwear: 'Abrigos y camperas',
  underwear: 'Ropa interior',
  other: 'Otro',
};

const GENDER_LABELS: Record<string, string> = {
  female: 'Mujer',
  male: 'Hombre',
  unisex: 'Unisex',
  women: 'Mujer',
  men: 'Hombre',
  woman: 'Mujer',
  man: 'Hombre',
  kids: 'Niños',
  child: 'Niño',
  boy: 'Niño',
  girl: 'Niña',
  other: 'Otro',
};

function fallbackLabel(value: string): string {
  if (!value) return value;
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getColorLabel(dbValue: string): string {
  const key = dbValue.toLowerCase().trim();
  return COLOR_LABELS[key] ?? fallbackLabel(dbValue);
}

export function getCategoryLabel(dbValue: string): string {
  const normalized = dbValue.toLowerCase().trim().replace(/\s+/g, '_').replace(/-/g, '_');
  return (
    CATEGORY_LABELS[normalized] ??
    CATEGORY_LABELS[dbValue.toLowerCase().trim()] ??
    fallbackLabel(dbValue)
  );
}

export function getGenderLabel(dbValue: string): string {
  const key = dbValue.toLowerCase().trim();
  return GENDER_LABELS[key] ?? fallbackLabel(dbValue);
}
