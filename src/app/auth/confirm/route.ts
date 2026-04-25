import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hash = url.searchParams.get('token_hash');
  const code = url.searchParams.get('code');
  const typeParam = url.searchParams.get('type') || 'email';

  const redirect = (pathnameWithQuery: string) =>
    NextResponse.redirect(new URL(pathnameWithQuery, url));

  const supabase = await createClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
  } else if (hash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: hash,
      type: typeParam as
        | 'signup'
        | 'invite'
        | 'magiclink'
        | 'recovery'
        | 'email_change'
        | 'email',
    });
    if (error) {
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    return redirect(
      `/login?error=${encodeURIComponent(
        'Missing login token. Please request a new link.'
      )}`
    );
  }

  // After session is set, redirect into the app.
  return redirect('/me');
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
