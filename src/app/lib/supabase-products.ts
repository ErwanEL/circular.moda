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

  // Générer le slug au format: {name-slugified}-{public_id}
  // Exemple: "vestido-lino-verde-f1f881a3-a813-4633-951a-70cc2bdf559f"
  let slug: string;
  if (row.public_id && productName) {
    // Combiner le nom slugifié avec le public_id
    const nameSlug = slugify(productName);
    slug = `${nameSlug}-${row.public_id}`;
  } else if (row.public_id) {
    // Si pas de nom, utiliser juste le public_id
    slug = row.public_id;
  } else if (row.slug) {
    // Fallback vers slug existant
    slug = row.slug;
  } else {
    // Dernier fallback: générer depuis SKU ou name
    slug = sku
      ? slugify(String(sku))
      : productName
        ? slugify(productName)
        : slugify(String(row.id || ''));
  }

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

/** Cursor for pagination: (created_at, id) of the last item of the previous page */
export type ProductsPageCursor = { created_at: string; id: string };

/**
 * Récupère une page de produits depuis Supabase (cursor-based pagination).
 * Retourne { products, nextCursor }; nextCursor est non null s'il reste des pages.
 */
export async function getProductsPageFromSupabase(
  limit: number,
  cursor?: ProductsPageCursor
): Promise<{ products: Product[]; nextCursor: ProductsPageCursor | null }> {
  if (!isSupabaseConfigured()) {
    return { products: [], nextCursor: null };
  }

  const pageSize = Math.max(1, Math.min(limit, 50));
  const take = pageSize + 1; // fetch one extra to detect hasNext

  try {
    let query = supabase.from('products').select('*');

    if (cursor) {
      // Rows "before" cursor: created_at < cursor.created_at OR (created_at = cursor.created_at AND id < cursor.id)
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(take);

    if (error) {
      console.error('[Supabase] Error fetching products page:', error);
      return { products: [], nextCursor: null };
    }

    if (!data || data.length === 0) {
      return { products: [], nextCursor: null };
    }

    const hasMore = data.length > pageSize;
    const rows = hasMore ? data.slice(0, pageSize) : data;
    const products = rows.map(transformSupabaseToProduct);

    let nextCursor: ProductsPageCursor | null = null;
    if (hasMore && data[pageSize]) {
      const last = data[pageSize] as { created_at: string; id: string };
      nextCursor = {
        created_at: String(last.created_at),
        id: String(last.id),
      };
    }

    return { products, nextCursor };
  } catch (error) {
    console.error('[Supabase] Failed to fetch products page:', error);
    return { products: [], nextCursor: null };
  }
}

/**
 * Récupère tous les produits depuis Supabase (nouveaux uniquement)
 * Retourne un tableau vide si Supabase n'est pas configuré
 */
export async function getAllProductsFromSupabase(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
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
      return [];
    }

    // Transformer les données Supabase vers le format Product
    const products = data.map(transformSupabaseToProduct);
    return products;
  } catch (error) {
    console.error('[Supabase] Failed to fetch products:', error);
    return [];
  }
}

/**
 * Extrait le public_id d'un slug au format: {name-slugified}-{public_id}
 * Exemple: "vestido-lino-verde-f1f881a3-a813-4633-951a-70cc2bdf559f" -> "f1f881a3-a813-4633-951a-70cc2bdf559f"
 */
function extractPublicIdFromSlug(slug: string): string | null {
  // UUID format: 8-4-4-4-12 (avec tirets)
  // Chercher le dernier segment qui correspond à un UUID
  const uuidPattern =
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
  const match = slug.match(uuidPattern);
  return match ? match[1] : null;
}

/**
 * Récupère un produit par slug depuis Supabase
 * Le slug peut être au format: {name-slugified}-{public_id} ou juste {public_id}
 */
export async function getProductBySlugFromSupabase(
  slug: string
): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // Extraire le public_id du slug (format: name-public_id)
    const publicId = extractPublicIdFromSlug(slug);

    // Chercher par public_id en priorité (si on peut l'extraire)
    let { data, error } = publicId
      ? await supabase
          .from('products')
          .select('*')
          .eq('public_id', publicId)
          .maybeSingle()
      : { data: null, error: { code: 'NO_PUBLIC_ID' } as { code: string } };

    // Si la colonne public_id n'existe pas ou pas de résultat, essayer par slug direct
    if ((error && error.code === '42703') || !data) {
      const { data: dataBySlug, error: errorBySlug } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!errorBySlug && dataBySlug) {
        data = dataBySlug;
        error = null;
      }
    }

    // Pas de fallback full-table: si pas trouvé par public_id ou slug, retourner null
    if (!data) {
      return null;
    }

    // Si autre erreur
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      // Ne pas logger les erreurs de colonne inexistante (déjà géré)
      if (error.code !== '42703' && error.code !== 'NO_PUBLIC_ID') {
        console.error('[Supabase] Error fetching product by slug:', error);
      }
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
