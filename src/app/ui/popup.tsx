'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

export default function Popup() {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    sessionStorage.setItem('popupShown', 'true');
  }, []);

  useEffect(() => {
    // Check if popup has already been shown in this session
    const popupShown = sessionStorage.getItem('popupShown');
    if (popupShown === 'true') {
      return;
    }

    // Show popup after 15 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem('popupShown', 'true');
    }, 20000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#00000096] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          iframe {
            margin-top: -32px !important;
            margin-bottom: -32px !important;
          }
        `,
        }}
      />
      <div
        className="relative my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mt-2 mb-4 flex items-start justify-end bg-white pt-2 pb-2">
          <button
            onClick={handleClose}
            className="-mt-2 -mr-2 flex min-h-[48px] min-w-[48px] cursor-pointer touch-manipulation items-center justify-center text-4xl leading-none text-gray-500 hover:text-gray-700 active:text-gray-900 sm:text-2xl"
            aria-label="Cerrar popup"
            type="button"
          >
            ×
          </button>
        </div>
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Recibí cada mes tu catálogo de ropa
          </h2>
          <p className="mb-4 text-sm font-light text-gray-500 sm:text-base md:text-lg dark:text-gray-400">
            Mantenete al tanto de las{' '}
            <span className="font-bold text-gray-900">
              últimas buenas ofertas
            </span>
          </p>
        </div>
        <div className="mb-0 flex items-center justify-center gap-4">
          <Image
            src="/popupnobg.png"
            alt="Popup"
            width={200}
            height={200}
            className="rounded-lg shadow-lg"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="hidden h-6 w-6 text-gray-700 sm:block"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <div className="hidden flex-col items-center gap-1 sm:flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-medium text-gray-600">EMAIL</span>
          </div>
        </div>
        <div className="flex h-[250px] justify-center sm:h-[200px]">
          <iframe
            width="540"
            height="305"
            src="https://e7b4fa4e.sibforms.com/serve/MUIFAFp26SAaAgfK2vdo0gwbOhCItlRHsvatFXKJ3SQ558IKSN09A1BLhS28I9hNBynInQCmnQHKp-eMjeF0UFTqwWFeMavr1D6Fd7EtocWjvECxRNotxnnwcdE-Ch8vQdf8LPih_ODWG0J6sUEOPa2DI38FJlKMAT3eWrVjlxwow3WFh2X2oaAEAB0FKt3hsbWRA_Q5nqb3gYEv"
            frameBorder="0"
            scrolling="auto"
            allowFullScreen
            style={{
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              maxWidth: '100%',
              borderRadius: '0.5rem',
              outline: 'none',
              overflow: 'hidden',
              padding: '0px',
            }}
            title="Suscripción novedades"
          ></iframe>
        </div>
        <p className="mt-2 text-center text-xs text-gray-500 uppercase">
          Sin spam. 1 email por mes. Te desuscribís cuando quieras
        </p>
      </div>
    </div>
  );
}
