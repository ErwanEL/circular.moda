import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Note: Pour la production, ajoutez OPENAI_API_KEY dans .env.local

// Fonction helper pour récupérer les valeurs depuis Supabase
async function fetchValidValues() {
  const [categoriesRes, colorsRes, gendersRes] = await Promise.all([
    supabase
      .from('categories')
      .select('category')
      .order('category', { ascending: true }),
    supabase.from('colors').select('color').order('color', { ascending: true }),
    supabase
      .from('genders')
      .select('gender')
      .order('gender', { ascending: true }),
  ]);

  const categories = categoriesRes.data
    ? categoriesRes.data.map((row: { category: string }) => row.category)
    : [];
  const colors = colorsRes.data
    ? colorsRes.data.map((row: { color: string }) => row.color)
    : [];
  const genders = gendersRes.data
    ? gendersRes.data.map((row: { gender: string }) => row.gender)
    : [];

  return { categories, colors, genders };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const textDescription = formData.get('textDescription') as string;
    const imageFiles = formData.getAll('images') as File[];

    if (!textDescription || textDescription.trim() === '') {
      return NextResponse.json(
        { error: 'La description textuelle est requise' },
        { status: 400 }
      );
    }

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'Au moins une image est requise' },
        { status: 400 }
      );
    }

    // Récupérer les valeurs valides depuis Supabase
    const { categories, colors, genders } = await fetchValidValues();

    // Convertir les images en base64 pour l'API OpenAI Vision
    const imagePromises = imageFiles.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return {
        type: 'image_url' as const,
        image_url: {
          url: `data:${file.type};base64,${base64}`,
        },
      };
    });

    const imageContents = await Promise.all(imagePromises);

    // Construire le prompt avec les valeurs dynamiques depuis Supabase
    const categoriesList =
      categories.length > 0
        ? categories.join(', ')
        : 'aucune catégorie disponible';
    const colorsList =
      colors.length > 0 ? colors.join(', ') : 'aucune couleur disponible';
    const gendersList =
      genders.length > 0 ? genders.join(', ') : 'aucun genre disponible';

    const systemPrompt = `Eres un asistente experto en análisis de productos de moda. Analiza las imágenes y la descripción proporcionada para extraer la siguiente información en formato JSON estricto. IMPORTANTE: Todo el texto debe estar en español argentino (ar-es):

{
  "name": "Nombre del producto en español argentino",
  "price": número o null (en pesos argentinos, sin puntos ni comas, ej: 50000),
  "size": "Talle" o null (ej: M, 42, S/M/L, 42/44),
  "color": "Color principal" o null (DEBE ser EXACTAMENTE una de estas opciones: ${colorsList}),
  "category": "Categoría" o null (DEBE ser EXACTAMENTE una de estas opciones: ${categoriesList}),
  "gender": ["Género"] o [] (DEBE ser uno o varios de estos valores EXACTOS: ${gendersList}),
  "description": "Solo describir el producto usando ÚNICAMENTE los datos del texto e imágenes proporcionados. Máximo 155 caracteres. Sin frase de cierre.",
  "featured": false
}

Reglas CRÍTICAS:
- El nombre y la descripción DEBEN estar en español argentino (ar-es)
- La descripción: SOLO el producto, usando ÚNICAMENTE la información del texto e imágenes de entrada. Máximo 155 caracteres. Sin frase de cierre, sin añadir nada que no esté en el input.
- Si el precio no está mencionado en la descripción, usa null
- Si el talle no es visible en las imágenes o mencionado, usa null
- Analiza cuidadosamente las imágenes para determinar el color y la categoría
- COLOR: DEBE ser EXACTAMENTE une de estas opciones (respeta mayúsculas/minúsculas): ${colorsList}
- CATEGORÍA: DEBE ser EXACTAMENTE une de estas opciones (respeta mayúsculas/minúsculas): ${categoriesList}
- GÉNERO: DEBE ser uno o varios de estos valores EXACTOS (respeta mayúsculas/minúsculas): ${gendersList}
- Si no puedes determinar con certeza el color/categoría/género, usa null en lugar de inventar un valor
- Retorna ÚNICAMENTE el JSON válido, sin markdown, sin texto antes o después`;

    const userPrompt = `Descripción proporcionada: "${textDescription}"

Analiza las imágenes y la descripción para extraer toda la información del producto. Para el campo description: solo describir el producto con los datos del input (texto e imágenes), máximo 155 caracteres, en español argentino. Nada más: sin frase de cierre ni texto añadido.`;

    // Appeler OpenAI GPT-4o mini (Vision)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [{ type: 'text', text: userPrompt }, ...imageContents],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Extraire le JSON de la réponse
    let productData;
    try {
      // Chercher le JSON dans la réponse (peut être entouré de markdown)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        productData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', responseContent);
      return NextResponse.json(
        { error: "Erreur lors de l'analyse AI. Réponse invalide." },
        { status: 500 }
      );
    }

    // Valider et nettoyer les données
    const cleanedData = {
      name: productData.name || '',
      price:
        productData.price !== null && productData.price !== undefined
          ? String(productData.price)
          : '',
      size: productData.size || '',
      color: productData.color || '',
      category: productData.category || '',
      gender: Array.isArray(productData.gender) ? productData.gender : [],
      description: productData.description || '',
      featured: Boolean(productData.featured),
    };

    return NextResponse.json({
      success: true,
      data: cleanedData,
    });
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'analyse AI",
      },
      { status: 500 }
    );
  }
}
