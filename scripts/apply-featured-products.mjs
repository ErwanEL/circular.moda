#!/usr/bin/env node

/**
 * Previews or applies a featured-products batch in Supabase.
 *
 * Usage:
 *   npm run featured:apply -- --skus=SKU-001344,SKU-001337
 *   npm run featured:apply -- --apply --skus=SKU-001344,SKU-001337
 *
 * Requirements (.env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function printUsage() {
  console.log(`Apply a featured-products batch.

Usage:
  npm run featured:apply -- --skus=SKU-001344,SKU-001337
  npm run featured:apply -- --apply --skus=SKU-001344,SKU-001337

Options:
  --skus=<list>  Comma-separated SKUs to feature
  --apply        Write changes to Supabase; without this, only previews
  --help, -h     Show this help text
`);
}

function parseArgs(argv) {
  const parsed = { apply: false, skus: [] };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg === '--apply') {
      parsed.apply = true;
    } else if (arg.startsWith('--skus=')) {
      parsed.skus = arg
        .slice('--skus='.length)
        .split(',')
        .map((sku) => sku.trim())
        .filter(Boolean);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (parsed.skus.length === 0) {
    throw new Error('--skus is required.');
  }

  return parsed;
}

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

function sortBySkuOrder(rows, skus) {
  const order = new Map(skus.map((sku, index) => [sku, index]));
  return [...rows].sort(
    (left, right) => (order.get(left.sku) ?? 0) - (order.get(right.sku) ?? 0)
  );
}

async function fetchRowsBySku(supabase, skus) {
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, name, featured')
    .in('sku', skus);

  if (error) {
    throw new Error(`Failed to fetch selected products: ${error.message}`);
  }

  const rows = data ?? [];
  const found = new Set(rows.map((row) => row.sku));
  const missing = skus.filter((sku) => !found.has(sku));
  if (missing.length > 0) {
    throw new Error(`Missing SKU(s) in Supabase: ${missing.join(', ')}`);
  }

  return sortBySkuOrder(rows, skus);
}

async function fetchCurrentFeatured(supabase) {
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, name, featured')
    .eq('featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch current featured products: ${error.message}`);
  }

  return data ?? [];
}

async function main() {
  const { apply, skus } = parseArgs(process.argv.slice(2));
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = requireEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const currentFeatured = await fetchCurrentFeatured(supabase);
  const selectedRows = await fetchRowsBySku(supabase, skus);

  console.log(`Current featured: ${currentFeatured.length}`);
  console.log(`Selected batch: ${selectedRows.length}`);
  selectedRows.forEach((row, index) => {
    console.log(
      `${String(index + 1).padStart(2, '0')}. ${row.sku} | ${row.name} | featured=${row.featured}`
    );
  });

  if (!apply) {
    console.log('\nDry run only. Add --apply to write changes.');
    return;
  }

  const { data: clearedRows, error: clearError } = await supabase
    .from('products')
    .update({ featured: false })
    .eq('featured', true)
    .select('id, sku, name');

  if (clearError) {
    throw new Error(`Failed to clear current featured products: ${clearError.message}`);
  }

  const { data: appliedRows, error: applyError } = await supabase
    .from('products')
    .update({ featured: true })
    .in('sku', skus)
    .select('id, sku, name, featured');

  if (applyError) {
    throw new Error(`Failed to apply featured batch: ${applyError.message}`);
  }

  const newFeatured = await fetchCurrentFeatured(supabase);
  const expected = new Set(skus);
  const unexpected = newFeatured
    .map((row) => row.sku)
    .filter((sku) => !expected.has(sku));

  if (newFeatured.length !== skus.length || unexpected.length > 0) {
    throw new Error(
      `Post-apply verification failed: ${newFeatured.length} featured, unexpected: ${unexpected.join(', ')}`
    );
  }

  console.log(`\nCleared ${clearedRows?.length ?? 0} previous featured product(s).`);
  console.log(`Applied ${appliedRows?.length ?? 0} featured product(s).`);
  console.log('Post-apply verification passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
