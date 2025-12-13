import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('colors')
      .select('color')
      .order('color', { ascending: true });

    if (error) {
      console.error('Error fetching colors:', error);
      return NextResponse.json(
        {
          colors: [],
          error: `Erreur lors de la récupération des couleurs: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      colors: data ? data.map((row: { color: string }) => row.color) : [],
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { colors: [], error: "Une erreur inattendue s'est produite" },
      { status: 500 }
    );
  }
}
