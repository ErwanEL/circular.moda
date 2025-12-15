import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('category')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        {
          categories: [],
          error: `Erreur lors de la récupération des catégories: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories: data
        ? data.map((row: { category: string }) => row.category)
        : [],
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { categories: [], error: "Une erreur inattendue s'est produite" },
      { status: 500 }
    );
  }
}
