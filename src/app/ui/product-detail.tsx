'use client';

import Image from 'next/image';

type ProductDetailProps = {
  product: {
    SKU: string;
    Price?: number;
    Category?: string;
    Color?: string;
    Size?: string;
    StockLevels?: number;
    Images?: Array<{ url: string }>;
  };
  rating?: {
    value: number;
    count: number;
  };
  onAddToFavorites?: () => void;
  onAddToCart?: () => void;
};

export default function ProductDetail({
  product,
  rating = { value: 5.0, count: 345 },
  onAddToFavorites,
  onAddToCart,
}: ProductDetailProps) {
  const handleAddToFavorites = () => {
    if (onAddToFavorites) {
      onAddToFavorites();
    } else {
      // Default behavior if no callback provided
      console.log('Add to favorites:', product.SKU);
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart();
    } else {
      // Default behavior if no callback provided
      console.log('Add to cart:', product.SKU);
    }
  };

  const renderStars = (value: number) => {
    return Array.from({ length: Math.round(value) }).map((_, i) => (
      <svg
        key={i}
        className="h-4 w-4 text-yellow-300"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
      </svg>
    ));
  };

  return (
    <section className="py-8 antialiased md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
          <div className="mx-auto max-w-md shrink-0 lg:max-w-lg">
            {product.Images?.[0]?.url ? (
              <Image
                src={product.Images[0].url}
                alt={product.SKU}
                width={800}
                height={600}
                className="w-full rounded"
              />
            ) : (
              <div className="flex h-96 w-full items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                <span className="text-gray-500 dark:text-gray-400">
                  Imagen no disponible
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 sm:mt-8 lg:mt-0">
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
              {product.SKU}
            </h1>

            <div className="mt-4 sm:flex sm:items-center sm:gap-4">
              {product.Price !== undefined && (
                <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl dark:text-white">
                  ${product.Price}
                </p>
              )}

              <div className="mt-2 flex items-center gap-2 sm:mt-0">
                <div className="flex items-center gap-1">
                  {renderStars(rating.value)}
                </div>
                <p className="text-sm leading-none font-medium text-gray-500 dark:text-gray-400">
                  ({rating.value})
                </p>
                <a
                  href="#"
                  className="text-sm leading-none font-medium text-gray-900 underline hover:no-underline dark:text-white"
                >
                  {rating.count} Opiniones
                </a>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 sm:flex sm:items-center sm:gap-4">
              <button
                onClick={handleAddToFavorites}
                className="hover:text-primary-700 flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-100 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
              >
                <svg
                  className="-ms-2 me-2 h-5 w-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z"
                  />
                </svg>
                Agregar a favoritos
              </button>

              <button
                onClick={handleAddToCart}
                className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 mt-4 flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white focus:ring-4 focus:outline-none sm:mt-0"
              >
                <svg
                  className="-ms-2 me-2 h-5 w-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4h1.5L8 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm.75-3H7.5M11 7H6.312M17 4v6m-3-3h6"
                  />
                </svg>
                Agregar al carrito
              </button>
            </div>

            <hr className="my-6 border-gray-200 md:my-8 dark:border-gray-800" />

            <div className="mb-6 text-gray-500 dark:text-gray-400">
              <ul className="space-y-2">
                {product.Category && (
                  <li>
                    <strong>Categoría:</strong> {product.Category}
                  </li>
                )}
                {product.Color && (
                  <li>
                    <strong>Color:</strong> {product.Color}
                  </li>
                )}
                {product.Size && (
                  <li>
                    <strong>Talle:</strong> {product.Size}
                  </li>
                )}
                {product.StockLevels !== undefined && (
                  <li>
                    <strong>Stock:</strong> {product.StockLevels}
                  </li>
                )}
              </ul>
            </div>

            <p className="text-gray-500 dark:text-gray-400">
              Los detalles y especificaciones del producto se mostrarán acá.
              Este es un espacio reservado para información adicional del
              producto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
