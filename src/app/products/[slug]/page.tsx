// src/app/products/[slug]/page.tsx
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getAllProducts, getProductBySlug } from '../../lib/airtable';

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
     MUST await params before using it (Next 14 “sync-dynamic-apis” rule)
  ------------------------------------------------------------- */
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound(); // built-in 404 page
  }

  return (
    <article className="max-w-3xl mx-auto p-6">
      {product.Images?.[0]?.url && (
        <Image
          src={product.Images[0].url}
          alt={product.SKU}
          width={800}
          height={600}
          className="rounded mb-6"
        />
      )}

      <h1 className="text-3xl font-bold mb-2">{product.SKU}</h1>

      {product.Price !== undefined && (
        <p className="text-xl mb-4">${product.Price}</p>
      )}

      <ul className="text-sm space-y-1">
        {product.Category && (
          <li>
            <strong>Category:</strong> {product.Category}
          </li>
        )}
        {product.Color && (
          <li>
            <strong>Color:</strong> {product.Color}
          </li>
        )}
        {product.Size && (
          <li>
            <strong>Size:</strong> {product.Size}
          </li>
        )}
        {product.StockLevels !== undefined && (
          <li>
            <strong>Stock:</strong> {product.StockLevels}
          </li>
        )}
      </ul>
    </article>
  );
}
