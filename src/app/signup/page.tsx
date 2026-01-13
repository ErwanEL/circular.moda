import LoginForm from '../ui/login-form';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginFormWithParams(props) {
  const searchParams = useSearchParams();
  return <LoginForm {...props} searchParams={searchParams} />;
}

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center bg-gray-50 py-32">
      <div className="w-full max-w-md rounded bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">Inscribirse</h1>
        <Suspense>
          <LoginFormWithParams
            description={
              <>
                ¿Aún no tienes cuenta? Ingresa tu correo electrónico y recibirás
                un enlace-mágico 💫 para crear tu cuenta e inscribirte
                fácilmente, sin necesidad de contraseña.
                <br />
                <span className="mt-6 block text-center">
                  <Link href="/login" className="">
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
