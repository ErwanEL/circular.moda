import Image from 'next/image';
import Link from 'next/link';
import { getAllProducts } from '../lib/airtable';

// Incremental Static Regeneration, rebuild every 60 s
export const revalidate = 60;

export default async function ProductsPage() {
  try {
    const products = await getAllProducts(); // runs at build time, then every 60 s

    return (
      <main className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 p-6">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="border rounded p-4 group"
          >
            {p.Images?.[0]?.url && (
              <Image
                src={p.Images[0].url}
                alt={p.SKU}
                width={400}
                height={300}
                className="rounded mb-3"
              />
            )}

            <h2 className="font-semibold text-lg group-hover:underline">
              {p.SKU}
            </h2>

            {p.Price !== undefined && (
              <p className="text-sm text-gray-600">${p.Price}</p>
            )}

            {p.Category && (
              <p className="text-xs text-gray-500 mt-1">{p.Category}</p>
            )}
          </Link>
        ))}
      </main>
    );
  } catch (err: any) {
    return (
      <div className="p-6 text-red-600">
        <h1>Error loading products</h1>
        <pre>{err?.message || String(err)}</pre>
      </div>
    );
  }
}
