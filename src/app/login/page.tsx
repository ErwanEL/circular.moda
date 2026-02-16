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
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        router.replace('/me');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 py-32 transition-colors dark:bg-gray-900">
      <div className="w-full max-w-md rounded bg-white p-8 shadow dark:border dark:border-gray-700 dark:bg-gray-800 dark:shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          Iniciar sesión
        </h1>
        <Suspense>
          <LoginForm
            description={
              <>
                ¿Ya tienes una cuenta? Ingresa tu correo electrónico y te
                enviaremos un enlace-mágico 💫 para iniciar sesión de forma
                segura y sin contraseña.
                <br />
                <span className="mt-6 block text-center">
                  <Link
                    href="/signup"
                    className="text-primary-700 dark:text-primary-300 underline"
                  >
                    Regístrate aquí
                  </Link>
                  .
                </span>
              </>
            }
          />
        </Suspense>
      </div>
    </main>
  );
}
