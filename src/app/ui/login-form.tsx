'use client';
import { useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from './button';

type LoginFormProps = {
  description?: string;
};

const supabase = createClient();

export default function LoginForm({ description }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract error from URL params
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  let externalError = '';
  if (
    error === 'access_denied' &&
    errorCode === 'otp_expired' &&
    errorDescription === 'Email link is invalid or has expired'
  ) {
    externalError =
      'El enlace de acceso ha expirado o no es válido. Por favor, solicita un nuevo enlace para continuar.';
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/welcome`,
      },
    });
    if (error) {
      setMessage(error.message);
      setMessageType('error');
    } else {
      setMessage(
        'Revise su correo electrónico para obtener el enlace de inicio de sesión!'
      );
      setMessageType('success');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleLogin} className="mx-auto mt-8 max-w-sm space-y-4">
      {externalError && (
        <div
          class="mb-4 flex items-center rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          <svg
            class="me-3 inline h-4 w-4 shrink-0"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <span class="sr-only">Info</span>
          <div>
            <span class="font-medium">Error</span> {externalError}
          </div>
        </div>
      )}
      <label className="block">
        <span className="text-gray-700">Email</span>
        <input
          type="email"
          className="mt-1 block w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      {!message && (
        <Button
          type="submit"
          solid
          size="md"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Sending...' : ' Iniciar sesión con Magic Link 💫'}
        </Button>
      )}
      {message && (
        <div
          className={`text-center text-sm ${
            messageType === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </div>
      )}
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </form>
  );
}
