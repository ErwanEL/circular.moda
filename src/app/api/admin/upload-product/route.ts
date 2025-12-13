import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const ownerId = formData.get('ownerId') as string;
    const files = formData.getAll('images') as File[];

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
      const filePath = `products_preprod/${fileName}`;

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
          { error: `Erreur lors de l'upload de l'image ${i + 1}: ${uploadError.message}` },
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

    // Insérer le produit dans products_preprod
    const { data: productData, error: insertError } = await supabase
      .from('products_preprod')
      .insert({
        name: name.trim(),
        public_id: publicId,
        images: imageUrls,
        owner: parseInt(ownerId, 10), // Convertir en nombre si nécessaire
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting product:', insertError);
      return NextResponse.json(
        { error: `Erreur lors de l'insertion du produit: ${insertError.message}` },
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
      { error: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    );
  }
}

