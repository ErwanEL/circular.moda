import { FaInstagram } from 'react-icons/fa';
import Button from './button';

const INSTAGRAM_URL = 'https://www.instagram.com/circular_punto_moda/';

type InstagramFollowBannerProps = {
  variant?: 'public' | 'seller';
  className?: string;
};

export default function InstagramFollowBanner({
  variant = 'public',
  className = '',
}: InstagramFollowBannerProps) {
  const isSeller = variant === 'seller';

  return (
    <section
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-50 text-[#E1306C] dark:bg-pink-950/40">
            <FaInstagram className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#E1306C]">
              @circular_punto_moda
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-normal text-gray-900 dark:text-white">
              {isSeller
                ? 'Tu prenda puede aparecer en Instagram'
                : 'Seguinos para ver las prendas destacadas'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              {isSeller
                ? 'Elegimos prendas con buenas fotos, estilo y variedad para compartirlas en nuestro feed diario. Publicá buenas imágenes y seguinos para ver si una de tus prendas entra en destacados.'
                : 'Compartimos las mejores novedades del catálogo y una selección diaria de prendas destacadas. Seguí la cuenta para descubrir piezas nuevas apenas salen.'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:items-center">
          <Button
            link={INSTAGRAM_URL}
            text="Seguir en Instagram"
            variant="primary"
            solid
            className="w-full sm:w-auto"
            aria-label="Seguir a circular punto moda en Instagram"
          />
        </div>
      </div>
    </section>
  );
}
