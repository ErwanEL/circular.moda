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
 * Détecte si un produit vient de Supabase
 */
function isSupabaseProduct(product: Product): boolean {
  // Les produits Airtable ont des IDs qui commencent par "rec"
  const hasAirtableId = product.id?.startsWith('rec') || product.airtable_id;
  
  // Si les images sont des strings simples (URLs Supabase Storage), c'est Supabase
  if (product.Images && product.Images.length > 0) {
    const firstImage = product.Images[0];
    
    // Si c'est une string, c'est Supabase
    if (typeof firstImage === 'string') {
      return true;
    }
    
    // Si c'est un objet avec une URL Supabase Storage, c'est aussi Supabase
    if (typeof firstImage === 'object' && firstImage.url && firstImage.url.includes('supabase.co/storage')) {
      return true;
    }
  }
  
  // Si pas d'ID Airtable et pas d'images string, on assume que c'est Supabase si l'ID est numérique
  return !hasAirtableId && !!product.id && !isNaN(Number(product.id));
}

/**
 * Traite les images d'un produit pour utiliser les fichiers locaux quand disponibles
 * Gère les images Supabase (strings) et Airtable (objets)
 * Fallback vers les URLs originales si le fichier local n'existe pas
 * Évite les doublons basés sur URL, filename, ou ID d'image
 */
export function processProductImages(product: Product): ProcessedImage[] {
  if (!product.Images || product.Images.length === 0) return [];

  const isSupabase = isSupabaseProduct(product);
  const seenUrls = new Set<string>();
  const uniqueImages: any[] = [];

  // Normaliser les images: Supabase peut avoir des strings, Airtable des objets
  for (const image of product.Images) {
    let imageUrl: string;
    let imageObj: any;

    // Si c'est une string (Supabase Storage URL), la convertir en objet
    if (typeof image === 'string') {
      imageUrl = image;
      imageObj = { url: imageUrl };
    } else if (image && typeof image === 'object' && image.url) {
      // Objet Airtable avec url
      imageUrl = image.url;
      imageObj = image;
    } else {
      // Format non reconnu, ignorer
      continue;
    }

    // Ignorer les images sans URL valide
    if (!imageUrl || imageUrl.trim() === '') continue;

    // Dédupliquer par URL
    if (seenUrls.has(imageUrl)) {
      continue;
    }
    seenUrls.add(imageUrl);
    uniqueImages.push(imageObj);
  }

  // Traiter chaque image unique
  return uniqueImages.map((image) => {
    const imageUrl = typeof image === 'string' ? image : image.url;

    // Pour les produits Supabase: utiliser directement l'URL Supabase Storage
    if (isSupabase) {
      return {
        url: imageUrl,
        originalUrl: imageUrl,
        fallbackUrl: imageUrl,
        filename: image.filename || imageUrl.split('/').pop() || '',
        isLocal: false,
      };
    }

    // Pour les produits Airtable/JSON: essayer d'utiliser les fichiers locaux
    if (image.filename && product.id) {
      const localPath = buildLocalImagePath(product.id, image.filename);
      return {
        url: localPath, // Utiliser le chemin local en priorité
        originalUrl: imageUrl, // URL Airtable originale
        fallbackUrl: imageUrl, // Fallback vers Airtable si le fichier local échoue
        filename: image.filename,
        isLocal: true,
      };
    }

    // Si pas de filename, utiliser directement l'URL
    return {
      url: imageUrl,
      originalUrl: imageUrl,
      fallbackUrl: imageUrl,
      filename: image.filename || imageUrl.split('/').pop() || '',
      isLocal: false,
    };
  });
}

export function getDisplayedImages(
  processedImages: ProcessedImage[]
): ProcessedImage[] {
  return processedImages.filter((img) => img.url && img.url.trim() !== '');
}
