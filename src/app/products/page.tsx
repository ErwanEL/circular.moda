import { getAllProducts } from '../lib/airtable';
import { transformProductsToCards } from '../lib/helpers';
import Card from '../ui/card';
import Cta from '../ui/cta';

// Incremental Static Regeneration, rebuild every 60 s
export const revalidate = 60;

export default async function ProductsPage() {
  try {
    const products = await getAllProducts(); // runs at build time, then every 60 s

    // Transform products to match Card component interface using helper function
    const productCards = transformProductsToCards(products);

    return (
      <>
        {/* Hero Section */}
        <section>
          <div className="mx-auto max-w-screen-xl px-4 py-8 text-center lg:py-16">
            <h1 className="mb-4 text-4xl leading-none font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
              Our Product Collection
            </h1>
            <p className="mb-8 text-lg font-normal text-gray-500 sm:px-16 lg:text-xl xl:px-48 dark:text-gray-400">
              Discover our carefully curated selection of quality products. Each
              item is handpicked to ensure the best value and experience.
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-8 antialiased md:py-12">
          <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
            <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
              <div>
                <h2 className="mt-3 text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
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
              <div className="py-12 text-center">
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
      <section className="bg-gray-50 py-8 antialiased md:py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="py-12 text-center">
            <h2 className="mb-4 text-xl font-semibold text-red-600 dark:text-red-400">
              Error loading products
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }
}
