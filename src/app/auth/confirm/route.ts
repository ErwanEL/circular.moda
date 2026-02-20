import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hash = url.searchParams.get('token_hash');
  if (!hash) {
    return NextResponse.json({ error: 'Missing token_hash' }, { status: 400 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    console.error(
      '[auth/confirm] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    );
    return NextResponse.redirect(
      '/login?error=' +
        encodeURIComponent('Server configuration error. Please try again later.')
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: hash,
      type: 'email',
    });

    if (error) {
      return NextResponse.redirect(
        `/login?error=${encodeURIComponent(error.message)}`
      );
    }

    // Redirect to /me if profile complete (name + phone), else /welcome (signup flow)
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    let redirectTo = '/welcome';
    if (authUser?.id) {
      const { data: userRow } = await supabase
        .from('users')
        .select('name, phone')
        .eq('user_id', authUser.id)
        .maybeSingle();
      const hasProfile =
        userRow &&
        typeof userRow.name === 'string' &&
        userRow.name.trim() !== '' &&
        typeof userRow.phone === 'string' &&
        userRow.phone.trim() !== '';
      if (hasProfile) {
        redirectTo = '/me';
      }
    }
    return NextResponse.redirect(redirectTo);
  } catch (err) {
    console.error('[auth/confirm]', err);
    return NextResponse.redirect(
      '/login?error=' +
        encodeURIComponent('Something went wrong. Please try again.')
    );
  }
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
