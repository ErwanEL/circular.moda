const COLOR_LABELS: Record<string, string> = {
  black: 'Negro',
  blue: 'Azul',
  brown: 'Marron',
  burgundy: 'Bordeaux',
  charcoal: 'Carbon',
  coral: 'Coral',
  cream: 'Crema',
  cyan: 'Cian',
  beige: 'Beige',
  gold: 'Dorado',
  gray: 'Gris',
  green: 'Verde',
  grey: 'Gris',
  ivory: 'Marfil',
  lavender: 'Lavanda',
  lime: 'Lima',
  magenta: 'Magenta',
  maroon: 'Granate',
  mint: 'Menta',
  mustard: 'Mostaza',
  navy: 'Azul marino',
  nude: 'Nude',
  olive: 'Oliva',
  orange: 'Naranja',
  other: 'Otro',
  pink: 'Rosa',
  purple: 'Violeta',
  red: 'Rojo',
  silver: 'Plateado',
  tan: 'Tostado',
  teal: 'Verde azulado',
  white: 'Blanco',
  yellow: 'Amarillo',
};

const CATEGORY_LABELS: Record<string, string> = {
  'accessories_(belts,_hats,_scarves)':
    'Accesorios (cinturones, sombreros, bufandas)',
  'activewear_/_sportswear': 'Ropa deportiva',
  accessories: 'Accesorios',
  accessory: 'Accesorio',
  bag: 'Cartera / bolso',
  'bags_and_wallets': 'Carteras y billeteras',
  bags: 'Carteras / bolsos',
  blazer: 'Blazer',
  blazers: 'Blazers',
  'blazers_and_suits': 'Blazers y trajes',
  blouse: 'Blusa',
  blouses: 'Blusas',
  boot: 'Bota',
  boots: 'Botas',
  cardigan: 'Cardigan',
  cardigans: 'Cardigans',
  casual: 'Casual',
  casual_wear: 'Ropa casual',
  coat: 'Abrigo',
  coats: 'Abrigos',
  dress: 'Vestido',
  dresses: 'Vestidos',
  'footwear_(sneakers,_boots,_sandals)':
    'Calzado (zapatillas, botas, sandalias)',
  formal: 'Formal',
  formal_wear: 'Ropa formal',
  hoodie: 'Buzo con capucha',
  hoodies: 'Buzos con capucha',
  'hoodies_and_sweatshirts': 'Buzos y sudaderas',
  jacket: 'Campera / saco',
  jackets: 'Camperas / sacos',
  'jackets_and_coats': 'Camperas y abrigos',
  jeans: 'Jeans',
  loungewear: 'Ropa de entrecasa',
  'maternity_wear': 'Ropa de maternidad',
  outerwear: 'Abrigos y camperas',
  other: 'Otro',
  pants: 'Pantalon',
  petite_fit: 'Talles petite',
  'plus_size': 'Talles grandes',
  'polo_shirts': 'Chombas / polos',
  sandals: 'Sandalias',
  shirt: 'Remera / camisa',
  shirts: 'Remeras / camisas',
  'shirts_and_tops': 'Remeras, camisas y tops',
  shorts: 'Shorts',
  skirt: 'Pollera',
  skirts: 'Polleras',
  'sleepwear_/_pajamas': 'Pijamas y ropa de dormir',
  'socks_and_hosiery': 'Medias y pantys',
  sportswear: 'Ropa deportiva',
  sweater: 'Sweater',
  sweaters: 'Sweaters',
  'sweaters_and_knitwear': 'Sweaters y tejidos',
  shoes: 'Zapatos',
  'swimwear': 'Mallas / trajes de bano',
  t_shirt: 'Remera',
  't-shirts': 'Remeras',
  top: 'Top',
  tops: 'Tops',
  trousers: 'Pantalon',
  'trousers_and_chinos': 'Pantalones y chinos',
  tshirt: 'Remera',
  underwear: 'Ropa interior',
  'underwear_and_lingerie': 'Ropa interior y lenceria',
  vest: 'Chaleco',
  vests: 'Chalecos',
  workwear: 'Ropa de trabajo',
};

const GENDER_LABELS: Record<string, string> = {
  child: 'Nino',
  female: 'Mujer',
  girl: 'Nina',
  kids: 'Ninos',
  male: 'Hombre',
  man: 'Hombre',
  men: 'Hombre',
  other: 'Otro',
  unisex: 'Unisex',
  woman: 'Mujer',
  women: 'Mujer',
};

function fallbackLabel(value: string): string {
  if (!value) {
    return value;
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getColorLabel(dbValue: string): string {
  const key = dbValue.toLowerCase().trim();
  return COLOR_LABELS[key] ?? fallbackLabel(dbValue);
}

export function getCategoryLabel(dbValue: string): string {
  const normalized = dbValue
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');

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
