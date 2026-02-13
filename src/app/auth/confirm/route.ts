import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hash = url.searchParams.get('token_hash');
  if (!hash) {
    return NextResponse.json({ error: 'Missing token_hash' }, { status: 400 });
  }

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

  // Redirect to `next` query param or default to /welcome (profile completion).
  // Welcome page redirects to /me when profile is already complete.
  const nextPath = url.searchParams.get('next') ?? '/welcome';
  const safeNext =
    nextPath.startsWith('/') && !nextPath.startsWith('//')
      ? nextPath
      : '/welcome';
  return NextResponse.redirect(safeNext);
}
