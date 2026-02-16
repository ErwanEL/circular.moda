import { createClient } from '@/app/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, phone, user_id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 });
    }

    let products = [];
    if (userData) {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('owner', userData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        products = productsData || [];
      }
    }

    return NextResponse.json({
      user: userData || null,
      products: products,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, user_id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Error checking existing user' },
        { status: 500 }
      );
    }

    let resultUser;

    if (existingUser) {
      // Update
      const { data, error } = await supabase
        .from('users')
        .update({ name, phone })
        .eq('id', existingUser.id)
        .select('id, name, phone')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      resultUser = data;
    } else {
      // Create
      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          phone,
          user_id: authUser.id,
        })
        .select('id, name, phone')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      resultUser = data;
    }

    return NextResponse.json({ user: resultUser });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
