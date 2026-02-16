import LoginForm from '../ui/login-form';
import Link from 'next/link';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 py-32 transition-colors dark:bg-gray-900">
      <div className="w-full max-w-md rounded bg-white p-8 shadow dark:border dark:border-gray-700 dark:bg-gray-800 dark:shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          Inscribirse
        </h1>
        <Suspense>
          <LoginForm
            description={
              <>
                ¿Aún no tienes cuenta? Ingresa tu correo electrónico y recibirás
                un enlace-mágico 💫 para crear tu cuenta e inscribirte
                fácilmente, sin necesidad de contraseña.
                <br />
                <span className="mt-6 block text-center">
                  <Link
                    href="/login"
                    className="text-primary-700 dark:text-primary-300 underline"
                  >
                    Inicia sesión aquí
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
