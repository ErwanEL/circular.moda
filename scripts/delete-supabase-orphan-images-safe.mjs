#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';

dotenv.config({ path: '.env.local' });

const BUCKET = 'storage';
const PREFIX = 'products';
const PAGE_SIZE = 1000;
const PUBLIC_MARKER = '/storage/v1/object/public/storage/';
const REPORT_BASE = 'reports/supabase-orphan-delete-plan-2026-08-27';
const IGNORED_DIRS = new Set([
  '.git',
  '.next',
  '.vercel',
  'build',
  'dist',
  'node_modules',
  'reports',
]);
const TEXT_EXTENSIONS = new Set([
  '.css',
  '.csv',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mdx',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function fetchAllProducts(supabase) {
  const products = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, public_id, images')
      .range(from, from + PAGE_SIZE - 1);

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

    for (const object of data ?? []) {
      if (object.name) {
        objects.push({
          id: object.id ?? null,
          path: `${PREFIX}/${object.name}`,
          size: object.metadata?.size ?? 0,
          updatedAt: object.updated_at ?? null,
        });
      }
    }

    if (!data || data.length < PAGE_SIZE) break;
  }

  return objects;
}

function collectProductReferences(products) {
  const references = new Map();

  for (const product of products) {
    const images = Array.isArray(product.images) ? product.images : [];
    for (const imageUrl of images) {
      const path = getStorageObjectPathFromPublicUrl(imageUrl);
      if (!path) continue;

      const rows = references.get(path) ?? [];
      rows.push({
        id: product.id,
        name: product.name,
        public_id: product.public_id,
      });
      references.set(path, rows);
    }
  }

  return references;
}

function getExtension(fileName) {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

function collectLocalReferences(root) {
  const references = new Map();
  const urlRegex =
    /https?:\/\/[^\s"<>)]*\/storage\/v1\/object\/public\/storage\/products\/[A-Za-z0-9._%+\-=()]+/g;
  const pathRegex = /products\/[A-Za-z0-9._%+\-=()]+/g;

  function addReference(path, filePath) {
    if (!path || !path.startsWith(`${PREFIX}/`) || path.includes('..')) {
      return;
    }

    const files = references.get(path) ?? [];
    files.push(relative(root, filePath));
    references.set(path, files);
  }

  function walk(directory) {
    for (const name of readdirSync(directory)) {
      if (IGNORED_DIRS.has(name)) continue;

      const fullPath = join(directory, name);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (
        stats.size > 5_000_000 ||
        !TEXT_EXTENSIONS.has(getExtension(name))
      ) {
        continue;
      }

      let text = '';
      try {
        text = readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      for (const match of text.matchAll(urlRegex)) {
        addReference(getStorageObjectPathFromPublicUrl(match[0]), fullPath);
      }

      for (const match of text.matchAll(pathRegex)) {
        addReference(decodeURIComponent(match[0]), fullPath);
      }
    }
  }

  walk(root);
  return references;
}

async function deleteInBatches(supabase, paths) {
  let deleted = 0;

  for (let index = 0; index < paths.length; index += 100) {
    const batch = paths.slice(index, index + 100);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) {
      throw new Error(`Failed to delete batch starting at ${index}: ${error.message}`);
    }
    deleted += batch.length;
  }

  return deleted;
}

async function main() {
  const deleteConfirmed = process.argv.includes('--delete-confirmed');
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const [products, objects] = await Promise.all([
    fetchAllProducts(supabase),
    listProductStorageObjects(supabase),
  ]);
  const productReferences = collectProductReferences(products);
  const localReferences = collectLocalReferences(process.cwd());
  const protectedPaths = new Set([
    ...productReferences.keys(),
    ...localReferences.keys(),
  ]);

  const candidates = objects
    .filter((object) => !protectedPaths.has(object.path))
    .sort((a, b) => b.size - a.size);
  const protectedLocalOnly = objects.filter(
    (object) =>
      !productReferences.has(object.path) && localReferences.has(object.path)
  );
  const storageBytes = objects.reduce((sum, object) => sum + object.size, 0);
  const candidateBytes = candidates.reduce(
    (sum, object) => sum + object.size,
    0
  );

  mkdirSync('reports', { recursive: true });
  writeFileSync(
    `${REPORT_BASE}.json`,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        deleteConfirmed,
        bucket: BUCKET,
        prefix: PREFIX,
        productsScanned: products.length,
        objectsScanned: objects.length,
        productReferenceCount: productReferences.size,
        localReferenceCount: localReferences.size,
        protectedLocalOnly,
        candidates,
        storageBytes,
        candidateBytes,
      },
      null,
      2
    )
  );
  writeFileSync(
    `${REPORT_BASE}.txt`,
    candidates
      .map(
        (object) =>
          `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${object.path}`
      )
      .join('\n') + (candidates.length > 0 ? '\n' : '')
  );

  let deleted = 0;
  if (deleteConfirmed) {
    deleted = await deleteInBatches(
      supabase,
      candidates.map((object) => object.path)
    );
  }

  console.log(
    JSON.stringify(
      {
        mode: deleteConfirmed ? 'delete' : 'dry-run',
        productsScanned: products.length,
        objectsScanned: objects.length,
        productReferenceCount: productReferences.size,
        localReferenceCount: localReferences.size,
        protectedLocalOnly: protectedLocalOnly.length,
        deletionCandidates: candidates.length,
        deleted,
        storageUnderProducts: formatBytes(storageBytes),
        candidateBytes: formatBytes(candidateBytes),
        json: `${REPORT_BASE}.json`,
        txt: `${REPORT_BASE}.txt`,
        largestCandidates: candidates.slice(0, 10).map((object) => ({
          path: object.path,
          size: formatBytes(object.size),
        })),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
