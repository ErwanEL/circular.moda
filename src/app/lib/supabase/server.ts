import { createServerClient } from '@supabase/ssr';

import { cookies } from 'next/headers';

export async function createClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // In some runtime contexts, cookies may be unavailable.
    // We still return a client to avoid crashing route handlers.
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,

    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,

    {
      cookies: {
        getAll() {
          return cookieStore?.getAll() ?? [];
        },

        setAll(cookiesToSet) {
          try {
            if (!cookieStore) return;
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
