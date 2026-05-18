import { createHmac, timingSafeEqual } from 'node:crypto';

export const BREVO_CATALOGUE_LIST_ID = Number(
  process.env.BREVO_CATALOGUE_LIST_ID ?? '3'
);
export const BREVO_DAILY_SEND_CAP = Number(
  process.env.BREVO_DAILY_SEND_CAP ?? '250'
);
export const BUENOS_AIRES_TIME_ZONE = 'America/Argentina/Buenos_Aires';
export const BUENOS_AIRES_SEND_HOUR_UTC = 13;
export const NEWSLETTER_PRODUCT_LIMIT = 8;

export type CatalogueSubscriptionStatus =
  | 'active'
  | 'processing'
  | 'unsubscribed'
  | 'blocked'
  | 'errored';

export type CatalogueSendKind = 'new_products' | 'latest_picks';

export type CatalogueSubscriptionRow = {
  id: string;
  email: string;
  status: CatalogueSubscriptionStatus;
  subscribed_at: string;
  next_send_at: string;
  last_sent_at: string | null;
  last_window_end_at: string | null;
  processing_started_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogueDeliveryCycleRow = {
  id: string;
  subscription_id: string;
  cycle_due_date: string;
  window_start_at: string | null;
  window_end_at: string;
  send_kind: CatalogueSendKind;
  product_count: number;
  brevo_message_id: string | null;
  status: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsletterProduct = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  size: string | null;
  imageUrl: string | null;
  createdAt: string;
};

type ProductRow = {
  id: string | number;
  name?: string | null;
  slug?: string | null;
  public_id?: string | null;
  price?: number | string | null;
  size?: string | null;
  images?: unknown;
  created_at: string;
};

type ProductSlugSource = {
  id?: unknown;
  slug?: unknown;
  name?: unknown;
  public_id?: unknown;
};

type BrevoFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT';
  body?: Record<string, unknown>;
};

type UnsubscribeTokenPayload = {
  email: string;
};

type RenderCatalogueEmailInput = {
  intro: string;
  products: NewsletterProduct[];
  catalogueUrl: string;
  unsubscribeUrl: string;
};

function getBrevoApiKey(): string {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured.');
  }
  return apiKey;
}

function getNewsletterTokenSecret(): string {
  const secret = process.env.NEWSLETTER_TOKEN_SECRET;
  if (!secret) {
    throw new Error('NEWSLETTER_TOKEN_SECRET is not configured.');
  }
  return secret;
}

function getUtcDatePartsInBuenosAires(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUENOS_AIRES_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const valueFor = (type: 'year' | 'month' | 'day') => {
    const match = parts.find((part) => part.type === type)?.value;
    if (!match) {
      throw new Error(`Unable to resolve Buenos Aires ${type}.`);
    }
    return Number(match);
  };

  return {
    year: valueFor('year'),
    month: valueFor('month'),
    day: valueFor('day'),
  };
}

function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function coerceNumericPrice(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signUnsubscribePayload(payload: string): string {
  return createHmac('sha256', getNewsletterTokenSecret())
    .update(payload)
    .digest('base64url');
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function slugifyText(value: string): string {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildNewsletterProductSlug(source: ProductSlugSource): string | null {
  const title = toTrimmedString(source.name);
  const publicId = toTrimmedString(source.public_id);
  const explicitSlug = toTrimmedString(source.slug);

  if (publicId && title) {
    return `${slugifyText(title)}-${publicId}`;
  }

  if (publicId) {
    return publicId;
  }

  if (explicitSlug) {
    return explicitSlug;
  }

  const id = toTrimmedString(source.id);
  if (!id) {
    return null;
  }

  const fallbackSlug = slugifyText(id);
  return fallbackSlug === '' ? null : fallbackSlug;
}

export function normalizeSubscriberEmail(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === '') {
    return null;
  }

  const emailPattern =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

  return emailPattern.test(normalized) ? normalized : null;
}

export function calculateNextMonthlySendAt(date: Date): Date {
  const { year, month, day } = getUtcDatePartsInBuenosAires(date);
  const targetMonth = month === 12 ? 1 : month + 1;
  const targetYear = month === 12 ? year + 1 : year;
  const clampedDay = Math.min(day, getDaysInMonth(targetYear, targetMonth));

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth - 1,
      clampedDay,
      BUENOS_AIRES_SEND_HOUR_UTC,
      0,
      0,
      0
    )
  );
}

