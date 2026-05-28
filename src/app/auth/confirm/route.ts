import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { upsertBrevoUserContact } from '@/app/lib/brevo-users';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next') ?? '/me';
  const intent = url.searchParams.get('intent');
  const redirectTo = req.nextUrl.clone();

  redirectTo.pathname = next.startsWith('/') ? next : '/me';
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');
  redirectTo.searchParams.delete('intent');

  if (!code && (!hash || !type)) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('error', 'access_denied');
    loginUrl.searchParams.set(
      'error_description',
      'Email link is invalid or has expired'
    );
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: hash!,
        type: type!,
      });

  if (error) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('error', 'access_denied');
    loginUrl.searchParams.set('error_description', error.message);
    return NextResponse.redirect(loginUrl);
  }

  if (intent === 'signup') {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        await upsertBrevoUserContact({ email: user.email });
      }
    } catch (syncError) {
      console.error('[brevo-user-sync] Signup confirm sync failed:', syncError);
    }
  }

  return NextResponse.redirect(redirectTo);
}

// Keep POST for API/manual confirmation if needed
// export async function POST(req: NextRequest) {
//   const { hash } = await req.json();
//   if (!hash) {
//     return NextResponse.json({ error: 'Missing hash' }, { status: 400 });
//   }

//   const supabase = createClient();
//   const { error } = await supabase.auth.verifyOtp({
//     token_hash: hash,
//     type: 'email',
//   });

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }

//   // Redirect to /me on success
//   return NextResponse.redirect('/me');
// }
