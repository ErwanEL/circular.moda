import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Note: Pour la production, ajoutez OPENAI_API_KEY dans .env.local

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

    // Construire le prompt pour GPT-4 Vision
    const systemPrompt = `Eres un asistente experto en análisis de productos de moda. Analiza las imágenes y la descripción proporcionada para extraer la siguiente información en formato JSON estricto. IMPORTANTE: Todo el texto debe estar en español argentino (ar-es):

{
  "name": "Nombre del producto en español argentino",
  "price": número o null (en pesos argentinos, sin puntos ni comas, ej: 50000),
  "size": "Talle" o null (ej: M, 42, S/M/L, 42/44),
  "color": "Color principal" o null,
  "category": "una de las siguientes categorías" o null: accessories, bikinis, blazers, blouses, body, casual_dresses, cover_ups, crop_tops, formal_dresses, hoodies, jackets, jeans, jumpsuits_rompers, lounge_sets, mini_dresses, shirts, shoes, shorts, skirts, sports_bras, sweaters, t_shirts, tank_tops, trousers, vests,
  "gender": ["men" o "women" o "unisex" o "man"] o [],
  "description": "Descripción corta, amigable y optimizada para SEO (máximo 160 caracteres, ideal para meta description)",
  "featured": false
}

Reglas importantes:
- El nombre y la descripción DEBEN estar en español argentino (ar-es)
- La descripción debe ser:
  * Corta (máximo 160 caracteres)
  * Amigable y atractiva para el usuario
  * Optimizada para SEO (incluir palabras clave relevantes, llamativa)
  * Ideal para usar como meta description de la página
  * Ejemplo: "Jeans Zara hombre talle 42/44 anchos. Moda circular y sostenible en Buenos Aires."
- Si el precio no está mencionado en la descripción, usa null
- Si el talle no es visible en las imágenes o mencionado, usa null
- Analiza cuidadosamente las imágenes para determinar el color y la categoría
- Para el género: "men" o "man" para hombre, "women" para mujer, "unisex" para mixto
- La categoría debe ser EXACTAMENTE una de las opciones listadas (en minúsculas con guiones bajos)
- Retorna ÚNICAMENTE el JSON válido, sin markdown, sin texto antes o después`;

    const userPrompt = `Descripción proporcionada: "${textDescription}"

Analiza las imágenes y la descripción para extraer toda la información del producto. Recuerda que el nombre y la descripción deben estar en español argentino (ar-es), y la descripción debe ser corta, amigable y optimizada para SEO (máximo 160 caracteres).`;

    // Appeler OpenAI GPT-4 Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Utiliser gpt-4o-mini comme demandé
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
