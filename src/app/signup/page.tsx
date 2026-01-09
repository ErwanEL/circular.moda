import LoginForm from '../ui/login-form';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center bg-gray-50 py-32">
      <div className="w-full max-w-md rounded bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">Inscribirse</h1>
        <LoginForm description="¿Aún no tienes cuenta? Ingresa tu correo electrónico y recibirás un Magic Link 💫 para crear tu cuenta e inscribirte fácilmente, sin necesidad de contraseña." />
      </div>
    </main>
  );
}
