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

    // Valider et mapper les genres aux valeurs valides dans Supabase
    if (gender.length > 0) {
      const { data: gendersData } = await supabase
        .from('genders')
        .select('gender')
        .order('gender', { ascending: true });

      const validGenders = gendersData
        ? gendersData.map((row: { gender: string }) => row.gender)
        : [];

      if (validGenders.length > 0) {
        console.log('[Upload] Genres valides dans Supabase:', JSON.stringify(validGenders));
        console.log('[Upload] Genres reçus à mapper:', JSON.stringify(gender));
        
        // Fonction pour trouver la correspondance la plus proche
        const findClosestGender = (value: string): string | null => {
          const normalizedValue = value.toLowerCase().trim();
          
          // Correspondance exacte
          const exactMatch = validGenders.find(
            (g) => g.toLowerCase().trim() === normalizedValue
          );
          if (exactMatch) {
            console.log(`[Upload] Correspondance exacte trouvée: "${value}" → "${exactMatch}"`);
            return exactMatch;
          }

          // Mapping spécial pour les variations communes
          const genderMapping: Record<string, string> = {
            'men': 'male',
            'man': 'male',
            'women': 'female',
            'woman': 'female',
            'unisex': 'unisex',
          };
          
          const mappedValue = genderMapping[normalizedValue];
          if (mappedValue) {
            const found = validGenders.find(g => g.toLowerCase() === mappedValue);
            if (found) {
              console.log(`[Upload] Mapping spécial: "${value}" → "${found}"`);
              return found;
            }
          }

          // Correspondance partielle
          const partialMatch = validGenders.find((g) => {
            const normalizedG = g.toLowerCase().trim();
            return (
              normalizedG.includes(normalizedValue) ||
              normalizedValue.includes(normalizedG)
            );
          });
          if (partialMatch) {
            console.log(`[Upload] Correspondance partielle trouvée: "${value}" → "${partialMatch}"`);
            return partialMatch;
          }

          console.warn(`[Upload] Aucune correspondance trouvée pour: "${value}"`);
          return null;
        };

        // Mapper chaque genre aux valeurs valides
        const mappedGenders = gender
          .map((g: string) => {
            const matched = findClosestGender(g);
            if (!matched) {
              console.warn(`[Upload] Genre invalide filtré: "${g}"`);
            } else {
              console.log(`[Upload] Genre mappé: "${g}" → "${matched}"`);
            }
            return matched;
          })
          .filter((g: string | null): g is string => g !== null);

        if (gender.length > 0 && mappedGenders.length === 0) {
          console.warn(
            `[Upload] Tous les genres ont été filtrés. Genres originaux: ${JSON.stringify(gender)}, Genres valides disponibles: ${JSON.stringify(validGenders)}`
          );
        }

        console.log(`[Upload] Genres avant mapping: ${JSON.stringify(gender)}, après mapping: ${JSON.stringify(mappedGenders)}`);
        gender = mappedGenders;
      } else {
        // Si pas de genres valides disponibles, vider le tableau
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
      // Récupérer tous les genres valides depuis Supabase
      const { data: allValidGenders } = await supabase
        .from('genders')
        .select('gender');
      
      const validGenderValues = allValidGenders
        ? allValidGenders.map((row: { gender: string }) => row.gender)
        : [];
      
      console.log('[Upload] Genres valides dans Supabase:', JSON.stringify(validGenderValues));
      console.log('[Upload] Genres à valider:', JSON.stringify(gender));
      
      // Vérifier manuellement chaque genre et ne garder que ceux qui existent
      const validatedGenders = gender.filter((g: string) => {
        const exists = validGenderValues.includes(g);
        if (!exists) {
          console.warn(`[Upload] Genre "${g}" n'existe pas dans la table genders. Genres valides: ${JSON.stringify(validGenderValues)}`);
        }
        return exists;
      });
      
      if (validatedGenders.length > 0) {
        // S'assurer que c'est bien un tableau JavaScript (pas une chaîne)
        insertData.gender = validatedGenders;
        console.log('[Upload] Genres validés à insérer:', JSON.stringify(insertData.gender));
        console.log('[Upload] Type de gender:', typeof insertData.gender, Array.isArray(insertData.gender));
      } else {
        console.warn('[Upload] Aucun genre valide après validation, le champ gender ne sera pas ajouté');
        // Ne pas ajouter le champ gender si aucun n'est valide
      }
    }
    if (description && description.trim() !== '') {
      insertData.description = description.trim();
    }
    insertData.featured = featured;

    // Log des données avant insertion pour déboguer
    console.log('[Upload] Données complètes à insérer:', JSON.stringify(insertData, null, 2));
    if (insertData.gender) {
      console.log('[Upload] Type de gender dans insertData:', typeof insertData.gender, Array.isArray(insertData.gender));
      console.log('[Upload] Contenu de gender:', insertData.gender);
      // Vérifier que chaque élément est une string
      insertData.gender.forEach((g: any, idx: number) => {
        console.log(`[Upload] gender[${idx}]:`, typeof g, g);
      });
    }

    // Insérer le produit dans products
    const { data: productData, error: insertError } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[Upload] Error inserting product:', insertError);
      console.error('[Upload] InsertData qui a causé l\'erreur:', JSON.stringify(insertData, null, 2));
      
      // Si l'erreur est liée à gender, essayer sans le champ gender
      if (insertError.code === '23503' && insertError.details?.includes('gender')) {
        console.warn('[Upload] Erreur FK sur gender, tentative sans le champ gender');
        const insertDataWithoutGender = { ...insertData };
        delete insertDataWithoutGender.gender;
        
        const { data: productDataRetry, error: insertErrorRetry } = await supabase
          .from('products')
          .insert(insertDataWithoutGender)
          .select()
          .single();
        
        if (insertErrorRetry) {
          return NextResponse.json(
            {
              error: `Erreur lors de l'insertion du produit: ${insertErrorRetry.message}. Le champ gender a été retiré mais l'erreur persiste.`,
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          product: productDataRetry,
          message: 'Produit uploadé avec succès (sans genre car contrainte FK invalide)',
          warning: 'Le champ gender n\'a pas pu être inséré en raison d\'une contrainte de clé étrangère. Veuillez vérifier la configuration de la table.',
        });
      }
      
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
