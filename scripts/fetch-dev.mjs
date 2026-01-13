#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import Airtable from 'airtable';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔄 Fetching products from Airtable for development...');

// Check if Airtable is enabled
if (process.env.ENABLE_AIRTABLE_IN_DEV !== 'true') {
  console.log(
    '⚠️  Airtable fetching is disabled. Set ENABLE_AIRTABLE_IN_DEV=true in .env.local'
  );
  process.exit(0);
}

// Validate required environment variables
const requiredVars = [
  'AIRTABLE_TOKEN',
  'AIRTABLE_BASE_ID',
  'AIRTABLE_TABLE_NAME',
];
const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing.join(', '));
  console.error('Please check your .env.local file');
  process.exit(1);
}

const dataDir = path.join(process.cwd(), 'data');
const productsFile = path.join(dataDir, 'products.json');

async function fetchProducts() {
  try {
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

    // Write to products.json
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(productsFile, JSON.stringify(products, null, 2));

    console.log(`✅ Fetched ${products.length} products from Airtable`);
    console.log('📁 Data saved to data/products.json');
  } catch (error) {
    console.error('❌ Error fetching from Airtable:', error.message);
    process.exit(1);
  }
}

function slugify(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

fetchProducts();
