import { createClient } from '@/app/lib/supabase/server';
import { supabase as admin } from '@/app/lib/supabase';
import { parseStorefront } from '@/app/lib/storefront';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export const runtime = 'nodejs';
export async function PUT(request: Request) {
  let uploaded: string | null = null;
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { data: profile, error: profileError } = await client
      .from('users')
      .select('id, username, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile)
      return NextResponse.json(
        { error: 'Completá tu perfil primero.' },
        { status: 400 }
      );
    const form = await request.formData();
    let settings;
    try {
      settings = parseStorefront({
        boutique_name: form.get('boutique_name'),
        bio: form.get('bio'),
        neighborhood: form.get('neighborhood') ?? '',
        pinned_product_ids: JSON.parse(String(form.get('pinned_product_ids'))),
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Datos inválidos.' },
        { status: 400 }
      );
    }
    if (settings.pinned_product_ids.length) {
      const { data, error } = await client
        .from('products')
        .select('id')
        .eq('owner', profile.id)
        .in('id', settings.pinned_product_ids);
      if (error) throw error;
      if (data.length !== settings.pinned_product_ids.length)
        return NextResponse.json(
          { error: 'Solo podés destacar tus propias prendas publicadas.' },
          { status: 400 }
        );
    }
    let avatar =
      form.get('remove_avatar') === 'true' ? null : profile.avatar_url;
    const file = form.get('photo');
    if (file instanceof File && file.size) {
      if (
        file.size > 3 * 1024 * 1024 ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      )
        return NextResponse.json(
          { error: 'Usá una foto JPG, PNG o WebP de hasta 3 MB.' },
          { status: 400 }
        );
      let buffer;
      try {
        buffer = await sharp(Buffer.from(await file.arrayBuffer()), {
          limitInputPixels: 25000000,
        })
          .rotate()
          .resize(512, 512, { fit: 'cover' })
          .webp({ quality: 82 })
          .toBuffer();
      } catch {
        return NextResponse.json(
          { error: 'No pudimos leer la foto. Probá con otra imagen.' },
          { status: 400 }
        );
      }
      uploaded = `avatars/${user.id}/${randomUUID()}.webp`;
      const { error } = await admin.storage
        .from('storage')
        .upload(uploaded, buffer, { contentType: 'image/webp', upsert: false });
      if (error) throw error;
      avatar = admin.storage.from('storage').getPublicUrl(uploaded)
        .data.publicUrl;
    }
    const { data, error } = await client
      .from('users')
      .update({ ...settings, avatar_url: avatar })
      .eq('id', profile.id)
      .eq('user_id', user.id)
      .select(
        'boutique_name, bio, city, neighborhood, avatar_url, pinned_product_ids'
      )
      .single();
    if (error) throw error;
    // The saved image is now referenced; never remove it on a later failure.
    uploaded = null;
    revalidatePath(`/@${profile.username}`);
    revalidatePath(`/user/${profile.id}`);
    return NextResponse.json({ storefront: data });
  } catch (error) {
    if (uploaded) await admin.storage.from('storage').remove([uploaded]);
    console.error('[storefront] Save failed', error);
    return NextResponse.json(
      { error: 'No pudimos guardar la vitrina. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}
