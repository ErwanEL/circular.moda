import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_GRAPH_API_VERSION = 'v26.0';
const DEFAULT_TEMPLATE_LANGUAGE = 'es_AR';
const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

export type WhatsappTemplateParameter = {
  type: 'text';
  text: string;
};

export type SendWhatsappTemplateInput = {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters: WhatsappTemplateParameter[];
};

export type WhatsappMessageResult = {
  messageId: string | null;
  raw: unknown;
};

export class WhatsappApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'WhatsappApiError';
    this.status = status;
    this.payload = payload;
  }
}

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getWhatsappConfig() {
  return {
    accessToken: env('WHATSAPP_ACCESS_TOKEN'),
    phoneNumberId: env('WHATSAPP_PHONE_NUMBER_ID'),
    verifyToken: env('WHATSAPP_VERIFY_TOKEN'),
    appSecret: env('WHATSAPP_APP_SECRET'),
    businessAccountId: env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
    graphApiVersion:
      env('WHATSAPP_GRAPH_API_VERSION') ??
      env('INSTAGRAM_GRAPH_API_VERSION') ??
      DEFAULT_GRAPH_API_VERSION,
    productInterestTemplate:
      env('WHATSAPP_PRODUCT_INTEREST_TEMPLATE') ??
      'product_interest_seller',
    templateLanguage:
      env('WHATSAPP_TEMPLATE_LANGUAGE') ?? DEFAULT_TEMPLATE_LANGUAGE,
    automationEnabled: env('WHATSAPP_AUTOMATION_ENABLED') === 'true',
  };
}

export function isWhatsappAutomationConfigured() {
  const config = getWhatsappConfig();
  return Boolean(config.accessToken && config.phoneNumberId);
}

export function isWhatsappAutomationEnabled() {
  const config = getWhatsappConfig();
  return config.automationEnabled && Boolean(config.accessToken && config.phoneNumberId);
}

export function normalizeWhatsappRecipient(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, '') ?? '';
  return digits.length >= 8 ? digits : null;
}

function getGraphUrl(path: string) {
  const config = getWhatsappConfig();
  return `https://graph.facebook.com/${config.graphApiVersion}/${path.replace(/^\/+/, '')}`;
}

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    payload.error &&
    typeof payload.error === 'object' &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message;
  }

  return 'WhatsApp API request failed';
}

export async function sendWhatsappTemplateMessage(
  input: SendWhatsappTemplateInput
): Promise<WhatsappMessageResult> {
  const config = getWhatsappConfig();

  if (!config.accessToken || !config.phoneNumberId) {
    throw new WhatsappApiError(
      'WhatsApp API is not configured',
      503,
      null
    );
  }

  const recipient = normalizeWhatsappRecipient(input.to);
  if (!recipient) {
    throw new WhatsappApiError('Invalid WhatsApp recipient', 400, null);
  }

  const response = await fetch(getGraphUrl(`${config.phoneNumberId}/messages`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: input.templateName,
        language: {
          code: input.languageCode ?? config.templateLanguage,
        },
        components: [
          {
            type: 'body',
            parameters: input.bodyParameters,
          },
        ],
      },
    }),
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new WhatsappApiError(
      getErrorMessage(payload),
      response.status,
      payload
    );
  }

  let messageId: string | null = null;
  if (
    payload &&
    typeof payload === 'object' &&
    'messages' in payload &&
    Array.isArray(payload.messages)
  ) {
    const firstMessage = payload.messages[0] as unknown;
    if (
      firstMessage &&
      typeof firstMessage === 'object' &&
      'id' in firstMessage &&
      typeof firstMessage.id === 'string'
    ) {
      messageId = firstMessage.id;
    }
  }

  return { messageId, raw: payload };
}

export function verifyWhatsappWebhookToken(
  mode: string | null,
  token: string | null,
  challenge: string | null
) {
  const config = getWhatsappConfig();
  if (!config.verifyToken) return null;
  if (mode !== 'subscribe' || token !== config.verifyToken || !challenge) {
    return null;
  }

  return new Response(challenge, {
    status: 200,
    headers: {
      ...CACHE_HEADERS,
      'Content-Type': 'text/plain',
    },
  });
}

export function verifyMetaSignature(rawBody: string, signature: string | null) {
  const config = getWhatsappConfig();
  if (!config.appSecret) return true;
  if (!signature?.startsWith('sha256=')) return false;

  const expected = createHmac('sha256', config.appSecret)
    .update(rawBody)
    .digest('hex');
  const actual = signature.slice('sha256='.length);

  try {
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}
