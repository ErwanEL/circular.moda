'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';

export default function MePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }) => {
      if (data?.user?.email) {
        setEmail(data.user.email);
      }
      setLoading(false);
    });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded bg-white p-8 text-center shadow">
        <h1 className="mb-6 text-2xl font-bold">My Account</h1>
        {loading ? (
          <p>Loading...</p>
        ) : email ? (
          <p className="text-lg">
            Logged in as <span className="font-mono">{email}</span>
          </p>
        ) : (
          <p className="text-red-600">No user found. Please log in.</p>
        )}
      </div>
    </main>
  );
}
