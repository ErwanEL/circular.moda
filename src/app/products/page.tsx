import { getAllProducts } from '../lib/products';
import { transformProductsToCards } from '../lib/helpers';
import Card from '../ui/card';
import Cta from '../ui/cta';

// Fully static, no revalidate

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
            <div className="mb-4 grid gap-4 sm:grid-cols-2 md:mb-8 lg:grid-cols-3 xl:grid-cols-4">
              {productCards.map((cardData, index) => (
                <Card key={index} {...cardData} />
              ))}
            </div>
            {productCards.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No hay productos disponibles en este momento.
                </p>
              </div>
            )}
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
