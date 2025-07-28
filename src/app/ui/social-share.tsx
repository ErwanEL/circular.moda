import React from 'react';
import { Button } from 'flowbite-react';

const LOGO_SRC = {
  whatsapp: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
  x: 'https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023_original.svg',
  facebook:
    'https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg',
};

interface SocialShareProps {
  url?: string;
  message?: string;
}

const DEFAULT_URL =
  typeof window !== 'undefined'
    ? window.location.href
    : 'https://circular.moda';
const DEFAULT_MESSAGE = '¡Mirá esto en Circular Moda!';

const getShareLinks = (url: string, message: string) => ({
  whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`,
  x: `https://x.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
});

export default function SocialShare({
  url = DEFAULT_URL,
  message = DEFAULT_MESSAGE,
}: SocialShareProps) {
  const links = getShareLinks(url, message);

  return (
    <section>
      <div className="mx-auto max-w-screen-xl items-center justify-center gap-8 px-2 py-8 text-center sm:px-4 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Compartí{' '}
            <span className="self-center text-4xl font-semibold whitespace-nowrap dark:text-white">
              circul<span className="text-primary-800">ar</span>.moda
            </span>
          </h2>
          <p className="mb-6 font-light text-gray-500 md:text-lg dark:text-gray-400">
            Compartí para encontrar más prendas y más clientes para vaciar tu
            armario.
          </p>
        </div>
        <div className="mt-6 flex flex-row justify-center gap-10 sm:gap-7">
          {/* WhatsApp */}
          <div className="flex flex-col items-center border-0 bg-transparent shadow-none">
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en WhatsApp"
              className="block"
            >
              <Button
                className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full !bg-[#25D366] p-0 sm:h-28 sm:w-28"
                size="xl"
                color="success"
                pill
              >
                <img
                  src={LOGO_SRC.whatsapp}
                  alt="WhatsApp logo"
                  className="h-12 w-12 object-contain sm:h-16 sm:w-16"
                />
              </Button>
            </a>
          </div>
          {/* X */}
          <div className="flex flex-col items-center border-0 bg-transparent shadow-none">
            <a
              href={links.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en X"
              className="block"
            >
              <Button
                className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full p-0 sm:h-28 sm:w-28"
                size="xl"
                color="light"
                pill
              >
                <img
                  src={LOGO_SRC.x}
                  alt="X logo"
                  className="h-12 w-12 object-contain sm:h-16 sm:w-16"
                />
              </Button>
            </a>
          </div>
          {/* Facebook */}
          <div className="flex flex-col items-center border-0 bg-transparent shadow-none">
            <a
              href={links.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en Facebook"
              className="block"
            >
              <Button
                className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full p-0 sm:h-28 sm:w-28"
                size="xl"
                color="#0866ff"
                pill
              >
                <img
                  src={LOGO_SRC.facebook}
                  alt="Facebook logo"
                  className="h-20 w-20 object-contain sm:h-28 sm:w-28"
                />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
