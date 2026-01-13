'use client';

import React, { useState } from 'react';
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
  title?: string;
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
  title = 'Compartí circul<span className="text-primary-800">ar</span>.moda',
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const links = getShareLinks(url, message);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <section>
      <div className="mx-auto max-w-screen-xl items-center justify-center gap-8 px-2 py-8 text-center sm:px-4 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <h2
            className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p className="mb-6 font-light text-gray-500 md:text-lg dark:text-gray-400">
            Compartí para encontrar más prendas y más clientes para vaciar tu
            armario.
          </p>
        </div>
        <div className="xs:gap-6 mt-6 flex flex-row justify-center sm:gap-10">
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
          {/* Copy Link */}
          <div className="flex flex-col items-center border-0 bg-transparent shadow-none">
            <div className="group relative">
              <button
                onClick={handleCopyLink}
                aria-label="Copiar enlace"
                className="block"
                title="Copiar enlace"
              >
                <Button
                  className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-full p-0 sm:h-28 sm:w-28 ${
                    copied ? '!bg-green-500' : '!bg-gray-100 hover:!bg-gray-200'
                  }`}
                  size="xl"
                  color="gray"
                  pill
                >
                  <img
                    src="/hyperlink-icon.svg"
                    alt="Copiar enlace"
                    className="h-12 w-12 object-contain sm:h-16 sm:w-16"
                  />
                </Button>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform group-hover:block">
                <div className="rounded bg-gray-800 px-2 py-1 text-xs text-white">
                  Copiar enlace
                  <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-t-4 border-r-4 border-l-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </div>
            {copied && (
              <span className="mt-2 text-sm font-medium text-green-600">
                ¡Copiado!
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
