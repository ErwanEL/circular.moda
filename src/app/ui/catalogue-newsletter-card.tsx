'use client';

import Image from 'next/image';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

type SubmitState = 'idle' | 'success' | 'error';

type SubscribeResponse = {
  ok: boolean;
  message?: string;
};

const defaultMessage =
  'Suscribite para recibir por mail cada mes las últimas publicaciones y novedades del catálogo.';

export default function CatalogueNewsletterCard() {
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    emailInputRef.current?.focus();
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, isSubmitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState('idle');

    try {
      const response = await fetch('/api/catalogue-subscribe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response
        .json()
        .catch(() => null)) as SubscribeResponse | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.message ||
            'No pudimos registrar tu email. Volvé a intentarlo en unos minutos.'
        );
      }

      setEmail('');
      setSubmitState('success');
      setMessage(
        payload.message ||
          'Listo. Ya quedaste suscripto para recibir las novedades mensuales del catálogo.'
      );
      setIsModalOpen(false);
    } catch (error) {
      setSubmitState('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'No pudimos registrar tu email. Volvé a intentarlo en unos minutos.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openModal() {
    setSubmitState('idle');
    setMessage(defaultMessage);
    setIsModalOpen(true);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal();
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={openModal}
        onKeyDown={handleCardKeyDown}
        aria-label="Abrir suscripción a novedades del catálogo"
        className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-md border border-[#dfe7ce] bg-[radial-gradient(circle_at_top_left,_rgba(229,241,204,0.95),_rgba(255,253,246,1)_55%)] shadow-[0_18px_40px_rgba(169,189,131,0.16)] transition outline-none hover:shadow-[0_24px_48px_rgba(169,189,131,0.2)] focus-visible:ring-4 focus-visible:ring-[#dce9c3]"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9ddb0] to-transparent" />
        <div className="relative h-[12.5rem] w-full overflow-hidden bg-[linear-gradient(135deg,_rgba(245,249,233,0.9),_rgba(232,241,210,0.55))] sm:h-[13.5rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(210,229,176,0.35),_transparent_55%)]" />
          <div className="relative flex h-full items-center justify-center p-0">
            <Image
              src="/catalogue-newsletter-illustration.png"
              alt="Ilustración de novedades del catálogo"
              width={420}
              height={420}
              className="h-[115%] w-auto max-w-none object-contain drop-shadow-[0_20px_30px_rgba(132,165,84,0.18)]"
              priority={false}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {/* <span className="inline-flex w-fit items-center rounded-full border border-[#d7e4bf] bg-white/85 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-[#6c9842] uppercase">
            Novedades
          </span> */}
          <h3 className="font-semibold text-[#13254a] sm:text-[1.8rem]">
            No dejes pasar esa joyita
          </h3>
          <p className="mt-4 max-w-[28ch] text-[1rem] leading-7 text-[#5d6655]">
            Suscribite y recibí gratis los últimos artículos publicados directo
            en tu mail para no perderte nada.
          </p>
          {/* <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6a7560]">
            <span>Baja con un click</span>
          </div> */}
          <button
            type="button"
            onClick={openModal}
            className="mt-5 inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#6f9f3b] px-5 text-base font-semibold text-white shadow-[0_14px_28px_rgba(111,159,59,0.28)] transition hover:bg-[#5f8c32]"
          >
            <span>Quiero recibir novedades</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2.5"
                y="4.5"
                width="19"
                height="15"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                d="M5.5 7.5L12 13L18.5 7.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="mt-4 flex items-center gap-3 text-[1rem] text-[#5f6d64]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0 text-[#6f9f3b]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12.5L9.2 17L19 6.5"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>1 email por mes</span>
            <span aria-hidden="true">•</span>
            <span>Sin spam</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-[28px] border border-[#dfe7ce] bg-[radial-gradient(circle_at_top_left,_rgba(229,241,204,0.98),_rgba(255,253,246,1)_55%)] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.18)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#dbe7c3] bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[#6d9841] uppercase">
                  Catálogo mensual
                </span>
                <h3 className="mt-4 text-3xl leading-[1.05] font-semibold text-[#1f2a1b]">
                  Suscribite a las novedades
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dbe7c3] bg-white/80 text-2xl leading-none text-[#607055] transition hover:bg-white"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label htmlFor="catalogue-newsletter-email" className="sr-only">
                Email
              </label>
              <input
                ref={emailInputRef}
                id="catalogue-newsletter-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                required
                disabled={isSubmitting}
                className="h-14 w-full rounded-full border border-[#d6dfc0] bg-white px-5 text-[15px] text-[#1f2a1b] shadow-[0_10px_22px_rgba(190,203,168,0.18)] transition outline-none focus:border-[#7aaa49] focus:ring-4 focus:ring-[#dce9c3]"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#6f9f3b] px-5 text-base font-semibold text-white shadow-[0_14px_28px_rgba(111,159,59,0.28)] transition hover:bg-[#5f8c32] disabled:cursor-not-allowed disabled:bg-[#92b56b]"
              >
                {isSubmitting ? 'Suscribiendo...' : 'Confirmar suscripción'}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6a7560]">
              <span>1 email por mes</span>
              <span>Sin spam</span>
              <span>Baja con un click</span>
            </div>
            <p
              className={`mt-3 text-sm ${
                submitState === 'error' ? 'text-[#b44f3d]' : 'text-[#6a7560]'
              }`}
              aria-live="polite"
            >
              {submitState === 'error'
                ? message
                : 'Al suscribirte aceptás recibir novedades mensuales del catálogo de circular.moda.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
