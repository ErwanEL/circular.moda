import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/client';

export async function POST(req: NextRequest) {
  const { hash } = await req.json();
  if (!hash) {
    return NextResponse.json({ error: 'Missing hash' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: hash,
    type: 'email',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Redirect to /me on success
  return NextResponse.redirect('/me');
}
