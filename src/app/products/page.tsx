import {
  getProductsPage,
  PRODUCTS_PAGE_SIZE,
} from '../lib/products';
import { transformProductsToCards } from '../lib/helpers';
import Cta from '../ui/cta';
import ProductsGridInfinite from './components/products-grid-infinite';

function encodeNextCursor(
  cursor: { created_at: string; id: string } | null
): string | null {
  if (!cursor) return null;
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64');
}

export default async function ProductsPage() {
  try {
    const { products, nextCursor } = await getProductsPage(PRODUCTS_PAGE_SIZE);
    const initialCards = transformProductsToCards(products);
    const initialNextCursor = encodeNextCursor(nextCursor);

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

        {/* Products Grid (infinite scroll) */}
        <section className="py-8 antialiased md:py-12">
          <ProductsGridInfinite
            initialCards={initialCards}
            initialNextCursor={initialNextCursor}
            pageSize={PRODUCTS_PAGE_SIZE}
          />
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
