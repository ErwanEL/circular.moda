import { translateColorToSpanish } from '../lib/helpers';
import type { Product, User } from '../lib/types';
import { ProductStarRating } from './product-star-rating';

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

        {/* User Info */}
        {firstName && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-bold">{firstName}</span>
            {' – '}
            <span className="font-bold">CABA</span>
            {(() => {
              // Support both Airtable (Products array) and Supabase (productCount) formats
              let productCount: number | null = null;

              if (user?.productCount !== undefined) {
                // Supabase format: use productCount directly
                productCount = user.productCount;
              } else if (user?.Products) {
                // Airtable format: count from Products array
                productCount = Array.isArray(user.Products)
                  ? user.Products.length
                  : typeof user.Products === 'string'
                    ? 1
                    : 0;
              }

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
        )}
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
