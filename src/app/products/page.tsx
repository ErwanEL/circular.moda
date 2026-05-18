import {
  getProductFilterOptions,
  getProductsPage,
  PRODUCTS_PAGE_SIZE,
} from '../lib/products';
import { transformProductsToCards } from '../lib/helpers';
import {
  normalizeProductFiltersInput,
  resolveProductFiltersAgainstOptions,
  serializeProductFilters,
} from '../lib/product-filters';
import ProductsGridInfinite from './components/products-grid-infinite';
import ProductsFilters from './components/products-filters';

/** Fallback ISR if the webhook misses an update. */
export const revalidate = 300;

function encodeNextCursor(
  cursor: { created_at: string; id: string } | null
): string | null {
  if (!cursor) return null;
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64');
}

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  try {
    const resolvedSearchParams = await searchParams;
    const rawFilters = normalizeProductFiltersInput({
      q: resolvedSearchParams.q,
      category: resolvedSearchParams.category,
      color: resolvedSearchParams.color,
      gender: resolvedSearchParams.gender,
      size: resolvedSearchParams.size,
      priceMin: resolvedSearchParams.priceMin,
      priceMax: resolvedSearchParams.priceMax,
    });
    const filterOptions = await getProductFilterOptions();
    const activeFilters = resolveProductFiltersAgainstOptions(
      rawFilters,
      filterOptions
    );
    const { products, nextCursor } = await getProductsPage({
      limit: PRODUCTS_PAGE_SIZE,
      ...activeFilters,
    });
    const initialCards = transformProductsToCards(products);
    const initialNextCursor = encodeNextCursor(nextCursor);
    const gridKey = serializeProductFilters(activeFilters);

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
          <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
            <div className="mb-8">
              <ProductsFilters
                activeFilters={activeFilters}
                categories={filterOptions.categories}
                colors={filterOptions.colors}
                genders={filterOptions.genders}
              />
            </div>

            <ProductsGridInfinite
              key={gridKey}
              initialCards={initialCards}
              initialNextCursor={initialNextCursor}
              pageSize={PRODUCTS_PAGE_SIZE}
              activeFilters={activeFilters}
            />
          </div>
        </section>
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
