'use client';

import LoginForm from '../ui/login-form';
import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.replace('/me');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-20 transition-colors dark:bg-gray-900 sm:py-24 md:py-32">
      <div className="w-full max-w-lg rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border dark:border-gray-700 dark:bg-gray-800 dark:shadow-lg sm:p-8">
        <span className="bg-gray-900 inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.2em] text-white uppercase dark:bg-white dark:text-gray-900">
          Nueva cuenta
        </span>
        <h1 className="mt-5 text-center text-4xl font-bold text-gray-900 dark:text-gray-100 sm:text-5xl">
          Crear cuenta
        </h1>
        <p className="mt-4 text-center text-base leading-7 text-gray-600 dark:text-gray-300">
          Usa tu email para registrarte. Te enviaremos un enlace para activar tu
          acceso y empezar a vender.
        </p>
        <p className="text-primary-800 mt-3 text-center text-sm font-medium leading-6 sm:text-base">
          Sumate a la comunidad y liberá espacio en tu armario de forma eficaz
          y sin costo.
        </p>
        <div className="mt-6 rounded-3xl bg-gray-900 p-5 text-white dark:bg-gray-700">
          <p className="text-sm font-semibold">¿Ya te registraste?</p>
          <p className="mt-1 text-sm leading-6 text-gray-200">
            Si ya tienes una cuenta, entra directamente desde tu correo con un
            enlace de acceso.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
          >
            Ya tengo cuenta
          </Link>
        </div>
        <Suspense>
          <LoginForm
            mode="signup"
            description={
              <>
                Al abrir el enlace validaremos tu correo y tu cuenta quedará
                lista para usar en circular.moda.
              </>
            }
          />
        </Suspense>
      </div>
    </main>
  );
}
