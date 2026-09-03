import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { getInstagramBioProducts } from '../lib/instagram-bio-products';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Productos de Instagram | circular.moda',
  description:
    'Encontrá los últimos productos publicados en Instagram por circular.moda.',
  alternates: {
    canonical: '/instagram',
  },
};

function getInternalProductHref(productUrl: string | null): string | null {
  if (!productUrl) {
    return null;
  }

  try {
    const parsed = new URL(productUrl);
    if (parsed.hostname === 'circular.moda') {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    if (productUrl.startsWith('/')) {
      return productUrl;
    }
  }

  return productUrl;
}

function formatPublishedDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export default async function InstagramPage() {
  const products = await getInstagramBioProducts();

  return (
    <main className="bg-white antialiased dark:bg-gray-950">
      <section className="mx-auto max-w-screen-xl px-4 py-6 sm:py-8 2xl:px-0">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary-700 uppercase dark:text-primary-300">
              Instagram
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl dark:text-white">
              Últimos productos publicados
            </h1>
          </div>
          <Link
            href="/products"
            className="inline-flex w-fit items-center justify-center rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 focus:outline-none dark:bg-primary-600 dark:hover:bg-primary-500 dark:focus:ring-primary-900"
          >
            Ver todo el catálogo
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="border-y border-gray-200 py-12 text-center dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
              Todavía no hay productos publicados desde Instagram
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Mientras tanto, podés explorar el catálogo completo.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex items-center justify-center rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 focus:outline-none dark:bg-primary-600 dark:hover:bg-primary-500 dark:focus:ring-primary-900"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const productHref = getInternalProductHref(product.productUrl);
              const publishedDate = formatPublishedDate(product.publishedAt);

              return (
                <article key={product.id} className="flex min-w-0 flex-col">
                  <Link
                    href={productHref || '/products'}
                    className="group block"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.productName}
                          fill
                          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                          Imagen no disponible
                        </div>
                      )}
                    </div>
                    <h2 className="mt-3 line-clamp-2 min-h-[2.5rem] text-base leading-tight font-semibold text-gray-950 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-300">
                      {product.productName}
                    </h2>
                  </Link>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                    {publishedDate && (
                      <span className="text-gray-500 dark:text-gray-400">
                        Publicado {publishedDate}
                      </span>
                    )}
                    {product.instagramPermalink && (
                      <a
                        href={product.instagramPermalink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
                      >
                        Ver post
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
