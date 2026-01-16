import LoginForm from '../ui/login-form';
import Link from 'next/link';
import { Suspense } from 'react';

export default function LoginPage() {
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
