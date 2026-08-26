'use client';

import { useMemo, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa6';
import {
  buildFallbackCircularWhatsappUrl,
  getProductInterestSnapshot,
} from '@/app/lib/product-interest';
import type { Product } from '@/app/lib/types';
import Button from './button';

type ProductInterestButtonProps = {
  product: Product;
};

type ProductInterestResponse = {
  whatsappUrl?: unknown;
};

function openWhatsappUrl(url: string, popup: Window | null) {
  if (popup) {
    try {
      popup.opener = null;
    } catch {
      // Ignore browsers that block opener assignment.
    }
    popup.location.href = url;
    return;
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.href = url;
  }
}

export function ProductInterestButton({ product }: ProductInterestButtonProps) {
  const [loading, setLoading] = useState(false);
  const productSnapshot = useMemo(
    () => getProductInterestSnapshot(product),
    [product]
  );

  const fallbackUrl = useMemo(
    () => buildFallbackCircularWhatsappUrl(productSnapshot),
    [productSnapshot]
  );

  async function handleClick() {
    if (loading) return;
    setLoading(true);

    const popup = window.open('', '_blank');

    try {
      const response = await fetch('/api/product-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productSku: product.SKU,
          productSlug: product.slug,
        }),
      });

      if (!response.ok) {
        throw new Error('Interest request failed');
      }

      const data = (await response.json()) as ProductInterestResponse;
      const whatsappUrl =
        typeof data.whatsappUrl === 'string' && data.whatsappUrl.trim()
          ? data.whatsappUrl
          : fallbackUrl;

      openWhatsappUrl(whatsappUrl, popup);
    } catch (error) {
      console.warn('[Product Interest] Falling back to legacy WhatsApp:', error);
      openWhatsappUrl(fallbackUrl, popup);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="xl"
      text={loading ? 'Preparando contacto...' : 'Hacer una oferta al vendedor'}
      variant="primary"
      solid
      bold
      className="w-full text-white sm:w-auto dark:text-gray-900"
      onClick={handleClick}
      disabled={loading}
      endIcon={<FaWhatsapp className="ml-2 h-6 w-6" />}
    />
  );
}
