// src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getAllProducts, getProductBySlug } from '../../lib/products';
import ProductDetail from '../../ui/product-detail';

/** Fully static – no ISR */
export const revalidate = false;

/** Build-time generation of every slug */
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p: { slug: string }) => ({ slug: p.slug }));
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

  return <ProductDetail product={product} />;
}
