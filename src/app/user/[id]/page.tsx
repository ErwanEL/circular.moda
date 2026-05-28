import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { transformProductsToCards } from '../../lib/helpers';
import {
  getOwnerIdsWithProducts,
  getProductsByOwnerId,
  getPublicUserById,
  parseUserIdParam,
} from '../../lib/users';
import Cards from '../../ui/cards';

/** Fallback ISR if listings change without a targeted revalidation. */
export const revalidate = 300;

export const dynamicParams = true;

export async function generateStaticParams() {
  const ownerIds = await getOwnerIdsWithProducts();
  return ownerIds.map((id) => ({ id: String(id) }));
}

function getFirstName(name: string): string {
  return name.split(' ')[0]?.trim() || name;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: idParam } = await params;
  const userId = parseUserIdParam(idParam);
  if (userId === null) {
    return {
      title: 'Vendedor no encontrado | circular.moda',
      description: 'El perfil que buscas no está disponible.',
    };
  }

  const user = await getPublicUserById(userId);
  if (!user?.name) {
    return {
      title: 'Vendedor no encontrado | circular.moda',
      description: 'El perfil que buscas no está disponible.',
    };
  }

  const firstName = getFirstName(user.name);
  const count = user.productCount ?? 0;
  const title = `Prendas de ${firstName} | circular.moda`;
  const description =
    count === 1
      ? `Mirá la prenda publicada por ${firstName} en circular.moda.`
      : `Mirá las ${count} prendas publicadas por ${firstName} en circular.moda.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const userId = parseUserIdParam(idParam);
  if (userId === null) {
    notFound();
  }

  const user = await getPublicUserById(userId);
  if (!user?.name) {
    notFound();
  }

  const products = await getProductsByOwnerId(userId);
  const cards = transformProductsToCards(products);
  const firstName = getFirstName(user.name);
  const count = products.length;

  return (
    <>
      <section>
        <div className="mx-auto max-w-screen-xl px-4 py-8 text-center lg:py-16">
          <h1 className="mb-4 text-4xl leading-none font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
            Prendas de {firstName}
          </h1>
          <p className="mb-2 text-lg font-normal text-gray-500 sm:px-16 lg:text-xl xl:px-48 dark:text-gray-400">
            {count === 0
              ? 'Este vendedor aún no tiene prendas publicadas.'
              : count === 1
                ? '1 prenda publicada en circular.moda'
                : `${count} prendas publicadas en circular.moda`}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            CABA
          </p>
        </div>
      </section>

      {count > 0 ? (
        <Cards products={cards} heading="Catálogo" />
      ) : (
        <section className="pb-16">
          <div className="mx-auto max-w-screen-xl px-4 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Sin prendas publicadas por ahora.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
