'use client';

import { useEffect, useState } from 'react';
import {
  FaWhatsapp,
  FaFacebookF,
  FaXTwitter,
  FaLink,
  FaCheck,
} from 'react-icons/fa6';

type UserPageShareProps = {
  userId: number;
  firstName: string;
  productCount: number;
};

function getShareLinks(url: string, message: string) {
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`,
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
}

const iconClass = 'h-[17px] w-[17px] text-primary-800';
const buttonClass =
  'flex h-9 w-9 items-center justify-center rounded-full text-primary-800 transition-colors hover:bg-primary-100 active:bg-primary-100/80';

export default function UserPageShare({
  userId,
  firstName,
  productCount,
}: UserPageShareProps) {
  const [shareUrl, setShareUrl] = useState(
    `https://circular.moda/user/${userId}`
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const message =
    productCount === 1
      ? `¡Mirá la prenda de ${firstName} en Circular Moda!`
      : `¡Mirá las ${productCount} prendas de ${firstName} en Circular Moda!`;

  const links = getShareLinks(shareUrl, message);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="mt-5 flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-1">
        <a
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en WhatsApp"
          className={buttonClass}
        >
          <FaWhatsapp className={iconClass} aria-hidden />
        </a>
        <a
          href={links.x}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en X"
          className={buttonClass}
        >
          <FaXTwitter className={iconClass} aria-hidden />
        </a>
        <a
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en Facebook"
          className={buttonClass}
        >
          <FaFacebookF className={iconClass} aria-hidden />
        </a>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar enlace"
          className={buttonClass}
        >
          {copied ? (
            <FaCheck className={iconClass} aria-hidden />
          ) : (
            <FaLink className={iconClass} aria-hidden />
          )}
        </button>
      </div>
      {copied && (
        <p className="text-xs text-primary-800">Enlace copiado</p>
      )}
    </div>
  );
}
