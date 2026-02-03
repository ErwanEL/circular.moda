import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { supabase } from '@/app/lib/supabase';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createClient();
    const {
      data: { user: authUser },
    } = await serverSupabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para publicar un producto' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await serverSupabase
      .from('users')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (userError || !userData) {
      return NextResponse.json(
        {
          error:
            'Completa tu perfil (nombre y WhatsApp) en Mi Perfil antes de publicar una prenda',
        },
        { status: 400 }
      );
    }

    const ownerId = String(userData.id);

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const price = formData.get('price') as string;
    const size = formData.get('size') as string;
    const color = formData.get('color') as string;
    const category = formData.get('category') as string;
    const genderStr = formData.get('gender') as string;
    const description = formData.get('description') as string;
    const featuredStr = formData.get('featured') as string;
    const files = formData.getAll('images') as File[];

    let gender: string[] = [];
    if (genderStr) {
      try {
        gender = JSON.parse(genderStr);
      } catch {
        gender = [];
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
          const normalizedValue = value.toLowerCase().trim();
          const exactMatch = validGenders.find(
            (g) => g.toLowerCase().trim() === normalizedValue
          );
          if (exactMatch) return exactMatch;
          const genderMapping: Record<string, string> = {
            men: 'male',
            man: 'male',
            women: 'female',
            woman: 'female',
            unisex: 'unisex',
          };
          const mappedValue = genderMapping[normalizedValue];
          if (mappedValue) {
            const found = validGenders.find(
              (g) => g.toLowerCase() === mappedValue
            );
            if (found) return found;
          }
          const partialMatch = validGenders.find((g) => {
            const normalizedG = g.toLowerCase().trim();
            return (
              normalizedG.includes(normalizedValue) ||
              normalizedValue.includes(normalizedG)
            );
          });
          return partialMatch ?? null;
        };

        const mappedGenders = gender
          .map((g: string) => findClosestGender(g))
          .filter((g: string | null): g is string => g !== null);
        gender = mappedGenders;
      } else {
        gender = [];
      }
    }

    const featured = featuredStr === 'true';

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del producto es obligatorio' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Agregá al menos una imagen' },
        { status: 400 }
      );
    }

    const publicId = randomUUID();
    const imageUrls: string[] = [];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${publicId}-${i + 1}.${fileExt}`;
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
            error: `Error al subir la imagen ${i + 1}: ${uploadError.message}`,
          },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from('storage')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        imageUrls.push(urlData.publicUrl);
      } else {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/storage/${filePath}`;
        imageUrls.push(publicUrl);
      }
    }

    const insertData: Record<string, unknown> = {
      name: name.trim(),
      public_id: publicId,
      images: imageUrls,
      owner: parseInt(ownerId, 10),
      featured,
    };

    if (price && price.trim() !== '') {
      insertData.price = parseFloat(price);
    }
    if (size && size.trim() !== '') {
      insertData.size = size.trim();
    }
    if (color && color.trim() !== '') {
      insertData.color = color.trim();
    }
    if (category && category.trim() !== '') {
      insertData.category = category.trim();
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
      if (validatedGenders.length > 0) {
        insertData.gender = validatedGenders;
      }
    }
    if (description && description.trim() !== '') {
      insertData.description = description.trim();
    }

    const { data: productData, error: insertError } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[Me Upload] Error inserting product:', insertError);
      if (
        insertError.code === '23503' &&
        insertError.details?.includes('gender')
      ) {
        const insertDataWithoutGender = { ...insertData };
        delete insertDataWithoutGender.gender;
        const { data: productDataRetry, error: insertErrorRetry } =
          await supabase
            .from('products')
            .insert(insertDataWithoutGender)
            .select()
            .single();
        if (insertErrorRetry) {
          return NextResponse.json(
            {
              error: `Error al guardar el producto: ${insertErrorRetry.message}`,
            },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          product: productDataRetry,
          message: 'Prenda publicada correctamente',
        });
      }
      return NextResponse.json(
        {
          error: `Error al guardar el producto: ${insertError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: productData,
      message: 'Prenda publicada correctamente',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Ha ocurrido un error inesperado' },
      { status: 500 }
    );
  }
}
