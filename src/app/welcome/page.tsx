'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import Button from '../ui/button';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }) => {
      if (data?.user?.email) {
        setEmail(data.user.email);
      }
      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login'); // reloads the current page
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded bg-white p-8 text-center shadow">
        <h1 className="mb-6 text-2xl font-bold">Welcome!</h1>
        {loading ? (
          <p>Loading...</p>
        ) : email ? (
          <>
            <p className="text-lg">
              You are logged in as <span className="font-mono">{email}</span>
            </p>
            <Button
              onClick={handleLogout}
              solid
              size="md"
              className="mt-6 w-full cursor-pointer"
              variant="secondary"
            >
              Logout
            </Button>
          </>
        ) : (
          <p className="text-red-600">No user found. Please log in.</p>
        )}
      </div>
    </main>
  );
}
