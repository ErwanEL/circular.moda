'use client';

import { usePwaInstall } from '../ui/pwa-install-provider';
import { getButtonClasses } from '../ui/button-classes';

export function InstallPageButton() {
  const { install, installed, promptAvailable, ready } = usePwaInstall();

  if (!ready) {
    return <div className="h-12 w-52 animate-pulse rounded-full bg-gray-200" />;
  }

  if (installed) {
    return (
      <p className="bg-primary-100 text-primary-900 rounded-full px-5 py-3 font-semibold">
        ✓ La app ya está instalada
      </p>
    );
  }

  if (!promptAvailable) return null;

  return (
    <button
      type="button"
      onClick={() => void install()}
      className={getButtonClasses({
        solid: true,
        bold: true,
        size: 'lg',
      })}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m7 10 5 5 5-5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
      </svg>
      Instalar la app
    </button>
  );
}
