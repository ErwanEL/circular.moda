import { isSupabaseConfigured, supabase } from './supabase';

export type InstagramBioProduct = {
  id: number;
  productId: number | null;
  productName: string;
  productUrl: string | null;
  imageUrl: string | null;
  instagramPermalink: string | null;
  publishedAt: string | null;
};

type InstagramProductPostRow = {
  id: number;
  product_id: number | null;
  product_name: string | null;
  product_url: string | null;
  image_url: string | null;
  source_image_url: string | null;
  instagram_permalink: string | null;
  published_at: string | null;
  created_at: string | null;
};

export async function getInstagramBioProducts(
  limit: number = 30
): Promise<InstagramBioProduct[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(limit, 60));

  try {
    const { data, error } = await supabase
      .from('instagram_product_posts')
      .select(
        [
          'id',
          'product_id',
          'product_name',
          'product_url',
          'image_url',
          'source_image_url',
          'instagram_permalink',
          'published_at',
          'created_at',
        ].join(',')
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error('[Supabase] Error fetching Instagram bio products:', error);
      return [];
    }

    const rows = (data ?? []) as unknown as InstagramProductPostRow[];

    return rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name || 'Producto Circular Moda',
      productUrl: row.product_url,
      imageUrl: row.source_image_url || row.image_url,
      instagramPermalink: row.instagram_permalink,
      publishedAt: row.published_at || row.created_at,
    }));
  } catch (error) {
    console.error('[Supabase] Failed to fetch Instagram bio products:', error);
    return [];
  }
}
