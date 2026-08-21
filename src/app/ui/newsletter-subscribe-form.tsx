'use client';

import { FormEvent, useId, useState } from 'react';

type SubmitState = 'idle' | 'success' | 'error';

type SubscribeResponse = {
  ok: boolean;
  message?: string;
};

type NewsletterSubscribeFormProps = {
  className?: string;
};

export default function NewsletterSubscribeForm({
  className = '',
}: NewsletterSubscribeFormProps) {
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

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto mt-8 w-full max-w-3xl ${className}`}
    >
      <label htmlFor={emailInputId} className="sr-only">
        Email
      </label>
      <input
        id={emailInputId}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="EMAIL"
        autoComplete="email"
        required
        disabled={isSubmitting}
        className="h-16 w-full rounded-md border border-[#c7d0df] bg-white px-5 text-xl font-semibold text-[#111827] outline-none transition placeholder:text-[#b7c2d2] focus:border-[#7da05a] focus:ring-4 focus:ring-[#dfead2] disabled:cursor-not-allowed disabled:bg-gray-50 sm:text-2xl"
      />
      <p className="mt-4 text-left text-base font-semibold text-[#7d8798] sm:text-lg">
        Dejanos tu correo electrónico para suscribirte. Por ejemplo:
        abc@xyz.com
      </p>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mx-auto mt-7 flex min-h-14 cursor-pointer items-center justify-center rounded-full bg-[#7a9d5b] px-8 text-xl font-bold text-white transition hover:bg-[#6b8d4d] disabled:cursor-not-allowed disabled:bg-[#9db685] sm:text-2xl"
      >
        {isSubmitting ? 'Suscribiendo...' : 'Me suscribo'}
      </button>
      {message && (
        <p
          className={`mt-4 text-center text-sm font-medium ${
            submitState === 'error' ? 'text-[#b44f3d]' : 'text-[#5f8c32]'
          }`}
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </form>
  );
}
