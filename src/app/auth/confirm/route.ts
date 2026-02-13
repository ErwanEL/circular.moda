import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/client';

// Handle GET for magic link confirmation
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hash = url.searchParams.get('token_hash');
  if (!hash) {
    return NextResponse.json({ error: 'Missing token_hash' }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: hash,
    type: 'email',
  });

  if (error) {
    // Optionally, redirect to login with error message
    return NextResponse.redirect(
      `/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Redirect to /me on success
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
