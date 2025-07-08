import { getAllProducts } from '../lib/airtable';
import type { Product } from '../lib/types';
import Card from '../ui/card';
import Cta from '../ui/cta';

// Incremental Static Regeneration, rebuild every 60 s
export const revalidate = 60;

export default async function ProductsPage() {
  try {
    const products: Product[] = await getAllProducts(); // runs at build time, then every 60 s

    // Transform products to match Card component interface
    const productCards = products.map((product) => ({
      image: {
        light:
          product.Images?.[0]?.url ||
          'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg',
        dark:
          product.Images?.[0]?.url ||
          'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front-dark.svg',
        alt: product.SKU,
      },
      badge: product.Category || 'Available',
      title: product.SKU,
      rating: {
        value: 5.0,
        count: Math.floor(Math.random() * 500) + 50, // Random rating count for demo
      },
      price:
        product.Price !== undefined ? `$${product.Price}` : 'Price on request',
      href: `/products/${product.slug}`,
    }));

    return (
      <>
        {/* Hero Section */}
        <section className="bg-white dark:bg-gray-900">
          <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16">
            <h1 className="mb-4 text-4xl tracking-tight font-extrabold leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
              Our Product Collection
            </h1>
            <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">
              Discover our carefully curated selection of quality products. Each
              item is handpicked to ensure the best value and experience.
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="bg-gray-50 py-8 antialiased dark:bg-gray-900 md:py-12">
          <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
            <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
              <div>
                <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                  Featured Products
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Browse through our collection of {products.length} products
                </p>
              </div>
            </div>
            <div className="mb-4 grid gap-4 sm:grid-cols-2 md:mb-8 lg:grid-cols-3 xl:grid-cols-4">
              {productCards.map((cardData, index) => (
                <Card key={index} {...cardData} />
              ))}
            </div>
            {productCards.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No products available at the moment.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <Cta
          variant="centered"
          content={{
            heading: "Can't find what you're looking for?",
            description:
              "Contact us and we'll help you find the perfect product for your needs.",
            button: {
              text: 'Contact Us',
              href: '#',
            },
          }}
        />
      </>
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return (
      <section className="bg-gray-50 py-8 antialiased dark:bg-gray-900 md:py-12">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
              Error loading products
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }
}
