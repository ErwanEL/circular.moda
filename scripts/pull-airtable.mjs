import fs from 'node:fs/promises';
import path from 'node:path';
import Airtable from 'airtable';

if (!process.env.FETCH_AIRTABLE_AT_BUILD) {
  console.log('▶︎ Skip Airtable pull – not a production build');
  process.exit(0);
}
if (!process.env.AIRTABLE_TOKEN) {
  console.error('AIRTABLE_TOKEN missing – aborting.');
  process.exit(1);
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base(
  process.env.AIRTABLE_BASE_ID
);

const records = await base(process.env.AIRTABLE_TABLE_NAME)
  .select({ view: 'Grid view' })
  .all();

const products = records.map((r) => ({
  id: r.id,
  slug: slugify(String(r.get('SKU') ?? '')),
  ...r.fields,
}));

await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
await fs.writeFile(
  path.join(process.cwd(), 'data/products.json'),
  JSON.stringify(products, null, 2)
);

console.log(`✔ Pulled ${products.length} products`);

function slugify(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
