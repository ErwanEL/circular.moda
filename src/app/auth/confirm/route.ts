import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';

// Handle GET for magic link confirmation
  const url = new URL(req.url);
  const hash = url.searchParams.get('token_hash');
  if (!hash) {
    return NextResponse.json({ error: 'Missing token_hash' }, { status: 400 });
  }

  // Use enhanced server-side Supabase client with cookie/session support
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

  return NextResponse.redirect('/me');
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
