'use client';
import { useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Button from './button';

type LoginFormProps = {
  description?: string;
};

const supabase = createClient();

export default function LoginForm({ description }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>(''); // add messageType
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // set to false to prevent auto sign up
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
