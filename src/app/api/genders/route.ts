import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('genders')
      .select('gender')
      .order('gender', { ascending: true });

    if (error) {
      console.error('Error fetching genders:', error);
      return NextResponse.json(
        {
          genders: [],
          error: `Erreur lors de la récupération des genres: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      genders: data ? data.map((row: { gender: string }) => row.gender) : [],
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { genders: [], error: "Une erreur inattendue s'est produite" },
      { status: 500 }
    );
  }
}
