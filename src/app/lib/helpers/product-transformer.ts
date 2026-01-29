import type { Product } from '../types';
import { getImageProxyUrl, CARD_IMAGE_WIDTH } from '../product-images';

export interface ProductCard {
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  badge: string;
  title: string;
  size?: string;
  sku: string;
  rating: {
    value: number;
    count: number;
  };
  price: string;
  href: string;
}

/**
 * Transforms Airtable products to match the Card component interface
 * @param products - Array of products from Airtable
 * @returns Array of transformed product cards
 */
/**
 * Construit le chemin local pour une image
 */
function buildLocalImagePath(productId: string, filename: string): string {
  const normalizedFilename = filename.toLowerCase().replace(/ /g, '_');
  return `/airtable/${productId}-${normalizedFilename}`;
}

/**
 * Extrait l'URL de la première image d'un produit
 * Gère les formats Supabase (string) et Airtable (objet avec url).
 * Pour Supabase, utilise le proxy avec w=CARD_IMAGE_WIDTH pour réduire la taille.
 */
function getProductImageUrl(product: Product): string | undefined {
  if (!product.Images || product.Images.length === 0) {
    return undefined;
  }

  const firstImage = product.Images[0];

  // Si c'est une string (Supabase), utiliser le proxy avec largeur carte
  if (typeof firstImage === 'string') {
    return getImageProxyUrl(firstImage, { w: CARD_IMAGE_WIDTH });
  }

  // Si c'est un objet avec url (Airtable ou Supabase)
  if (typeof firstImage === 'object' && firstImage.url) {
    if (firstImage.url.includes('supabase.co/storage')) {
      return getImageProxyUrl(firstImage.url, { w: CARD_IMAGE_WIDTH });
    }
    // Pour les produits Airtable, essayer d'abord le fichier local
    if (firstImage.filename && product.id && product.id.startsWith('rec')) {
      const localPath = buildLocalImagePath(product.id, firstImage.filename);
      return localPath;
    }
    // Sinon utiliser l'URL Airtable
    return firstImage.url;
  }

  return undefined;
}

export function transformProductsToCards(products: Product[]): ProductCard[] {
  return products.map((product) => {
    // Obtenir l'URL de l'image (gère Supabase et Airtable)
    const imageUrl = getProductImageUrl(product);
    const fallbackImage =
      'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg';
    const fallbackImageDark =
      'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front-dark.svg';

    return {
      image: {
        light: imageUrl || fallbackImage,
        dark: imageUrl || fallbackImageDark,
        alt: product['Product Name'] || `Product ${product.SKU}`,
      },
      badge: product.Category || product.category || 'Available',
      title: product['Product Name'] || `Product ${product.SKU}`,
      size: product.Size || product.size,
      sku: product.SKU?.toString() || product.slug || '',
      rating: {
        value: 5.0,
        count: Math.floor(Math.random() * 500) + 50, // Random rating count for demo
      },
      price:
        product.Price !== undefined ? `$${product.Price}` : 'Price on request',
      href: `/products/${product.slug}`,
    };
  });
}

/**
 * Gets a limited number of featured products
 * @param products - Array of all products
 * @param limit - Maximum number of products to return (default: 8)
 * @returns Array of featured product cards
 */
export function getFeaturedProducts(
  products: Product[],
  limit: number = 8
): ProductCard[] {
  const transformedProducts = transformProductsToCards(products);
  return transformedProducts.slice(0, limit);
}

/**
 * Gets suggested products excluding the current product
 * @param products - Array of all products
 * @param currentProductId - ID of the current product to exclude
 * @param limit - Maximum number of products to return (default: 6)
 * @returns Array of suggested product cards
 */
export function getSuggestedProducts(
  products: Product[],
  currentProductId: string,
  limit: number = 6
): ProductCard[] {
  const filteredProducts = products.filter(
    (product) => product.id !== currentProductId
  );
  const transformedProducts = transformProductsToCards(filteredProducts);

  // Shuffle the array to get random suggestions
  const shuffled = transformedProducts.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
}
