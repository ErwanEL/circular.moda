'use client';
import LoginForm from '../ui/login-form';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center bg-gray-50 py-32">
      <div className="w-full max-w-md rounded bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">Iniciar sesión</h1>
        <LoginForm description="¿Ya tienes una cuenta? Ingresa tu correo electrónico y te enviaremos un Magic Link 💫 para iniciar sesión de forma segura y sin contraseña." />
      </div>
    </main>
  );
}
