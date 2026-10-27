import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { supabase as admin } from '@/app/lib/supabase';
import { normalizeUsername, usernameError } from '@/app/lib/profile-identity';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Iniciá sesión.' }, { status: 401 });
  const username = normalizeUsername(
    new URL(request.url).searchParams.get('username') || ''
  );
  const invalid = usernameError(username);
  if (invalid)
    return NextResponse.json(
      { username, available: false, error: invalid },
      { status: 400 }
    );
  const [profile, reservation] = await Promise.all([
    supabase.from('users').select('id').eq('user_id', user.id).maybeSingle(),
    admin
      .from('seller_usernames')
      .select('owner_id')
      .eq('username', username)
      .maybeSingle(),
  ]);
  if (profile.error || reservation.error)
    return NextResponse.json(
      { error: 'No pudimos comprobar la disponibilidad. Intentá nuevamente.' },
      { status: 503 }
    );
  const available =
    !reservation.data ||
    (profile.data != null && reservation.data.owner_id === profile.data.id);
  return NextResponse.json(
    { username, available },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
