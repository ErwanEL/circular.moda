// src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAllProducts, getProductBySlug } from '../../lib/products';
import { getSuggestedProducts } from '../../lib/helpers';
import { getUsersByIds, getUsersByIdsFromSupabase } from '../../lib/users';
import type { User } from '../../lib/types';
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
  const productDescription = (
    product.description ?? product['Description']
  )?.trim();
  const description =
    productDescription ||
    `Descubre ${productName} en circular.moda. Moda circular y sostenible.`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://circular.moda';
  const canonicalUrl = `${baseUrl}/products/${slug}`;

  // Use our OG image proxy so WhatsApp/Facebook crawlers hit our domain instead of Supabase
  // (avoids Supabase timeout; we stream the image from our API)
  const ogImageUrl = `/api/og?slug=${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: productName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
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
  // Make this non-blocking: if user fetch fails, page still renders without user info
  let user = null;

  // Safely extract and validate User ID
  const rawUserIds = product['User ID'];
  if (rawUserIds) {
    // Handle various formats: array, string, or empty/null values
    let userIds: (string | number)[] = [];

    if (Array.isArray(rawUserIds)) {
      userIds = rawUserIds.filter(
        (id) =>
          id !== null &&
          id !== undefined &&
          String(id).trim() !== '' &&
          String(id) !== 'null' &&
          String(id) !== 'undefined'
      );
    } else if (
      typeof rawUserIds === 'string' ||
      typeof rawUserIds === 'number'
    ) {
      const idStr = String(rawUserIds).trim();
      if (idStr && idStr !== 'null' && idStr !== 'undefined') {
        userIds = [rawUserIds];
      }
    }

    // Only attempt fetch if we have valid user IDs
    if (userIds.length > 0) {
      try {
        // Try Supabase first (for numeric IDs or Supabase products)
        // Check if any ID looks like a Supabase ID (numeric) vs Airtable ID (starts with 'rec')
        const hasSupabaseIds = userIds.some((id) => {
          if (typeof id === 'string') {
            // If it's numeric or can be parsed as number, it's likely Supabase
            return !id.startsWith('rec') && !isNaN(parseInt(id, 10));
          }
          return typeof id === 'number';
        });

        if (hasSupabaseIds) {
          const users = await getUsersByIdsFromSupabase(userIds);
          user = users.length > 0 ? users[0] : null;
        } else {
          // Fallback to Airtable for Airtable IDs
          // Add timeout protection: don't wait too long during build
          const users = await Promise.race([
            getUsersByIds(userIds as string[]),
            new Promise<User[]>(
              (resolve) => setTimeout(() => resolve([]), 5000) // 5 second timeout
            ),
          ]);
          user = users.length > 0 ? users[0] : null;
        }
      } catch (error) {
        // Don't block page rendering if user fetch fails
        // Silently continue - user info is optional
        user = null;
      }
    }
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
