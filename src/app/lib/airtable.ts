// DEPRECATED: Use src/app/lib/products.ts instead for static product data.
import Airtable from 'airtable';

const base = new Airtable({
  // Personal-access token – the SDK still calls it "apiKey"
  apiKey: process.env.AIRTABLE_TOKEN,
}).base(process.env.AIRTABLE_BASE_ID!);

export interface Product {
  id: string; // Airtable record ID
  SKU: string;
  Price?: number;
  Category?: string;
  StockLevels?: number;
  Color?: string;
  Size?: string;
  UserID?: string | string[]; // adjust if you dereference links
  Images?: { url: string }[];
  slug: string;
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const recs = await base(process.env.AIRTABLE_TABLE_NAME!)
      .select({ view: 'Grid view' }) // or any filtered view
      .all();

    return recs.map((r) => ({
      id: r.id,
      // raw fields
      ...r.fields,
      // derive slug from the primary SKU field
      slug: slugify(r.get('SKU') as string),
    })) as Product[];
  } catch (err) {
    console.error('Airtable getAllProducts error:', err);
    throw err;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const [rec] = await base(process.env.AIRTABLE_TABLE_NAME!)
      .select({
        maxRecords: 1,
        filterByFormula: `LOWER({SKU}) = '${unslugify(slug)}'`,
      })
      .all();

    return rec
      ? ({
          id: rec.id,
          ...rec.fields,
          slug,
        } as Product)
      : null;
  } catch (err) {
    console.error('Airtable getProductBySlug error:', err);
    throw err;
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// reverse operation used in filterByFormula
function unslugify(slug: string) {
  return slug.replace(/-/g, '');
}
