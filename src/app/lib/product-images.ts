import type { Product } from './types';

export type ProcessedImage = {
  url: string;
  originalUrl: string;
  fallbackUrl?: string;
  filename?: string;
  isLocal: boolean;
};

export function processProductImages(product: Product): ProcessedImage[] {
  if (!product.Images || product.Images.length === 0) return [];

  const seenUrls = new Set<string>();
  const uniqueImages = product.Images.filter((image) => {
    if (!image.url) return false;
    if (seenUrls.has(image.url)) {
      return false;
    }
    seenUrls.add(image.url);
    return true;
  });

  // Build local image paths using the same pattern as product-transformer.ts
  return uniqueImages.map((image) => {
    if (image.filename && product.id) {
      const normalizedFilename = image.filename.toLowerCase().replace(/ /g, '_');
      return {
        url: `/airtable/${product.id}-${normalizedFilename}`,
        originalUrl: image.url,
        fallbackUrl: image.url, // Airtable URL as fallback
        filename: image.filename,
        isLocal: true,
      };
    }
    return {
      url: image.url,
      originalUrl: image.url,
      fallbackUrl: image.url,
      filename: image.filename,
      isLocal: false,
    };
  });
}

export function getDisplayedImages(
  processedImages: ProcessedImage[]
): ProcessedImage[] {
  return processedImages.filter((img) => img.url && img.url.trim() !== '');
}

