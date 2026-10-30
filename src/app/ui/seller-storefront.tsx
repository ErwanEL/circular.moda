import Image from 'next/image';
import { transformProductsToCards } from '../lib/helpers';
import { getProductsByOwnerId } from '../lib/users';
import type { User } from '../lib/types';
import Cards from './cards';
import ProductCard from './card';
import UserPageShare from '../user/[id]/user-page-share';
import SellerPremiumBadge from './seller-premium-badge';
import { isPremiumSeller } from '../lib/seller-tier';
import { sellerPath } from '../lib/profile-identity';
import { STOREFRONT_CITY, splitStorefrontProducts } from '../lib/storefront';
import { CIRCULAR_WHATSAPP_NUMBER } from '../lib/product-interest';

export default async function SellerStorefront({ user }: { user: User }) {
  const products = await getProductsByOwnerId(Number(user.id));
  const { pinned, rest } = splitStorefrontProducts(
    products,
    user.pinned_product_ids || []
  );
  const firstName = (user.name || '').split(' ')[0];
  const title = user.boutique_name || `El dressing de ${firstName}`;
  const count = products.length;
  const contact = `https://wa.me/${CIRCULAR_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola Circular.moda, me interesa la boutique «${title}»: https://circular.moda${sellerPath(user)}`)}`;
  return (
    <>
      <section className="boutique-hero" aria-labelledby="boutique-title">
        <div className="boutique-hero-inner">
          <div className="boutique-avatar boutique-avatar-large">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={`Foto de ${title}`}
                width={112}
                height={112}
              />
            ) : (
              <span aria-hidden="true">
                {(firstName || 'CM').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="boutique-intro">
            <p className="boutique-eyebrow">Una selección con estilo propio</p>
            <h1 id="boutique-title">{title}</h1>
            <p className="boutique-byline">
              Por {firstName}
              {` · ${user.neighborhood ? `${user.neighborhood}, ` : ''}${STOREFRONT_CITY}`}
            </p>
            {user.bio && <p className="boutique-bio">{user.bio}</p>}
            <div className="boutique-meta">
              <span>
                {count} {count === 1 ? 'prenda' : 'prendas'}
              </span>
              {user.instagram_username && (
                <a
                  href={`https://www.instagram.com/${user.instagram_username}/`}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={`Instagram @${user.instagram_username} (abre otra pestaña)`}
                >
                  Instagram · @{user.instagram_username}
                </a>
              )}
              {isPremiumSeller(count) && <SellerPremiumBadge />}
            </div>
            <div className="boutique-actions">
              <a
                className="boutique-contact"
                href={contact}
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar con Circular por WhatsApp{' '}
                <span className="sr-only">(abre otra pestaña)</span>
              </a>
              {count > 0 && (
                <a href="#boutique-catalogue">Explorar prendas ↓</a>
              )}
            </div>
            <UserPageShare
              path={sellerPath(user)}
              firstName={firstName}
              productCount={count}
            />
          </div>
        </div>
      </section>
      <div id="boutique-catalogue">
        {pinned.length > 0 && (
          <section
            className="boutique-selection"
            aria-labelledby="boutique-selection-title"
          >
            <p className="boutique-eyebrow">Elegidas por {firstName}</p>
            <h2 id="boutique-selection-title">La selección del dressing</h2>
            <div className="boutique-selection-grid">
              {transformProductsToCards(pinned).map((card, i) => (
                <ProductCard key={pinned[i].id} {...card} />
              ))}
            </div>
          </section>
        )}
        {rest.length > 0 && (
          <Cards
            products={transformProductsToCards(rest)}
            heading={
              pinned.length ? 'Más prendas del dressing' : 'Todas las prendas'
            }
          />
        )}
        {count === 0 && (
          <p className="boutique-empty">
            Este dressing está preparando sus primeras prendas. Volvé pronto.
          </p>
        )}
      </div>
    </>
  );
}
