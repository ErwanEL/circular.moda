'use client';
import { useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Button from './button';

type LoginFormMode = 'login' | 'signup';

type LoginFormProps = {
  mode: LoginFormMode;
  description?: React.ReactNode;
};

const supabase = createClient();

const FORM_COPY: Record<
  LoginFormMode,
  {
    buttonLabel: string;
    loadingLabel: string;
    successMessage: string;
    shouldCreateUser: boolean;
  }
> = {
  login: {
    buttonLabel: 'Enviar enlace para entrar',
    loadingLabel: 'Enviando enlace...',
    successMessage:
      'Revisa tu correo: te enviamos un enlace para iniciar sesión.',
    shouldCreateUser: false,
  },
  signup: {
    buttonLabel: 'Crear cuenta con este email',
    loadingLabel: 'Preparando tu registro...',
    successMessage:
      'Revisa tu correo: te enviamos un enlace para completar tu registro.',
    shouldCreateUser: true,
  },
};

export default function LoginForm({ mode, description }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const copy = FORM_COPY[mode];
  const next = searchParams.get('next') ?? '/me';

  // Extract error from URL params
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  let externalError = '';
  if (
    error === 'access_denied' &&
    errorDescription === 'Email link is invalid or has expired'
  ) {
    externalError =
      'El enlace de acceso ha expirado o no es válido. Por favor, solicita un nuevo enlace para continuar.';
  } else if (errorDescription) {
    externalError =
      'No se pudo iniciar sesión con el enlace de acceso. Solicita uno nuevo e inténtalo otra vez.';
  } else if (error) {
    externalError = 'No se pudo iniciar sesión. Solicita un nuevo enlace.';
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const confirmUrl = new URL('/auth/confirm', siteUrl);
    confirmUrl.searchParams.set('next', next);
    confirmUrl.searchParams.set('intent', mode);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: copy.shouldCreateUser,
        emailRedirectTo: confirmUrl.toString(),
      },
    });
    if (error) {
      if (mode === 'login') {
        setMessage(
          'No pudimos enviarte el acceso. Verifica tu correo o crea una cuenta si todavía no estás registrado.'
        );
      } else {
        setMessage(
          'No pudimos iniciar tu registro. Revisa tu correo e inténtalo de nuevo.'
        );
      }
      setMessageType('error');
    } else {
      setMessage(copy.successMessage);
      setMessageType('success');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleLogin} className="mx-auto mt-8 max-w-none space-y-5">
      {externalError && (
        <div
          className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          <svg
            className="mt-0.5 inline h-4 w-4 shrink-0"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <span className="sr-only">Info</span>
          <div>
            <span className="font-medium">Error</span> {externalError}
          </div>
        </div>
      )}
      <label className="block">
        <span className="text-sm font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-200">
          Email
        </span>
        <input
          type="email"
          className="focus:ring-primary-500 dark:focus:ring-primary-300 mt-2 block min-h-[56px] w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors focus:ring-2 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          required
        />
      </label>
      <Button
        type="submit"
        solid
        size="md"
        className="min-h-[56px] w-full justify-center px-5 text-center text-base leading-tight sm:text-lg"
        disabled={loading}
        text={
          loading
            ? copy.loadingLabel
            : messageType === 'success'
              ? 'Reenviar enlace'
              : copy.buttonLabel
        }
      />
      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            messageType === 'success'
              ? 'border-green-200 bg-green-50 text-green-700 dark:text-green-400'
              : 'border-red-200 bg-red-50 text-red-700 dark:text-red-400'
          }`}
        >
          {message}
        </div>
      )}
      {description && (
        <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
    </form>
  );
}
