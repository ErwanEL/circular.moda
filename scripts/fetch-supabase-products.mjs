#!/usr/bin/env node

/**
 * Fetches all current Supabase products into the local products cache.
 *
 * Usage:
 *   npm run fetch:products
 *   node scripts/fetch-supabase-products.mjs
 *
 * Requirements (.env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';

dotenv.config({ path: '.env.local' });

const PRODUCTS_PAGE_SIZE = 1000;
const OUTPUT_PATH = path.join('data', '.products-cache.json');

function requireEnv(name, fallbackName) {
  const value =
    process.env[name]?.trim() ||
    (fallbackName ? process.env[fallbackName]?.trim() : '');

  if (!value) {
    const label = fallbackName ? `${name} (or ${fallbackName})` : name;
    throw new Error(`${label} is required. Add it to .env.local.`);
  }

  return value;
}

function toTrimmedString(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function slugifyProductText(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildProductSlug(row) {
  const productName =
    toTrimmedString(row['Product Name']) ??
    toTrimmedString(row.product_name) ??
    toTrimmedString(row.name);
  const publicId = toTrimmedString(row.public_id);
  const explicitSlug = toTrimmedString(row.slug);
  const sku = toTrimmedString(row.SKU) ?? toTrimmedString(row.sku);

  if (publicId && productName) {
    return `${slugifyProductText(productName)}-${publicId}`;
  }

  if (publicId) return publicId;
  if (explicitSlug) return explicitSlug;

  if (sku) {
    const slug = slugifyProductText(sku);
    return slug === '' ? null : slug;
  }

  if (productName) {
    const slug = slugifyProductText(productName);
    return slug === '' ? null : slug;
  }

  const id = toTrimmedString(row.id);
  if (!id) return null;

  const slug = slugifyProductText(id);
  return slug === '' ? null : slug;
}

function normalizeImages(row) {
  const source = row.Images ?? row.images;

  if (!source) return [];
  if (Array.isArray(source)) return source;

  if (typeof source === 'string') {
    try {
      const parsed = JSON.parse(source);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [source];
    }
  }

  return [source];
}

function transformSupabaseToProduct(row) {
  const productName = row['Product Name'] || row.product_name || row.name || '';
  const sku = row.SKU || row.sku || row.id?.toString() || '';
  const gender = Array.isArray(row.gender)
    ? row.gender
    : row.gender
      ? [row.gender]
      : [];

  let userId = [];
  if (row['User ID']) {
    userId = Array.isArray(row['User ID']) ? row['User ID'] : [row['User ID']];
  } else if (row.owner) {
    userId = [String(row.owner)];
  }

  return {
    id: row.id?.toString() || '',
    slug: buildProductSlug(row) ?? '',
    SKU: sku,
    'Product Name': productName,
    Price: row.Price || row.price,
    category: row.category,
    stock: row.stock || row['Stock Levels'] || 1,
    color: row.Color || row.color,
    Size: row.Size || row.size,
    description: row.description || row.Description,
    gender,
    'User ID': userId,
    Images: normalizeImages(row),
    featured: row.featured === true,
  };
}

async function fetchAllProducts(supabase) {
  const products = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PRODUCTS_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    const batch = data ?? [];
    products.push(...batch);

    if (batch.length < PRODUCTS_PAGE_SIZE) break;
    from += PRODUCTS_PAGE_SIZE;
  }

  return products;
}

async function main() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = requireEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  console.log('Fetching products from Supabase...');

  const rows = await fetchAllProducts(supabase);
  const products = rows.map(transformSupabaseToProduct);
  const payload = {
    data: products,
    timestamp: Date.now(),
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

  const latest = products[0];
  console.log(`Wrote ${products.length} product(s) to ${OUTPUT_PATH}`);
  if (latest) {
    console.log(`Latest: ${latest.id} - ${latest['Product Name']}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
