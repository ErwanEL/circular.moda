import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET: Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, phone')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: `Erreur lors de la récupération des utilisateurs: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    );
  }
}

// POST: Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/admin/users - Début');
    const body = await request.json();
    console.log('[API] Body reçu:', body);
    const { name, phone } = body;

    if (!name || name.trim() === '') {
      console.log('[API] Erreur: nom manquant');
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      );
    }

    if (!phone || phone.trim() === '') {
      console.log('[API] Erreur: téléphone manquant');
      return NextResponse.json(
        { error: 'Le numéro de téléphone est requis' },
        { status: 400 }
      );
    }

    console.log('[API] Validation OK, vérification des doublons...');

    // Vérifier si un utilisateur avec ce téléphone existe déjà
    console.log('[API] Recherche utilisateur existant avec téléphone:', phone.trim());
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, name, phone')
      .eq('phone', phone.trim());

    // Si erreur autre que "pas de résultats", logger
    if (checkError) {
      console.error('[API] Erreur lors de la vérification:', checkError);
      // Continuer quand même si c'est juste "pas de résultats"
      if (checkError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: `Erreur lors de la vérification: ${checkError.message}` },
          { status: 500 }
        );
      }
    }

    console.log('[API] Utilisateurs existants trouvés:', existingUsers?.length || 0);

    // Si un utilisateur existe déjà avec ce téléphone
    if (existingUsers && existingUsers.length > 0) {
      console.log('[API] Utilisateur existant trouvé:', existingUsers[0]);
      return NextResponse.json({
        user: existingUsers[0],
        message: 'Un utilisateur avec ce numéro existe déjà',
      });
    }

    // Créer le nouvel utilisateur (created_at sera géré automatiquement par Supabase)
    console.log('[API] Création du nouvel utilisateur:', { name: name.trim(), phone: phone.trim() });
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        phone: phone.trim(),
      })
      .select('id, name, phone')
      .single();

    if (insertError) {
      console.error('[API] Erreur lors de la création:', insertError);
      console.error('[API] Détails de l\'erreur:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { error: `Erreur lors de la création de l'utilisateur: ${insertError.message}`, details: insertError },
        { status: 500 }
      );
    }

    console.log('[API] Utilisateur créé avec succès:', newUser);
    return NextResponse.json({
      user: newUser,
      message: 'Utilisateur créé avec succès',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    );
  }
}

