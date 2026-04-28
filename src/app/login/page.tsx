'use client';

import LoginForm from '../ui/login-form';
import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const next =
          new URLSearchParams(window.location.search).get('next') ?? '/me';
        router.replace(next.startsWith('/') ? next : '/me');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-20 transition-colors dark:bg-gray-900 sm:py-24 md:py-32">
      <div className="w-full max-w-lg rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border dark:border-gray-700 dark:bg-gray-800 dark:shadow-lg sm:p-8">
        <span className="text-primary-800 bg-primary-100 inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase">
          Ya tengo cuenta
        </span>
        <h1 className="mt-5 text-center text-4xl font-bold text-gray-900 dark:text-gray-100 sm:text-5xl">
          Iniciar sesión
        </h1>
        <p className="mt-4 text-center text-base leading-7 text-gray-600 dark:text-gray-300">
          Ingresa tu email y te enviaremos un enlace para entrar de forma
          segura, sin contraseña.
        </p>
        <p className="text-primary-800 mt-3 text-center text-sm font-medium leading-6 sm:text-base">
          Sumate a la comunidad y liberá espacio en tu armario de forma eficaz
          y sin costo.
        </p>
        <div className="bg-primary-50 border-primary-200 mt-6 rounded-3xl border p-5">
          <p className="text-sm font-semibold text-gray-900">
            ¿Todavía no tienes cuenta?
          </p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Crea tu acceso primero y luego podrás publicar tus prendas desde tu
            perfil.
          </p>
          <Link
            href="/signup"
            className="text-primary-800 mt-4 inline-flex min-h-[44px] items-center rounded-full border border-transparent bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-[var(--color-circular-primary)] hover:bg-[var(--color-circular-lighter)]"
          >
            Ir a registro
          </Link>
        </div>
        <Suspense>
          <LoginForm
            mode="login"
            description={
              <>
                Abre el enlace desde este mismo dispositivo para entrar sin
                fricción. Si el correo no aparece, revisa spam o promociones.
              </>
            }
          />
        </Suspense>
      </div>
    </main>
  );
}
