import type { Product } from './types';

export const CIRCULAR_WHATSAPP_NUMBER = '5491125115030';

export const INTRODUCTION_STATUSES = [
  'new',
  'seller_contacted',
  'buyer_contacted',
  'group_created',
  'sale_coordinated',
  'cancelled',
] as const;

export type IntroductionStatus = (typeof INTRODUCTION_STATUSES)[number];

export const INTRODUCTION_STATUS_LABELS: Record<IntroductionStatus, string> = {
  new: 'Nueva',
  seller_contacted: 'Vendedora contactada',
  buyer_contacted: 'Compradora contactada',
  group_created: 'Grupo creado',
  sale_coordinated: 'Venta coordinada',
  cancelled: 'Cancelada',
};

export type ProductInterestSnapshot = {
  sku: string;
  name?: string | null;
  size?: string | null;
  color?: string | null;
  url?: string | null;
};

export type SellerProductInterestTemplateInput = {
  sellerName?: string | null;
  buyerName: string;
  buyerPhone: string;
  product: ProductInterestSnapshot;
};

export type IntroductionTemplateInput = {
  code: string;
  product: ProductInterestSnapshot;
  sellerName?: string | null;
  buyerName?: string | null;
  availabilityConfirmed?: boolean;
};

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function isIntroductionStatus(
  value: unknown
): value is IntroductionStatus {
  return (
    typeof value === 'string' &&
    INTRODUCTION_STATUSES.includes(value as IntroductionStatus)
  );
}

export function getFirstName(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  return cleaned.split(/\s+/)[0] || cleaned;
}

export function getProductDisplayName(product: ProductInterestSnapshot) {
  return cleanText(product.name) ?? `prenda ${product.sku}`;
}

export function getProductSize(product: ProductInterestSnapshot) {
  return cleanText(product.size) ?? 'Desconocido';
}

export function getProductColor(product: ProductInterestSnapshot) {
  return cleanText(product.color) ?? 'Desconocido';
}

export function normalizeWhatsappPhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, '') ?? '';
  return digits.length >= 8 ? digits : null;
}

