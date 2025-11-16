import { getAllProducts } from '../lib/products';
import { transformProductsToCards } from '../lib/helpers';
import Card from '../ui/card';
import Cta from '../ui/cta';
import Link from 'next/link';

// Fully static, no revalidate

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { categories?: string };
}) {
  try {
    const products = await getAllProducts(); // runs at build time, then every 60 s

    // Transform products to match Card component interface using helper function
    const productCards = transformProductsToCards(products);

    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(productCards.map((card) => card.category).filter(Boolean))
    ).sort();

    // Get selected categories from URL (pipe-separated)
    const selectedCategories = searchParams.categories
      ? searchParams.categories.split('|')
      : [];

    // Filter products based on selected categories
    const filteredProducts =
      selectedCategories.length > 0
        ? productCards.filter((card) =>
            selectedCategories.includes(card.category)
          )
        : productCards;

    return (
      <>
        {/* Hero Section */}
        <section>
          <div className="mx-auto max-w-screen-xl px-4 py-8 text-center lg:py-16">
            <h1 className="mb-4 text-4xl leading-none font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
              Catalogo de articulos
            </h1>
            <p className="mb-8 text-lg font-normal text-gray-500 sm:px-16 lg:text-xl xl:px-48 dark:text-gray-400">
              Descubrí nuestra selección de productos enviados por miembros de
              la comunidad Circular.moda
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-8 antialiased md:py-12">
          <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Filters Aside - Full width on mobile, narrow sidebar on desktop */}
              <aside className="w-full flex-shrink-0 lg:w-64">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Filtros
                  </h2>
                  {/* Category Filters */}
                  <div className="space-y-2">
                    <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Categorías
                    </h3>
                    {uniqueCategories.map((category) => {
                      const isChecked = selectedCategories.includes(category);
                      const newCategories = isChecked
                        ? selectedCategories.filter((c) => c !== category)
                        : [...selectedCategories, category];
                      const href =
                        newCategories.length > 0
                          ? `/products?categories=${newCategories.map(encodeURIComponent).join('|')}`
                          : '/products';

                      return (
                        <div key={category} className="flex items-center">
                          <Link href={href} className="flex items-center">
                            <input
                              id={`category-${category}`}
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                            />
                            <label
                              htmlFor={`category-${category}`}
                              className="ml-2 cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-300"
                            >
                              {category}
                            </label>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* Products Grid Container */}
              <div className="min-w-0 flex-1">
                <div className="mb-4 grid gap-4 sm:grid-cols-2 md:mb-8 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((cardData, index) => (
                    <Card key={index} {...cardData} />
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay productos disponibles en este momento.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <Cta
          variant="centered"
          content={{
            heading: '¿No encontrás lo que buscás?',
            description:
              'Contactanos y te ayudamos a encontrar el producto ideal para vos.',
            button: {
              text: 'Contactanos',
              href: 'https://wa.me/5491125115030?text=Hola%20Circular.moda',
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
              Error al cargar los productos
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }
}
