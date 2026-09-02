'use client';

import Image from 'next/image';
import { FormEvent, useId, useState } from 'react';

type SubmitState = 'idle' | 'success' | 'error';

type SubscribeResponse = {
  ok: boolean;
  message?: string;
};

const defaultErrorMessage =
  'No pudimos registrar tu email. Volvé a intentarlo en unos minutos.';

export default function CatalogueNewsletterCard() {
  const emailInputId = useId();
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState('idle');
    setMessage('');

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
        throw new Error(payload?.message || defaultErrorMessage);
      }

      setEmail('');
      setSubmitState('success');
      setMessage(
        payload.message ||
          'Listo. Ya quedaste suscripta para recibir las novedades mensuales del catálogo.'
      );
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : defaultErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitState === 'success') {
    return (
      <div className="relative h-full min-h-[23rem] overflow-hidden rounded-md border border-[#dfe7ce] bg-[radial-gradient(circle_at_top_left,_rgba(229,241,204,0.95),_rgba(255,253,246,1)_55%)] p-5 shadow-[0_18px_40px_rgba(169,189,131,0.16)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9ddb0] to-transparent" />
        <div className="flex h-full flex-col justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6f9f3b] text-white shadow-[0_14px_28px_rgba(111,159,59,0.28)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12.5L9.5 17L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-[#13254a]">
            Ya estás suscripta
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#5d6655]">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[23rem] overflow-hidden rounded-md border border-[#dfe7ce] bg-[radial-gradient(circle_at_top_left,_rgba(229,241,204,0.95),_rgba(255,253,246,1)_55%)] shadow-[0_18px_40px_rgba(169,189,131,0.16)] transition">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9ddb0] to-transparent" />
      <div className="relative h-full min-h-[23rem] w-full overflow-hidden bg-[linear-gradient(135deg,_rgba(245,249,233,0.9),_rgba(232,241,210,0.55))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(210,229,176,0.35),_transparent_55%)]" />
        <div className="absolute inset-0 flex items-start justify-center overflow-hidden">
          <Image
            src="/catalogue-newsletter-illustration.png"
            alt="Ilustración de novedades del catálogo"
            width={420}
            height={420}
            className="mt-[-2.5rem] h-[92%] w-auto max-w-none object-contain opacity-90 drop-shadow-[0_20px_30px_rgba(132,165,84,0.18)]"
            priority={false}
          />
        </div>

        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/70 bg-[#fffdf6]/90 p-3 shadow-[0_18px_42px_rgba(115,143,71,0.18)] backdrop-blur-md">
          <h3 className="text-base leading-tight font-semibold text-[#13254a]">
            Recibí las novedades del catálogo
          </h3>

          <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <label htmlFor={emailInputId} className="sr-only">
            Email
          </label>
          <input
            id={emailInputId}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            required
            disabled={isSubmitting}
            className="h-10 w-full rounded-full border border-[#d6dfc0] bg-white px-4 text-sm text-[#1f2a1b] shadow-[0_10px_22px_rgba(190,203,168,0.18)] transition outline-none focus:border-[#7aaa49] focus:ring-4 focus:ring-[#dce9c3] disabled:cursor-not-allowed disabled:bg-[#f4f5ef]"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center rounded-full bg-[#6f9f3b] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(111,159,59,0.28)] transition hover:bg-[#5f8c32] disabled:cursor-not-allowed disabled:bg-[#92b56b]"
          >
            {isSubmitting ? 'Suscribiendo...' : 'Suscribirme'}
          </button>
        </form>

          {submitState === 'error' && (
            <p className="mt-2 text-xs leading-5 text-[#b44f3d]" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
