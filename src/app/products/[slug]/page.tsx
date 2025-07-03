import Image from 'next/image';
import { getAllProducts, getProductBySlug } from '../../lib/airtable';

// Same ISR interval for the product pages
export const revalidate = 60;

/**
 * Pre-build all slugs at build time.
 * Next.js will still handle new ones on-demand if you later add products.
 */
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const product = await getProductBySlug(params.slug);

    if (!product) {
      // Optionally: throw new Error('Not found') to show the 404 page
      return <h1 className="p-6 text-xl">Product not found</h1>;
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
  } catch (err: any) {
    return (
      <div className="p-6 text-red-600">
        <h1>Error loading product</h1>
        <pre>{err?.message || String(err)}</pre>
      </div>
    );
  }
}
