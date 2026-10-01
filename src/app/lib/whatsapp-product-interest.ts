import {
  buildSellerProductInterestTemplateParameters,
  buildSellerProductInterestTemplateText,
  type ProductInterestSnapshot,
} from './product-interest';
import { supabase } from './supabase';
import {
  getWhatsappConfig,
  isWhatsappAutomationConfigured,
  isWhatsappAutomationEnabled,
  sendWhatsappTemplateMessage,
} from './whatsapp-api';

export type ProductInterestSeller = {
  id: number;
  name: string | null;
  phone: string | null;
};

export type SellerNotificationResult = {
  enabled: boolean;
  configured: boolean;
  attempted: boolean;
  sellerNotified: boolean;
  messageId?: string | null;
  reason?: string;
};

export async function findProductInterestSeller(sellerId: number | null) {
  if (!sellerId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('id', sellerId)
    .maybeSingle();

  if (error) {
    console.error('[Product Interest] Seller fetch failed:', error);
    return null;
  }

  return data as ProductInterestSeller | null;
}

export async function insertWhatsappLog(payload: Record<string, unknown>) {
  const { error } = await supabase.from('whatsapp_message_logs').insert(payload);

  if (error) {
    console.error('[Product Interest] WhatsApp log insert failed:', error);
  }
}

export async function updateInterestRequest(
  id: number,
  payload: Record<string, unknown>
) {
  const { error } = await supabase
    .from('product_interest_requests')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('[Product Interest] Request update failed:', error);
  }
}

export async function maybeNotifyProductSeller(input: {
  requestId: number;
  seller: ProductInterestSeller | null;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerConsent: boolean;
  product: ProductInterestSnapshot;
}): Promise<SellerNotificationResult> {
  const config = getWhatsappConfig();

  if (!isWhatsappAutomationEnabled()) {
    return {
      enabled: false,
      configured: isWhatsappAutomationConfigured(),
      attempted: false,
      sellerNotified: false,
      reason: config.automationEnabled ? 'missing_whatsapp_config' : 'disabled',
    };
  }

  if (!input.buyerConsent || !input.buyerName || !input.buyerPhone) {
    return {
      enabled: true,
      configured: true,
      attempted: false,
      sellerNotified: false,
      reason: 'buyer_contact_missing',
    };
  }

  if (!input.seller?.phone) {
    return {
      enabled: true,
      configured: true,
      attempted: false,
      sellerNotified: false,
      reason: 'seller_phone_missing',
    };
  }

  const previewMessage = buildSellerProductInterestTemplateText({
    sellerName: input.seller.name,
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    product: input.product,
  });

  try {
    const result = await sendWhatsappTemplateMessage({
      to: input.seller.phone,
      templateName: config.productInterestTemplate,
      languageCode: config.templateLanguage,
      bodyParameters: buildSellerProductInterestTemplateParameters({
        sellerName: input.seller.name,
        buyerName: input.buyerName,
        buyerPhone: input.buyerPhone,
        product: input.product,
      }),
    });

    await updateInterestRequest(input.requestId, {
      status: 'seller_contacted',
      seller_whatsapp: input.seller.phone,
      seller_notified_at: new Date().toISOString(),
      seller_notification_message_id: result.messageId,
      seller_notification_error: null,
      last_whatsapp_status: 'accepted',
    });

    await insertWhatsappLog({
      product_interest_request_id: input.requestId,
      direction: 'outbound',
      recipient_phone: input.seller.phone,
      template_name: config.productInterestTemplate,
      message_id: result.messageId,
      status: 'accepted',
      payload: {
        previewMessage,
        response: result.raw,
      },
    });

    return {
      enabled: true,
      configured: true,
      attempted: true,
      sellerNotified: true,
      messageId: result.messageId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown WhatsApp API error';

    await updateInterestRequest(input.requestId, {
      seller_whatsapp: input.seller.phone,
      seller_notification_error: message,
      last_whatsapp_status: 'failed',
    });

    await insertWhatsappLog({
      product_interest_request_id: input.requestId,
      direction: 'outbound',
      recipient_phone: input.seller.phone,
      template_name: config.productInterestTemplate,
      status: 'failed',
      error: message,
      payload: { previewMessage },
    });

    return {
      enabled: true,
      configured: true,
      attempted: true,
      sellerNotified: false,
      reason: message,
    };
  }
}
