import Image from 'next/image';
import {
  type AffiliateProduct,
  AFFILIATE_DISCLOSURE,
} from '../lib/affiliate-products';

type Props = {
  product: AffiliateProduct;
};

function formatArs(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

/**
 * Sponsored affiliate card rendered inside the public `/products` grid.
 *
 * Matches the organic product card density but links out to the Temu
 * affiliate URL in a new tab. Carries a required "Patrocinado" disclosure
 * and uses rel="sponsored noopener noreferrer" for the outbound link.
 */
export default function AffiliateProductCard({ product }: Props) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      aria-label={`${AFFILIATE_DISCLOSURE}: ${product.title} (se abre en una pestaña nueva)`}
      className="block h-full transition-transform duration-200 hover:scale-102"
    >
      <div className="flex h-full flex-col bg-transparent">
        <div className="relative h-[23rem] w-full bg-transparent">
          <Image
            className="h-full w-full rounded-md object-cover"
            src={product.image}
            alt={product.title}
            fill
            sizes="30vw"
            loading="lazy"
          />
          <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
            {AFFILIATE_DISCLOSURE}
          </span>
        </div>
        <div className="flex flex-1 flex-col text-left">
          <div className="mt-1 line-clamp-2 min-h-[2.9rem] text-lg leading-tight font-semibold text-gray-900 dark:text-white">
            {product.title}
          </div>
          <div className="mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Categoría:</span> {product.category}
            </p>
          </div>
          <div className="mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">{product.salesLabel}</span> ventas
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <p className="text-primary-800 dark:text-primary-300 text-2xl leading-tight font-extrabold">
              {formatArs(product.priceArs)}
            </p>
          </div>
        </div>
      </div>
    </a>
  );
}