export function formatCycleDueDate(dateLike: Date | string): string {
  const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
  const { year, month, day } = getUtcDatePartsInBuenosAires(date);
  return `${year}-${padNumber(month)}-${padNumber(day)}`;
}

export function createUnsubscribeToken(email: string): string {
  const normalized = normalizeSubscriberEmail(email);
  if (!normalized) {
    throw new Error('Invalid subscriber email for unsubscribe token.');
  }

  const payload = base64UrlEncode(
    JSON.stringify({ email: normalized } satisfies UnsubscribeTokenPayload)
  );
  const signature = signUnsubscribePayload(payload);
  return `${payload}.${signature}`;
}

export function parseUnsubscribeToken(token: string): string | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signUnsubscribePayload(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      base64UrlDecode(payload)
    ) as Partial<UnsubscribeTokenPayload>;
    return parsed.email ? normalizeSubscriberEmail(parsed.email) : null;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(request?: Request): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (configuredUrl) {
    return configuredUrl.startsWith('http')
      ? configuredUrl.replace(/\/$/, '')
      : `https://${configuredUrl.replace(/\/$/, '')}`;
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return 'http://localhost:3000';
}

export function buildUnsubscribeUrl(siteUrl: string, email: string): string {
  const url = new URL('/newsletter/unsubscribe', siteUrl);
  url.searchParams.set('token', createUnsubscribeToken(email));
  return url.toString();
}

function extractPrimaryImageUrl(images: unknown): string | null {
  if (Array.isArray(images)) {
    const firstImage = images[0];
    if (typeof firstImage === 'string') {
      return firstImage;
    }

    if (
      firstImage &&
      typeof firstImage === 'object' &&
      'url' in firstImage &&
      typeof firstImage.url === 'string'
    ) {
      return firstImage.url;
    }
  }

  if (typeof images === 'string') {
    try {
      return extractPrimaryImageUrl(JSON.parse(images));
    } catch {
      return images;
    }
  }

  return null;
}

export function mapProductRowToNewsletterProduct(
  row: ProductRow
): NewsletterProduct | null {
  const title = row.name?.trim();
  if (!title) {
    return null;
  }

  const slug =
    row.slug?.trim() ||
    buildNewsletterProductSlug({
      id: row.id,
      name: row.name,
      public_id: row.public_id,
      slug: row.slug,
    });

  if (!slug) {
    return null;
  }

  return {
    id: String(row.id),
    title,
    slug,
    price: coerceNumericPrice(row.price),
    size: row.size?.trim() || null,
    imageUrl: extractPrimaryImageUrl(row.images),
    createdAt: row.created_at,
  };
}