export function buildWhatsappUrl(
  phone: string | null | undefined,
  message: string
) {
  const digits = normalizeWhatsappPhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function getProductInterestSnapshot(product: Product) {
  return {
    sku: product.SKU,
    name: product['Product Name'],
    size: product.Size ?? product.size,
    color: product.Color ?? product.color,
    url: product.slug ? `/products/${product.slug}` : null,
  };
}

export function buildLegacyProductInterestMessage(
  product: ProductInterestSnapshot
) {
  return `Hola me interesa esa prenda talla: ${getProductSize(product)}, color: ${getProductColor(product)}, SKU: ${product.sku}`;
}

export function buildCircularProductInterestMessage(input: {
  code: string;
  product: ProductInterestSnapshot;
  buyerName?: string | null;
  buyerPhone?: string | null;
}) {
  const lines = [
    'Hola Circular.moda, me interesa esta prenda.',
    `Código: ${input.code}`,
    cleanText(input.buyerName) ? `Nombre: ${input.buyerName}` : null,
    cleanText(input.buyerPhone) ? `WhatsApp: ${input.buyerPhone}` : null,
    `SKU: ${input.product.sku}`,
    `Prenda: ${getProductDisplayName(input.product)}`,
    `Talla: ${getProductSize(input.product)}`,
    `Color: ${getProductColor(input.product)}`,
    cleanText(input.product.url) ? `Link: ${input.product.url}` : null,
    'Acepto que Circular.moda comparta mi nombre y WhatsApp con la vendedora para coordinar esta prenda.',
    '¿Me ayudan a ponerme en contacto con la vendedora?',
  ];

  return lines.filter((line): line is string => line !== null).join('\n');
}

export function buildSellerProductInterestTemplateText({
  sellerName,
  buyerName,
  buyerPhone,
  product,
}: SellerProductInterestTemplateInput) {
  const sellerFirstName = getFirstName(sellerName) ?? 'vendedora';
  const buyerLabel = getFirstName(buyerName) ?? buyerName.trim();

  return [
    `Hola ${sellerFirstName}, ${buyerLabel} está interesada en tu prenda ${getProductDisplayName(product)}.`,
    `SKU: ${product.sku}`,
    `Talla: ${getProductSize(product)} · Color: ${getProductColor(product)}`,
    `WhatsApp de la compradora: ${buyerPhone}`,
    cleanText(product.url) ? `Detalle: ${product.url}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

export function buildSellerProductInterestTemplateParameters(
  input: SellerProductInterestTemplateInput
) {
  return [
    getFirstName(input.sellerName) ?? 'vendedora',
    getFirstName(input.buyerName) ?? input.buyerName.trim(),
    getProductDisplayName(input.product),
    input.product.sku,
    input.buyerPhone,
    cleanText(input.product.url) ?? 'https://circular.moda',
  ].map((text) => ({ type: 'text' as const, text }));
}

export function buildFallbackCircularWhatsappUrl(
  product: ProductInterestSnapshot
) {
  return (
    buildWhatsappUrl(
      CIRCULAR_WHATSAPP_NUMBER,
      buildLegacyProductInterestMessage(product)
    ) ?? `https://wa.me/${CIRCULAR_WHATSAPP_NUMBER}`
  );
}

export function buildSellerIntroductionMessage({
  product,
  sellerName,
  buyerName,
  availabilityConfirmed = false,
}: IntroductionTemplateInput) {
  const sellerFirstName = getFirstName(sellerName);
  const buyerLabel = getFirstName(buyerName) ?? 'una compradora';
  const greeting = sellerFirstName ? `Hola ${sellerFirstName}` : 'Hola';
  const availabilityLine = availabilityConfirmed
    ? 'La disponibilidad ya está confirmada.'
    : 'Te escribo para confirmar si sigue disponible.';

  return [
    `${greeting}, ${buyerLabel} está interesada en tu prenda ${product.sku}.`,
    `Prenda: ${getProductDisplayName(product)}`,
    `Talla: ${getProductSize(product)} · Color: ${getProductColor(product)}`,
    '',
    availabilityLine,
    'Te voy a sumar a un grupo con ella para que puedan coordinar pago y entrega directamente.',
  ].join('\n');
}

export function buildBuyerIntroductionMessage({
  product,
  sellerName,
  buyerName,
  availabilityConfirmed = false,
}: IntroductionTemplateInput) {
  const buyerFirstName = getFirstName(buyerName);
  const sellerFirstName = getFirstName(sellerName) ?? 'la vendedora';
  const greeting = buyerFirstName ? `Hola ${buyerFirstName}` : 'Hola';
  const availabilityLine = availabilityConfirmed
    ? `la prenda ${product.sku} está disponible.`
    : `estoy validando si la prenda ${product.sku} sigue disponible.`;

  return [
    `${greeting}, ${availabilityLine}`,
    `Prenda: ${getProductDisplayName(product)}`,
    `Talla: ${getProductSize(product)} · Color: ${getProductColor(product)}`,
    '',
    `Te voy a sumar a un grupo con ${sellerFirstName} para que puedan coordinar pago y entrega directamente.`,
  ].join('\n');
}

export function buildGroupIntroductionMessage({
  product,
  sellerName,
  buyerName,
  availabilityConfirmed = false,
}: IntroductionTemplateInput) {
  const buyerFirstName = getFirstName(buyerName) ?? 'Compradora';
  const sellerFirstName = getFirstName(sellerName) ?? 'Vendedora';
  const availabilityLine = availabilityConfirmed
    ? 'La prenda está disponible.'
    : 'Queda pendiente confirmar la disponibilidad final.';

  return [
    `Hola ${buyerFirstName} y ${sellerFirstName}, las presento por la prenda ${product.sku}.`,
    `Prenda: ${getProductDisplayName(product)}`,
    `Talla: ${getProductSize(product)} · Color: ${getProductColor(product)}`,
    '',
    `${buyerFirstName} está interesada y ${sellerFirstName} es la vendedora. ${availabilityLine}`,
    '',
    'Coordinen por acá pago y entrega directamente. Circular no cobra comisión; quedo en el grupo solo por si necesitan ayuda.',
  ].join('\n');
}
