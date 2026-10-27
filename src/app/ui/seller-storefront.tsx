import { transformProductsToCards } from '../lib/helpers';
import { getProductsByOwnerId } from '../lib/users';
import type { User } from '../lib/types';
import Cards from './cards';
import UserPageShare from '../user/[id]/user-page-share';
import SellerPremiumBadge from './seller-premium-badge';
import { isPremiumSeller } from '../lib/seller-tier';
import { sellerPath } from '../lib/profile-identity';

export default async function SellerStorefront({ user }: { user: User }) {
  const userId = Number(user.id);
  const products = await getProductsByOwnerId(userId);
  const cards = transformProductsToCards(products);
  const firstName = (user.name || '').split(' ')[0];
  const count = products.length;
  const premium = isPremiumSeller(count);

  return (
    <>
      <section
        className={
          premium
            ? 'bg-[radial-gradient(75%_60%_at_50%_0%,#fbbf2420,transparent_70%)]'
            : undefined
        }
      >
        <div className="mx-auto max-w-screen-xl px-4 py-8 text-center lg:py-16">
          {premium && (
            <div className="mb-4 flex justify-center">
              <SellerPremiumBadge />
            </div>
          )}
          <h1
            className={`text-4xl leading-none font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white ${premium ? 'mb-3' : 'mb-4'}`}
          >
            Prendas de {firstName}
          </h1>
          {premium && (
            <div className="mx-auto mb-4 h-px w-20 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
          )}
          <p className="mb-2 text-lg font-normal text-gray-500 sm:px-16 lg:text-xl xl:px-48 dark:text-gray-400">
            {count === 0
              ? 'Este vendedor aún no tiene prendas publicadas.'
              : count === 1
                ? '1 prenda publicada en circular.moda'
                : `${count} prendas publicadas en circular.moda`}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">CABA</p>
          {user.instagram_username && (
            <p className="mt-4 text-sm">
              <a
                className="text-primary-800 underline"
                href={`https://www.instagram.com/${user.instagram_username}/`}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`Instagram de ${firstName}: @${user.instagram_username} (abre otra pestaña)`}
              >
                Instagram · @{user.instagram_username}
              </a>
            </p>
          )}
          <UserPageShare
            path={sellerPath(user)}
            firstName={firstName}
            productCount={count}
          />
        </div>
      </section>

      {count > 0 ? (
        <Cards products={cards} heading={premium ? 'Colección' : 'Catálogo'} />
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
