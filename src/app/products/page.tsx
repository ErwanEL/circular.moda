import {
  getFeaturedProductsList,
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
import FeaturedProducts from './components/featured-products';
import InstagramFollowBanner from '../ui/instagram-follow-banner';

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
    const featuredCards = transformProductsToCards(
      await getFeaturedProductsList()
    );

    return (
      <section className="py-6 antialiased md:py-8">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <FeaturedProducts cards={featuredCards} />

          <InstagramFollowBanner className="mb-6" />

          <ProductsFilters
            activeFilters={activeFilters}
            categories={filterOptions.categories}
            colors={filterOptions.colors}
            genders={filterOptions.genders}
          />

          <div className="mt-6">
            <ProductsGridInfinite
              key={gridKey}
              initialCards={initialCards}
              initialNextCursor={initialNextCursor}
              pageSize={PRODUCTS_PAGE_SIZE}
              activeFilters={activeFilters}
            />
          </div>
        </div>
      </section>
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
