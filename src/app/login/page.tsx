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
    <main className="flex items-center justify-center bg-gray-50 py-32">
      <div className="w-full max-w-md rounded bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">Iniciar sesión</h1>
        <Suspense>
          <LoginForm
            description={
              <>
                ¿Ya tienes una cuenta? Ingresa tu correo electrónico y te
                enviaremos un enlace-mágico 💫 para iniciar sesión de forma
                segura y sin contraseña.
                <br />
                <span className="mt-6 block text-center">
                  <Link href="/signup" className=" ">
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
