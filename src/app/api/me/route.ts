import { createClient } from '@/app/lib/supabase/server';
import { normalizeArgentinaPhone } from '@/app/lib/argentina-phone';
import { upsertBrevoUserContact } from '@/app/lib/brevo-users';
import {
  normalizeUsername,
  usernameError,
  normalizeInstagram,
} from '@/app/lib/profile-identity';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, phone, user_id, username, instagram_username')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Error fetching profile' },
        { status: 500 }
      );
    }

    let products = [];
    if (userData) {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('owner', userData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        products = productsData || [];
      }
    }

    return NextResponse.json({
      user: userData || null,
      products: products,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return NextResponse.json(
        { error: 'Datos de perfil inválidos.' },
        { status: 400 }
      );
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const normalizedPhone = normalizeArgentinaPhone(body.phone);

    if (!name || !normalizedPhone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const identity: { username?: string; instagram_username?: string | null } =
      {};
    if (body.username !== undefined) {
      if (typeof body.username !== 'string')
        return NextResponse.json(
          { error: 'Nombre de usuario inválido.' },
          { status: 400 }
        );
      const username = normalizeUsername(body.username);
      // Empty on onboarding means the database generates a unique default.
      if (username) {
        const error = usernameError(username);
        if (error) return NextResponse.json({ error }, { status: 400 });
        identity.username = username;
      }
    }
    if (body.instagram_username !== undefined) {
      const instagram =
        typeof body.instagram_username === 'string'
          ? normalizeInstagram(body.instagram_username)
          : null;
      if (instagram === null)
        return NextResponse.json(
          {
            error: 'Ingresá un usuario o enlace de perfil de Instagram válido.',
          },
          { status: 400 }
        );
      identity.instagram_username = instagram || null;
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, user_id, username')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Error checking existing user' },
        { status: 500 }
      );
    }

    let resultUser;

    if (existingUser) {
      // Update
      const { data, error } = await supabase
        .from('users')
        .update({ name, phone: normalizedPhone, ...identity })
        .eq('id', existingUser.id)
        .eq('user_id', authUser.id)
        .select('id, name, phone, username, instagram_username')
        .single();

      if (error) {
        return NextResponse.json(
          {
            error:
              error.code === '23505'
                ? error.message.includes('users_auth_identity_unique')
                  ? 'Tu perfil ya fue creado. Recargá la página para continuar.'
                  : 'Este nombre de usuario ya está reservado. Elegí otro.'
                : 'No pudimos guardar el perfil. Intentá nuevamente.',
          },
          { status: error.code === '23505' ? 409 : 500 }
        );
      }
      resultUser = data;
    } else {
      // Create
      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          ...identity,
          phone: normalizedPhone,
          user_id: authUser.id,
        })
        .select('id, name, phone, username, instagram_username')
        .single();

      if (error) {
        return NextResponse.json(
          {
            error:
              error.code === '23505'
                ? error.message.includes('users_auth_identity_unique')
                  ? 'Tu perfil ya fue creado. Recargá la página para continuar.'
                  : 'Este nombre de usuario ya está reservado. Elegí otro.'
                : 'No pudimos guardar el perfil. Intentá nuevamente.',
          },
          { status: error.code === '23505' ? 409 : 500 }
        );
      }
      resultUser = data;
    }

    revalidatePath(`/user/${resultUser.id}`);
    revalidatePath(`/@${resultUser.username}`);
    if (existingUser?.username) revalidatePath(`/@${existingUser.username}`);
    revalidatePath('/sitemap.xml');

    if (authUser.email) {
      try {
        await upsertBrevoUserContact({
          email: authUser.email,
          name: resultUser.name,
          phone: resultUser.phone,
        });
      } catch (syncError) {
        console.error('[brevo-user-sync] Profile sync failed:', syncError);
      }
    }

    return NextResponse.json({ user: resultUser });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
