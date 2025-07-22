'use client';

import Image from 'next/image';
import Button from './button';
import Link from 'next/link';
import { FaShoppingCart, FaInfoCircle } from 'react-icons/fa';
import { translateColorToSpanish } from '../lib/helpers';

type ProductDetailProps = {
  product: {
    SKU: string;
    'Product Name'?: string;
    Price?: number;
    Category?: string;
    Color?: string;
    Size?: string;
    StockLevels?: number;
    id?: string;
    Images?: Array<{ url: string; filename: string }>;
  };
  rating?: {
    value: number;
    count: number;
  };
};

export default function ProductDetail({
  product,
  rating = { value: 5.0, count: 345 },
}: ProductDetailProps) {
  const productColor = product.Color
    ? translateColorToSpanish(product.Color.toLowerCase())
    : 'Desconocido';

  // Compose local image path if possible
  let localImage = undefined;
  if (product.Images?.[0]?.filename && product.id) {
    const ext = product.Images[0].filename.substring(
      product.Images[0].filename.lastIndexOf('.')
    );
    const slugified =
      product.id +
      '-' +
      product.Images[0].filename
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    localImage = `/airtable/${slugified}${ext}`;
  }

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
            {localImage || (product.Images && product.Images[0]?.url) ? (
              <Image
                src={
                  localImage
                    ? localImage
                    : product.Images && product.Images[0]?.url
                      ? product.Images[0].url
                      : ''
                }
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
              {product['Product Name'] || product.SKU}
            </h1>

            <div className="mt-4">
              {product.Price !== undefined && (
                <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl dark:text-white">
                  ${product.Price}
                </p>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {renderStars(rating.value)}
              </div>
              <p className="text-sm leading-none font-medium text-gray-500 dark:text-gray-400">
                Calificación del vendedor
              </p>
            </div>

            <div className="mt-6 sm:mt-8 sm:flex sm:items-center sm:gap-4">
              <Button
                as={Link}
                size="xl"
                href={`https://wa.me/5491125115030?text=Hola%20me%20interesa%20esa%20prenda%20talla:%20${product.Size},%20color:%20${productColor},%20SKU:%20${product.SKU}`}
                variant="primary"
                className="dark:text-gray-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                Comprar
                <FaShoppingCart className="ml-2" />
              </Button>
              <Button
                as={Link}
                size="xl"
                href={`https://wa.me/5491125115030?text=Hola%20queria%20mas%20info%20sobre%20esta%20prenda%20talla:%20${product.Size},%20color:%20${productColor},%20SKU:%20${product.SKU}`}
                variant="secondary"
                className="ml-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Más info
                <FaInfoCircle className="ml-2" />
              </Button>
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
                    <strong>Color:</strong> {productColor}
                  </li>
                )}
                {product.Size && (
                  <li>
                    <strong>Talle:</strong> {product.Size}
                  </li>
                )}
              </ul>
            </div>

            {/* <p className="text-gray-500 dark:text-gray-400">
              Los detalles y especificaciones del producto se mostrarán acá.
              Este es un espacio reservado para información adicional del
              producto.
            </p> */}
          </div>
        </div>
      </div>
    </section>
  );
}
