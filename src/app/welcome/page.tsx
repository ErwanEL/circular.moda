'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';
import ProfileForm from '../me/ui/profile-form';
import { Alert, Spinner } from 'flowbite-react';

export default function WelcomePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        router.push('/login');
        return;
      }

      setEmail(user.email);

      // Try to fetch existing profile
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setName(data.user.name || '');
          setPhone(data.user.phone || '');

          // Redirect if profile is already complete
          if (data.user.name && data.user.phone) {
            router.push('/me');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error');
      }

      setMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/me');
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al guardar',
      });
    } finally {
      setSaving(false);
    }
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login'); // reloads the current page
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size="xl" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">¡Bienvenido!</h1>
          <p className="mt-2 text-gray-600">
            Completa tu perfil para empezar a usar circular.moda
          </p>
        </div>

        {message && (
          <Alert
            color={message.type === 'success' ? 'success' : 'failure'}
            className="mb-6"
          >
            {message.text}
          </Alert>
        )}

        <ProfileForm
          email={email}
          name={name}
          phone={phone}
          saving={saving}
          onSubmit={handleSubmit}
          setName={setName}
          setPhone={setPhone}
        />

        <div className="mt-4 text-center">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
