// src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAllProducts, getProductBySlug } from '../../lib/products';
import { getSuggestedProducts } from '../../lib/helpers';
import { getUsersByIds, getUsersByIdsFromSupabase } from '../../lib/users';
import ProductDetail from '../../ui/product-detail';

/** Fully static – no ISR */
export const revalidate = false;

/** Build-time generation of every slug */
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p: { slug: string }) => ({ slug: p.slug }));
}

/** Dynamic metadata generation for each product */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Producto no encontrado | circular.moda',
      description: 'El producto que buscas no está disponible.',
    };
  }

  const productName = product['Product Name'] || 'Producto';
  const title = `${productName} | circular.moda`;
  const productDescription =
    (product.description ?? product['Description'])?.trim();
  const description =
    productDescription ||
    `Descubre ${productName} en circular.moda. Moda circular y sostenible.`;

  // Get the first image if available
  const firstImage = product.Images && product.Images.length > 0 ? product.Images[0] : null;
  const imageUrl = firstImage
    ? typeof firstImage === 'string'
      ? firstImage
      : firstImage.url
    : '/roommates-fashion-fun_simple_compose.png'; // fallback image

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: productName,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

/**
 * In Next 15, `params` is delivered **as a Promise**.
 * Await it before accessing any field to avoid the “sync-dynamic-apis” error.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ await first

  const product = await getProductBySlug(slug);
  if (!product) notFound(); // built-in 404

  // Fetch user data - try Supabase first, fallback to Airtable
  let user = null;
  if (product['User ID']) {
    const userIds = Array.isArray(product['User ID'])
      ? product['User ID']
      : [product['User ID']];
    console.log('[ProductPage] Fetching user data for IDs:', userIds);
    
    try {
      // Try Supabase first (for numeric IDs or Supabase products)
      // Check if any ID looks like a Supabase ID (numeric) vs Airtable ID (starts with 'rec')
      const hasSupabaseIds = userIds.some(id => {
        if (typeof id === 'string') {
          // If it's numeric or can be parsed as number, it's likely Supabase
          return !id.startsWith('rec') && !isNaN(parseInt(id, 10));
        }
        return typeof id === 'number';
      });

      if (hasSupabaseIds) {
        console.log('[ProductPage] Using Supabase to fetch users');
        const users = await getUsersByIdsFromSupabase(userIds);
        user = users.length > 0 ? users[0] : null;
      } else {
        // Fallback to Airtable for Airtable IDs
        console.log('[ProductPage] Using Airtable to fetch users');
        const users = await getUsersByIds(userIds);
        user = users.length > 0 ? users[0] : null;
      }

      if (user) {
        console.log('[ProductPage] Successfully fetched user:', user.id);
      } else {
        console.log('[ProductPage] No user data available (not found)');
      }
    } catch (error) {
      // Don't block page rendering if user fetch fails
      console.warn('[ProductPage] Failed to fetch user data, continuing without it:', error);
      user = null;
    }
  } else {
    console.log('[ProductPage] No User ID found for product:', product.id);
  }

  // Get suggested products
  const allProducts = await getAllProducts();
  const suggestedProducts = product.id
    ? getSuggestedProducts(allProducts, product.id, 6)
    : [];

  return (
    <ProductDetail
      product={product}
      user={user}
      suggestedProducts={suggestedProducts}
    />
  );
}
