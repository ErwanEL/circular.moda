import Link from 'next/link';
import { HiChevronRight } from 'react-icons/hi2';
import { translateColorToSpanish } from '../lib/helpers';
import type { Product, User } from '../lib/types';
import { ProductStarRating } from './product-star-rating';

function getSellerProductCount(user: User | null | undefined): number | null {
  if (user?.productCount !== undefined) {
    return user.productCount;
  }
  if (user?.Products) {
    return Array.isArray(user.Products)
      ? user.Products.length
      : typeof user.Products === 'string'
        ? 1
        : 0;
  }
  return null;
}

function getVitrineCtaLabel(firstName: string, count: number | null): string {
  if (count === null || count === 0) {
    return `Ver vitrina de ${firstName}`;
  }
  if (count === 1) {
    return `Ver la prenda de ${firstName}`;
  }
  return `Ver las ${count} prendas de ${firstName}`;
}

type ProductInfoProps = {
  product: Product;
  user?: User | null;
  rating: { value: number; count: number };
};

export function ProductInfo({ product, user, rating }: ProductInfoProps) {
  const productColor = product.Color
    ? translateColorToSpanish(product.Color.toLowerCase())
    : 'Desconocido';
  const productDescription = (
    product.description ?? product['Description']
  )?.trim();

  // Extract first name only (before first space)
  // Support both Airtable (Name) and Supabase (name) formats
  const userName = user?.Name || user?.name || null;
  const firstName = userName ? userName.split(' ')[0].trim() : null;

  return (
    <div className="mt-6 sm:mt-8 lg:mt-0">
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
        {product['Product Name'] || product.SKU}
      </h1>

      {/* SKU Reference */}
      <div className="mt-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">Referencia:</span> {product.SKU}
        </p>
      </div>

      <div className="mt-4">
        {product.Price !== undefined && (
          <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl dark:text-white">
            ${product.Price}
          </p>
        )}
      </div>

      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <ProductStarRating value={rating.value} />
          <p className="text-sm leading-none font-medium text-gray-500 dark:text-gray-400">
            Calificación del vendedor
          </p>
        </div>

        {/* Seller vitrina */}
        {firstName &&
          (user?.id ? (
            <Link
              href={`/user/${user.id}`}
              className="group mt-3 flex items-center gap-3 rounded-xl border border-primary-300/70 bg-light px-4 py-3 shadow-sm transition-colors hover:border-primary-400 hover:bg-primary-100 dark:border-primary-800/50 dark:bg-gray-900/40 dark:hover:bg-primary-900/25"
            >
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {firstName}
                  <span className="font-normal text-gray-500 dark:text-gray-400">
                    {' '}
                    · CABA
                  </span>
                </p>
                <p className="mt-1 text-sm font-medium text-primary-800 group-hover:underline">
                  {getVitrineCtaLabel(firstName, getSellerProductCount(user))}
                </p>
              </div>
              <HiChevronRight
                className="h-5 w-5 shrink-0 text-primary-800 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ) : (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-bold text-gray-900 dark:text-white">
                {firstName}
              </span>
              {' – '}
              <span className="font-bold">CABA</span>
              {(() => {
                const productCount = getSellerProductCount(user);
                if (productCount !== null && productCount > 0) {
                  return (
                    <>
                      {' · '}
                      <span>
                        {productCount}{' '}
                        {productCount === 1
                          ? 'prenda publicada'
                          : 'prendas publicadas'}
                      </span>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          ))}
      </div>

      <div className="mt-6 mb-6 text-gray-500 dark:text-gray-400">
        <ul className="space-y-2">
          {product.Category && (
            <li>
              <strong>Categoría:</strong> {product.Category}
            </li>
          )}
          {product.Color && (
            <li>
              <strong>Color:</strong> {productColor}
            </li>
          )}
          {product.Size && (
            <li>
              <strong>Talle:</strong> {product.Size}
            </li>
          )}
          {productDescription && (
            <li>
              <strong>Descripción:</strong> {productDescription}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