export function formatNewsletterCurrency(value: number | null): string | null {
  if (value == null) {
    return null;
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderCatalogueEmail({
  intro,
  products,
  catalogueUrl,
  unsubscribeUrl,
}: RenderCatalogueEmailInput): string {
  const productCardsMarkup = products.map((product) => {
      const productUrl = `${catalogueUrl.replace(/\/$/, '')}/products/${product.slug}`;
      const formattedPrice = formatNewsletterCurrency(product.price);
      const formattedSize = product.size
        ? `<p style="margin:0 0 8px;color:#5f6c56;font-size:14px;">Talle: ${escapeHtml(product.size)}</p>`
        : '';
      const productImage = product.imageUrl
        ? `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.title)}" width="252" style="display:block;width:100%;height:220px;object-fit:cover;border-radius:18px;" />`
        : `<div style="height:220px;border-radius:18px;background:linear-gradient(135deg,#eef6dc,#dbeec4);"></div>`;

      return `
        <td style="width:50%;padding:8px;vertical-align:top;">
          <a href="${escapeHtml(productUrl)}" style="display:block;text-decoration:none;">
            ${productImage}
            <div style="padding:14px 4px 0;">
              <h2 style="margin:0 0 8px;color:#1e2b18;font-size:20px;line-height:1.25;">${escapeHtml(product.title)}</h2>
              ${formattedSize}
              ${
                formattedPrice
                  ? `<p style="margin:0;color:#67963b;font-size:20px;font-weight:700;">${escapeHtml(formattedPrice)}</p>`
                  : `<p style="margin:0;color:#67963b;font-size:16px;font-weight:600;">Ver detalle</p>`
              }
            </div>
          </a>
        </td>
      `;
    });

  const productRows: string[] = [];
  for (let index = 0; index < productCardsMarkup.length; index += 2) {
    const leftCard = productCardsMarkup[index];
    const rightCard =
      productCardsMarkup[index + 1] ??
      '<td style="width:50%;padding:8px;"></td>';
    productRows.push(`<tr>${leftCard}${rightCard}</tr>`);
  }

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Novedades de circular.moda</title>
      </head>
      <body style="margin:0;padding:0;background:#f6f3e8;font-family:Arial,sans-serif;color:#1e2b18;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          Recibí las nuevas prendas del catálogo de circular.moda.
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3e8;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fffef8;border:1px solid #e7ebd8;border-radius:28px;overflow:hidden;">
                <tr>
                  <td style="padding:32px 28px 18px;background:radial-gradient(circle at top left,#eef7da 0%,#fffef8 60%);">
                    <span style="display:inline-block;padding:8px 16px;border:1px solid #d4dfbb;border-radius:999px;color:#5b8a34;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Catálogo mensual</span>
                    <h1 style="margin:18px 0 12px;font-size:34px;line-height:1.15;color:#1e2b18;">Nuevas prendas en circular.moda</h1>
                    <p style="margin:0;font-size:16px;line-height:1.6;color:#4d5d45;">${escapeHtml(intro)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${productRows.join('')}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 32px;">
                    <a href="${escapeHtml(catalogueUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#6e9d3d;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">Ver todo el catálogo</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 28px 28px;font-size:12px;line-height:1.7;color:#73806a;">
                    Recibís este email porque te suscribiste para recibir las novedades del catálogo de circular.moda.
                    <br />
                    <a href="${escapeHtml(unsubscribeUrl)}" style="color:#5b8a34;">Darme de baja</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function brevoFetch<T>(
  path: string,
  { method = 'GET', body }: BrevoFetchOptions = {}
): Promise<T> {
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    method,
    headers: {
      'api-key': getBrevoApiKey(),
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function upsertBrevoCatalogueContact(email: string): Promise<void> {
  await brevoFetch('/contacts', {
    method: 'POST',
    body: {
      email,
      listIds: [BREVO_CATALOGUE_LIST_ID],
      updateEnabled: true,
    },
  });
}

export async function unlinkBrevoCatalogueContact(email: string): Promise<void> {
  await brevoFetch(`/contacts/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: {
      unlinkListIds: [BREVO_CATALOGUE_LIST_ID],
    },
  });
}

export async function sendBrevoTransactionalEmail(input: {
  to: string;
  subject: string;
  htmlContent: string;
  tags: string[];
}): Promise<string | null> {
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) {
    throw new Error('BREVO_SENDER_EMAIL is not configured.');
  }

  const response = await brevoFetch<{ messageId?: string; messageIds?: string[] }>(
    '/smtp/email',
    {
      method: 'POST',
      body: {
        sender: {
          name: 'circular.moda',
          email: senderEmail,
        },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.htmlContent,
        tags: input.tags,
      },
    }
  );

  if (typeof response.messageId === 'string' && response.messageId !== '') {
    return response.messageId;
  }

  if (Array.isArray(response.messageIds) && response.messageIds[0]) {
    return response.messageIds[0];
  }

  return null;
}
