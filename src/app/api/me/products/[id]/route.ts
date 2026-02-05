import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { supabase } from '@/app/lib/supabase';

async function getCurrentUserId() {
  const serverSupabase = await createClient();
  const {
    data: { user: authUser },
  } = await serverSupabase.auth.getUser();
  if (!authUser) return null;
  const { data: userData } = await serverSupabase
    .from('users')
    .select('id')
    .eq('user_id', authUser.id)
    .maybeSingle();
  return userData?.id ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (userId == null) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('owner', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product:', error);
      return NextResponse.json(
        { error: 'Error al cargar el producto' },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: 'No encontrado o no tenés permiso para editarlo' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Ha ocurrido un error inesperado' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (userId == null) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('products')
      .select('id, public_id')
      .eq('id', productId)
      .eq('owner', userId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: 'No encontrado o no tenés permiso para editarlo' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const price = formData.get('price') as string;
    const size = formData.get('size') as string;
    const color = formData.get('color') as string;
    const category = formData.get('category') as string;
    const genderStr = formData.get('gender') as string;
    const description = formData.get('description') as string;
    const existingImagesStr = formData.get('existingImages') as string;
    const newFiles = formData.getAll('images') as File[];

    let gender: string[] = [];
    if (genderStr) {
      try {
        gender = JSON.parse(genderStr);
      } catch {
        gender = [];
      }
    }

    let existingImages: string[] = [];
    if (existingImagesStr) {
      try {
        existingImages = JSON.parse(existingImagesStr) as string[];
      } catch {
        existingImages = [];
      }
    }

    if (gender.length > 0) {
      const { data: gendersData } = await supabase
        .from('genders')
        .select('gender')
        .order('gender', { ascending: true });
      const validGenders = gendersData
        ? gendersData.map((row: { gender: string }) => row.gender)
        : [];
      if (validGenders.length > 0) {
        const findClosestGender = (value: string): string | null => {
          const n = value.toLowerCase().trim();
          const exact = validGenders.find((g) => g.toLowerCase().trim() === n);
          if (exact) return exact;
          const map: Record<string, string> = {
            men: 'male',
            man: 'male',
            women: 'female',
            woman: 'female',
            unisex: 'unisex',
          };
          const mapped = map[n];
          if (mapped) {
            const found = validGenders.find((g) => g.toLowerCase() === mapped);
            if (found) return found;
          }
          const partial = validGenders.find((g) => {
            const ng = g.toLowerCase().trim();
            return ng.includes(n) || n.includes(ng);
          });
          return partial ?? null;
        };
        gender = gender
          .map((g) => findClosestGender(g))
          .filter((g): g is string => g !== null);
      } else {
        gender = [];
      }
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del producto es obligatorio' },
        { status: 400 }
      );
    }

    const totalImages = existingImages.length + (newFiles?.length ?? 0);
    if (totalImages === 0) {
      return NextResponse.json(
        { error: 'Agregá al menos una imagen' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const newUrls: string[] = [];
    const publicId = existing.public_id;

    if (newFiles?.length) {
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const fileExt = file.name.split('.').pop();
        const suffix = `${Date.now()}-${i + 1}`;
        const fileName = `${publicId}-${suffix}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
          .from('storage')
          .upload(filePath, uint8Array, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          return NextResponse.json(
            {
              error: `Error al subir la imagen: ${uploadError.message}`,
            },
            { status: 500 }
          );
        }

        const { data: urlData } = supabase.storage
          .from('storage')
          .getPublicUrl(filePath);
        if (urlData?.publicUrl) {
          newUrls.push(urlData.publicUrl);
        } else {
          newUrls.push(
            `${supabaseUrl}/storage/v1/object/public/storage/${filePath}`
          );
        }
      }
    }

    const images = [...existingImages, ...newUrls];

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      images,
      featured: false,
    };

    if (price !== undefined && price !== null && String(price).trim() !== '') {
      updateData.price = parseFloat(String(price));
    } else {
      updateData.price = null;
    }
    if (size !== undefined && size !== null && String(size).trim() !== '') {
      updateData.size = String(size).trim();
    } else {
      updateData.size = null;
    }
    if (color !== undefined && color !== null && String(color).trim() !== '') {
      updateData.color = String(color).trim();
    } else {
      updateData.color = null;
    }
    if (
      category !== undefined &&
      category !== null &&
      String(category).trim() !== ''
    ) {
      updateData.category = String(category).trim();
    } else {
      updateData.category = null;
    }
    if (gender.length > 0) {
      const { data: allValidGenders } = await supabase
        .from('genders')
        .select('gender');
      const validGenderValues = allValidGenders
        ? allValidGenders.map((row: { gender: string }) => row.gender)
        : [];
      const validatedGenders = gender.filter((g: string) =>
        validGenderValues.includes(g)
      );
      updateData.gender = validatedGenders.length > 0 ? validatedGenders : null;
    } else {
      updateData.gender = null;
    }
    if (
      description !== undefined &&
      description !== null &&
      String(description).trim() !== ''
    ) {
      updateData.description = String(description).trim();
    } else {
      updateData.description = null;
    }

    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('owner', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[Me Edit] Error updating product:', updateError);
      if (
        updateError.code === '23503' &&
        updateError.details?.includes('gender')
      ) {
        const withoutGender = { ...updateData };
        delete withoutGender.gender;
        const { data: retry, error: retryError } = await supabase
          .from('products')
          .update(withoutGender)
          .eq('id', productId)
          .eq('owner', userId)
          .select()
          .single();
        if (retryError) {
          return NextResponse.json(
            { error: `Error al guardar: ${retryError.message}` },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          product: retry,
          message: 'Prenda actualizada correctamente',
        });
      }
      return NextResponse.json(
        { error: `Error al guardar: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Prenda actualizada correctamente',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Ha ocurrido un error inesperado' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (userId == null) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('owner', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching product for delete:', fetchError);
      return NextResponse.json(
        { error: 'Error al eliminar la prenda' },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'No encontrado o no tenés permiso para eliminarlo' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('owner', userId);

    if (deleteError) {
      console.error('[Me Delete] Error:', deleteError);
      return NextResponse.json(
        { error: `Error al eliminar: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prenda eliminada correctamente',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Ha ocurrido un error inesperado' },
      { status: 500 }
    );
  }
}
