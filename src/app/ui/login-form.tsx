'use client';
import { useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';

const supabase = createClient();

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // set to false to prevent auto sign up
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/welcome`,
      },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the login link!');
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
      <button
        type="submit"
        className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Login with Magic Link'}
      </button>
      {message && (
        <div className="text-center text-sm text-red-600">{message}</div>
      )}
    </form>
  );
}
