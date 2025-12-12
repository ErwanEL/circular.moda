import type { Product } from './types';

export type ProcessedImage = {
  url: string;
  originalUrl: string;
  fallbackUrl?: string;
  filename?: string;
  isLocal: boolean;
};

/**
 * Construit le chemin local pour une image basé sur le product ID et filename
 * Les fichiers dans public/airtable/ suivent le pattern: {productId}-{filename}
 */
function buildLocalImagePath(productId: string, filename: string): string {
  // Normaliser le filename: lowercase et remplacer espaces par underscores
  const normalizedFilename = filename.toLowerCase().replace(/ /g, '_');
  return `/airtable/${productId}-${normalizedFilename}`;
}

/**
 * Traite les images d'un produit pour utiliser les fichiers locaux quand disponibles
 * Fallback vers les URLs Airtable si le fichier local n'existe pas
 * Évite les doublons basés sur URL, filename, ou ID d'image
 */
export function processProductImages(product: Product): ProcessedImage[] {
  if (!product.Images || product.Images.length === 0) return [];

  // Dédupliquer les images en utilisant plusieurs critères
  const seenUrls = new Set<string>();
  const seenFilenames = new Set<string>();
  const seenImageIds = new Set<string>();
  const uniqueImages: typeof product.Images = [];

  for (const image of product.Images) {
    // Ignorer les images sans URL
    if (!image.url) continue;

    // Créer une clé unique pour la déduplication
    const imageId = image.id || '';
    const filename = image.filename || '';
    const url = image.url;

    // Vérifier les doublons par ID d'image (le plus fiable)
    if (imageId && seenImageIds.has(imageId)) {
      continue;
    }

    // Vérifier les doublons par URL
    if (seenUrls.has(url)) {
      continue;
    }

    // Vérifier les doublons par filename (normalisé)
    if (filename) {
      const normalizedFilename = filename.toLowerCase().trim();
      if (normalizedFilename && seenFilenames.has(normalizedFilename)) {
        continue;
      }
      seenFilenames.add(normalizedFilename);
    }

    // Ajouter aux sets de tracking
    if (imageId) seenImageIds.add(imageId);
    seenUrls.add(url);

    // Ajouter l'image unique
    uniqueImages.push(image);
  }

  // Traiter chaque image unique pour utiliser les fichiers locaux
  return uniqueImages.map((image) => {
    // Si on a un filename et un product ID, essayer d'utiliser le fichier local
    if (image.filename && product.id) {
      const localPath = buildLocalImagePath(product.id, image.filename);
      return {
        url: localPath, // Utiliser le chemin local en priorité
        originalUrl: image.url, // URL Airtable originale
        fallbackUrl: image.url, // Fallback vers Airtable si le fichier local échoue
        filename: image.filename,
        isLocal: true,
      };
    }

    // Si pas de filename, utiliser directement l'URL Airtable
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
