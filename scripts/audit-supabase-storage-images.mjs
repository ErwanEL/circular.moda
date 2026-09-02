#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BUCKET = 'storage';
const PREFIX = 'products';
const PUBLIC_MARKER = '/storage/v1/object/public/storage/';
const PAGE_SIZE = 1000;

function usage() {
  console.log(`Audit Supabase product storage usage.

Usage:
  node scripts/audit-supabase-storage-images.mjs [--delete-orphans]

Options:
  --delete-orphans  Delete files under storage/products that are not referenced
                    by products.images. Without this flag, the script is read-only.
`);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getStorageObjectPathFromPublicUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') return null;

  try {
    const parsedUrl = new URL(url);
    const markerIndex = parsedUrl.pathname.indexOf(PUBLIC_MARKER);
    if (markerIndex < 0) return null;

    const objectPath = decodeURIComponent(
      parsedUrl.pathname.slice(markerIndex + PUBLIC_MARKER.length)
    );

    if (!objectPath.startsWith(`${PREFIX}/`) || objectPath.includes('..')) {
      return null;
    }

    return objectPath;
  } catch {
    return null;
  }
}

async function fetchAllProducts(supabase) {
  const products = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('products')
      .select('id, name, images')
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    products.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return products;
}

async function listProductStorageObjects(supabase) {
  const objects = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.storage.from(BUCKET).list(PREFIX, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw new Error(`Failed to list storage objects: ${error.message}`);
    }

    const page = data ?? [];
    for (const object of page) {
      if (object.name) {
        objects.push({
          path: `${PREFIX}/${object.name}`,
          size: object.metadata?.size ?? 0,
          updatedAt: object.updated_at ?? null,
        });
      }
    }

    if (page.length < PAGE_SIZE) break;
  }

  return objects;
}

function collectReferencedImagePaths(products) {
  const referenced = new Set();

  for (const product of products) {
    const images = Array.isArray(product.images) ? product.images : [];
    for (const imageUrl of images) {
      const path = getStorageObjectPathFromPublicUrl(imageUrl);
      if (path) referenced.add(path);
    }
  }

  return referenced;
}

async function deleteInBatches(supabase, paths) {
  let deleted = 0;

  for (let index = 0; index < paths.length; index += 100) {
    const batch = paths.slice(index, index + 100);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) {
      throw new Error(`Failed to delete a batch: ${error.message}`);
    }
    deleted += batch.length;
  }

  return deleted;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--help') || args.has('-h')) {
    usage();
    return;
  }

  const deleteOrphans = args.has('--delete-orphans');
  const unknownArgs = [...args].filter((arg) => arg !== '--delete-orphans');
  if (unknownArgs.length > 0) {
    throw new Error(`Unknown option(s): ${unknownArgs.join(', ')}`);
  }

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const [products, objects] = await Promise.all([
    fetchAllProducts(supabase),
    listProductStorageObjects(supabase),
  ]);

  const referencedPaths = collectReferencedImagePaths(products);
  const orphanObjects = objects.filter(
    (object) => !referencedPaths.has(object.path)
  );

  const storageBytes = objects.reduce((sum, object) => sum + object.size, 0);
  const orphanBytes = orphanObjects.reduce(
    (sum, object) => sum + object.size,
    0
  );

  console.log(`Products scanned:        ${products.length}`);
  console.log(`Storage objects scanned: ${objects.length}`);
  console.log(`Referenced image paths:  ${referencedPaths.size}`);
  console.log(`Storage under products/: ${formatBytes(storageBytes)}`);
  console.log(
    `Orphan objects:          ${orphanObjects.length} (${formatBytes(orphanBytes)})`
  );

  if (orphanObjects.length > 0) {
    console.log('\nLargest orphan objects:');
    for (const object of orphanObjects
      .toSorted((a, b) => b.size - a.size)
      .slice(0, 20)) {
      console.log(`- ${formatBytes(object.size).padStart(8)}  ${object.path}`);
    }
  }

  if (!deleteOrphans) {
    console.log('\nDry run only. Re-run with --delete-orphans to delete them.');
    return;
  }

  const deleted = await deleteInBatches(
    supabase,
    orphanObjects.map((object) => object.path)
  );
  console.log(`\nDeleted orphan objects: ${deleted}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
