import { supabase, isSupabaseConfigured } from './supabase';
import type { Product } from './types';

/**
 * Transforme un produit Supabase vers le format Product
 * Gère les différentes structures de colonnes possibles
 */
function transformSupabaseToProduct(row: any): Product {
  // Gérer différents formats de noms de colonnes
  const productName = row['Product Name'] || row.product_name || row.name || '';
  const sku = row.SKU || row.sku || row.id?.toString() || '';
  const price = row.Price || row.price;
  const size = row.Size || row.size;
  const category = row.category;
  const stock = row.stock || row['Stock Levels'] || 1;
  const color = row.Color || row.color;
  const description = row.description || row.Description;
  const gender = Array.isArray(row.gender) 
    ? row.gender 
    : row.gender 
    ? [row.gender] 
    : [];
  
  // Gérer les images (peut être JSONB, array de strings/objets, ou string)
  // Supabase stocke souvent les images comme array de strings (URLs)
  // Airtable stocke comme array d'objets avec url, filename, etc.
  let images: any[] = [];
  if (row.Images) {
    if (Array.isArray(row.Images)) {
      // Si c'est un array de strings (Supabase), les garder tels quels
      // Si c'est un array d'objets (Airtable), les garder tels quels
      images = row.Images;
    } else if (typeof row.Images === 'string') {
      try {
        // Essayer de parser comme JSON
        const parsed = JSON.parse(row.Images);
        images = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Si ce n'est pas du JSON, c'est peut-être une URL simple
        images = [row.Images];
      }
    } else {
      images = [row.Images];
    }
  } else if (row.images) {
    if (Array.isArray(row.images)) {
      images = row.images;
    } else if (typeof row.images === 'string') {
      try {
        const parsed = JSON.parse(row.images);
        images = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        images = [row.images];
      }
    } else {
      images = [row.images];
    }
  }
  
  // Normaliser: garder les strings telles quelles pour Supabase
  // processProductImages gère les deux formats (strings et objets)
  // On garde les strings pour que isSupabaseProduct() puisse les détecter

  // Gérer User ID / owner
  let userId: string[] = [];
  if (row['User ID']) {
    userId = Array.isArray(row['User ID']) ? row['User ID'] : [row['User ID']];
  } else if (row.owner) {
    // Si owner est un ID numérique, le convertir en string
    userId = [String(row.owner)];
  }

  // Générer le slug si absent (utiliser SKU en priorité, sinon name, sinon id)
  const slug = row.slug || (sku ? slugify(String(sku)) : productName ? slugify(productName) : slugify(String(row.id || '')));

  return {
    id: row.id?.toString() || '',
    slug,
    SKU: sku,
    'Product Name': productName,
    Price: price,
    category,
    stock,
    color,
    Size: size,
    description,
    gender,
    Date: row.Date || row.date || row.created_at,
    'User ID': userId,
    Images: images,
  };
}

function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Récupère tous les produits depuis Supabase (nouveaux uniquement)
 * Retourne un tableau vide si Supabase n'est pas configuré
 */
export async function getAllProductsFromSupabase(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    console.log('[Supabase] Not configured, skipping Supabase products');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching products:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[Supabase] No products found');
      return [];
    }

    // Transformer les données Supabase vers le format Product
    const products = data.map(transformSupabaseToProduct);
    console.log(`[Supabase] Fetched ${products.length} products`);
    return products;
  } catch (error) {
    console.error('[Supabase] Failed to fetch products:', error);
    return [];
  }
}

/**
 * Récupère un produit par slug depuis Supabase
 */
export async function getProductBySlugFromSupabase(
  slug: string
): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('[Supabase] Error fetching product by slug:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return transformSupabaseToProduct(data);
  } catch (error) {
    console.error('[Supabase] Failed to fetch product by slug:', error);
    return null;
  }
}

