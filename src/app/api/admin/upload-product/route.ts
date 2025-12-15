import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const ownerId = formData.get('ownerId') as string;
    const price = formData.get('price') as string;
    const size = formData.get('size') as string;
    const color = formData.get('color') as string;
    const category = formData.get('category') as string;
    const genderStr = formData.get('gender') as string;
    const description = formData.get('description') as string;
    const featuredStr = formData.get('featured') as string;
    const files = formData.getAll('images') as File[];

    // Parser gender si fourni
    let gender: string[] = [];
    if (genderStr) {
      try {
        gender = JSON.parse(genderStr);
      } catch {
        gender = [];
      }
    }

    // Parser featured (booléen)
    const featured = featuredStr === 'true';

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du produit est requis' },
        { status: 400 }
      );
    }

    if (!ownerId || ownerId.trim() === '') {
      return NextResponse.json(
        { error: 'Un utilisateur est requis' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Au moins une image est requise' },
        { status: 400 }
      );
    }

    // Générer un public_id (UUID) pour le produit
    const publicId = randomUUID();

    // Upload des images vers Supabase Storage
    const imageUrls: string[] = [];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${publicId}-${i + 1}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Convertir File en ArrayBuffer puis en Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('storage')
        .upload(filePath, uint8Array, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return NextResponse.json(
          {
            error: `Erreur lors de l'upload de l'image ${i + 1}: ${uploadError.message}`,
          },
          { status: 500 }
        );
      }

      // Obtenir l'URL publique de l'image
      const { data: urlData } = supabase.storage
        .from('storage')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        imageUrls.push(urlData.publicUrl);
      } else {
        // Fallback: construire l'URL manuellement
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/storage/${filePath}`;
        imageUrls.push(publicUrl);
      }
    }

    // Préparer les données d'insertion
    const insertData: any = {
      name: name.trim(),
      public_id: publicId,
      images: imageUrls,
      owner: parseInt(ownerId, 10),
    };

    // Ajouter les champs optionnels seulement s'ils sont fournis
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
      insertData.gender = gender;
    }
    if (description && description.trim() !== '') {
      insertData.description = description.trim();
    }
    insertData.featured = featured;

    // Insérer le produit dans products
    const { data: productData, error: insertError } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting product:', insertError);
      return NextResponse.json(
        {
          error: `Erreur lors de l'insertion du produit: ${insertError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: productData,
      message: 'Produit uploadé avec succès',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite" },
      { status: 500 }
    );
  }
}
