import type { Product } from '../types';

export interface ProductCard {
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  badge: string;
  title: string;
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

export function transformProductsToCards(products: Product[]): ProductCard[] {
  return products.map((product) => {
    // Compose local image path if possible
    // Priorité: fichier local > URL Airtable > placeholder
    let localImage: string | undefined = undefined;
    if (product.Images?.[0]?.filename && product.id) {
      localImage = buildLocalImagePath(product.id, product.Images[0].filename);
    }

    const imageUrl = localImage || product.Images?.[0]?.url;
    const fallbackImage = 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg';
    const fallbackImageDark = 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front-dark.svg';

    return {
      image: {
        light: imageUrl || fallbackImage,
        dark: imageUrl || fallbackImageDark,
        alt: product['Product Name'] || `Product ${product.SKU}`,
      },
      badge: product.Category || product.category || 'Available',
      title: product['Product Name'] || `Product ${product.SKU}`,
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
