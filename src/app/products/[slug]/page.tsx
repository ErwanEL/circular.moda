// src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getAllProducts, getProductBySlug } from '../../lib/airtable';
import ProductDetail from '../../ui/product-detail';

export const revalidate = 60; // ISR – rebuild every 60 s

/** Pre-generate the static paths at build time */
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage(
  { params }: { params: Promise<{ slug: string }> } // ⬅ params is a Promise
) {
  /* ------------------------------------------------------------
     MUST await params before using it (Next 14 "sync-dynamic-apis" rule)
  ------------------------------------------------------------- */
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound(); // built-in 404 page
  }

  return <ProductDetail product={product} />;
}
