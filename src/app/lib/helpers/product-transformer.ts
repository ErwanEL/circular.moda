import type { Product } from '../types';

export interface ProductCard {
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  badge: string;
  title: string;
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
export function transformProductsToCards(products: Product[]): ProductCard[] {
  return products.map((product) => {
    // Compose local image path if possible
    let localImage = undefined;
    if (product.Images?.[0]?.filename && product.id) {
      const ext = product.Images[0].filename.substring(
        product.Images[0].filename.lastIndexOf('.')
      );
      const baseName = product.Images[0].filename.replace(ext, '');
      const slugified =
        product.id +
        '-' +
        baseName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      localImage = `/airtable/${slugified}${ext}`;
    }
    return {
      image: {
        light:
          localImage ||
          product.Images?.[0]?.url ||
          'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg',
        dark:
          localImage ||
          product.Images?.[0]?.url ||
          'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front-dark.svg',
        alt: product['Product Name'] || `Product ${product.SKU}`,
      },
      badge: product.Category || 'Available',
      title: product['Product Name'] || `Product ${product.SKU}`,
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
