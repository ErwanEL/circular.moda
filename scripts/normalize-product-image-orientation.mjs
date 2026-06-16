#!/usr/bin/env node

/**
 * One-off backfill: normalize the orientation of all product images stored in
 * Supabase Storage.
 *
 * Phones store photos with a sideways pixel grid plus an EXIF "Orientation"
 * tag. The /api/image proxy bakes that tag in for on-site display, but anything
 * that reads the raw Supabase URL (e.g. the openGraph/twitter share images in
 * products/[slug]/page.tsx) still depends on each platform honoring EXIF.
 *
 * This script bakes the EXIF orientation into the pixels and strips the tag,
 * in place, so the raw stored file matches what the proxy shows. It is
 * deterministic and idempotent: re-running does nothing.
 *
 * To avoid the "stale tag" trap (some images are already upright but still
 * carry a rotation tag), it ONLY rotates images whose stored pixels are
 * landscape AND whose tag is a 90°/270° turn — the signature of a genuinely
 * sideways phone photo. Portrait-stored and 180°-tagged images are left as-is.
 * This mirrors the same guard in the /api/image proxy. Run --dry-run first.
 *
 * Usage:
 *   node scripts/normalize-product-image-orientation.mjs --dry-run
 *   node scripts/normalize-product-image-orientation.mjs --limit=3
 *   node scripts/normalize-product-image-orientation.mjs
 *
 * Requirements (.env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import sharp from 'sharp';

dotenv.config({ path: '.env.local' });

const BUCKET = 'storage';
const PUBLIC_MARKER = '/storage/v1/object/public/storage/';
const PRODUCTS_PAGE_SIZE = 1000;

const EXTENSION_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
};

function printUsage() {
  console.log(`Normalize the EXIF orientation of all stored product images.

Usage:
  node scripts/normalize-product-image-orientation.mjs [--dry-run] [--limit=N]

Options:
  --dry-run     Report what would change without writing anything
  --limit=<N>   Process at most N images (handy for a first test run)
  --help, -h    Show this help text
`);
}

function parseArgs(argv) {
  const parsed = { dryRun: false, limit: Infinity };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg.startsWith('--limit=')) {
      const n = Number.parseInt(arg.slice('--limit='.length), 10);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error('--limit must be a positive integer.');
      }
      parsed.limit = n;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
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

/** Returns the in-bucket object path (e.g. "products/abc-1.jpg") or null. */
function toObjectPath(url) {
  if (typeof url !== 'string') return null;
  const idx = url.indexOf(PUBLIC_MARKER);
  if (idx === -1) return null;
  const rest = url.slice(idx + PUBLIC_MARKER.length).split('?')[0];
  if (!rest) return null;
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}

function extensionOf(objectPath) {
  const dot = objectPath.lastIndexOf('.');
  if (dot === -1) return '';
  return objectPath.slice(dot + 1).toLowerCase();
}

async function fetchAllProducts(supabase) {
  const products = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, images')
      .order('id', { ascending: true })
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
  const { dryRun, limit } = parseArgs(process.argv.slice(2));

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = requireEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  console.log(
    `🧭 Normalizing product image orientation${dryRun ? ' (DRY RUN)' : ''}...`
  );
  if (Number.isFinite(limit)) console.log(`   limit: ${limit} image(s)`);
  console.log('');

  const products = await fetchAllProducts(supabase);
  console.log(`📦 ${products.length} product(s) to scan\n`);

  const stats = {
    imagesScanned: 0,
    skippedNonSupabase: 0,
    skippedAlreadyUpright: 0,
    skippedStaleTag: 0,
    skippedFormat: 0,
    rotated: 0,
    fetchFailures: 0,
    decodeFailures: 0,
    uploadFailures: 0,
  };

  outer: for (const product of products) {
    const images = Array.isArray(product.images) ? product.images : [];
    for (const url of images) {
      if (stats.imagesScanned >= limit) break outer;

      const objectPath = toObjectPath(url);
      if (!objectPath) {
        stats.skippedNonSupabase += 1;
        continue;
      }

      stats.imagesScanned += 1;

      // Download current bytes.
      let buf;
      let contentType;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          stats.fetchFailures += 1;
          console.warn(`   ⚠️  fetch ${res.status} for ${objectPath}`);
          continue;
        }
        contentType = res.headers.get('content-type') || undefined;
        buf = Buffer.from(await res.arrayBuffer());
      } catch (error) {
        stats.fetchFailures += 1;
        console.warn(`   ⚠️  fetch failed for ${objectPath}: ${error.message}`);
        continue;
      }

      // Inspect orientation.
      let meta;
      try {
        meta = await sharp(buf).metadata();
      } catch (error) {
        stats.decodeFailures += 1;
        console.warn(`   ⚠️  decode failed for ${objectPath}: ${error.message}`);
        continue;
      }

      const orientation = meta.orientation;
      if (!orientation || orientation === 1) {
        stats.skippedAlreadyUpright += 1;
        continue;
      }

      // Only rotate a genuinely-sideways photo: a 90°/270° tag on a
      // landscape-stored image. A quarter-turn tag on a portrait-stored image
      // means the pixels are already upright and the tag is stale (rotating
      // would flip a correct image); 180° tags are likewise left untouched.
      const isQuarterTurn = orientation >= 5 && orientation <= 8;
      const isLandscape =
        typeof meta.width === 'number' &&
        typeof meta.height === 'number' &&
        meta.width > meta.height;
      if (!isQuarterTurn || !isLandscape) {
        stats.skippedStaleTag += 1;
        console.log(
          `   skip (stale tag) product ${product.id} ${objectPath} (orientation ${orientation}, ${meta.width}x${meta.height})`
        );
        continue;
      }

      // Rotate: bake the EXIF orientation into pixels, strip the tag.
      // Preserve the encoded format; bump quality for lossy formats so a
      // single re-encode stays visually lossless.
      let pipeline = sharp(buf).rotate();
      if (meta.format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
      } else if (meta.format === 'webp') {
        pipeline = pipeline.webp({ quality: 90 });
      }

      let data;
      let info;
      try {
        ({ data, info } = await pipeline.toBuffer({ resolveWithObject: true }));
      } catch (error) {
        stats.decodeFailures += 1;
        console.warn(`   ⚠️  rotate failed for ${objectPath}: ${error.message}`);
        continue;
      }

      // Never overwrite with a different encoded format (e.g. SVG -> PNG).
      if (meta.format && info.format !== meta.format) {
        stats.skippedFormat += 1;
        console.warn(
          `   ⚠️  format would change (${meta.format} -> ${info.format}) for ${objectPath}, skipping`
        );
        continue;
      }

      const label = `product ${product.id} ${objectPath} (orientation ${orientation}, ${meta.width}x${meta.height} -> ${info.width}x${info.height})`;

      if (dryRun) {
        stats.rotated += 1;
        console.log(`   would rotate ${label}`);
        continue;
      }

      const uploadType =
        contentType ||
        EXTENSION_MIME[extensionOf(objectPath)] ||
        'application/octet-stream';

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, data, { contentType: uploadType, upsert: true });

      if (uploadError) {
        stats.uploadFailures += 1;
        console.warn(`   ⚠️  upload failed for ${objectPath}: ${uploadError.message}`);
        continue;
      }

      stats.rotated += 1;
      console.log(`   ✅ rotated ${label}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Products scanned:        ${products.length}`);
  console.log(`Images scanned:          ${stats.imagesScanned}`);
  console.log(`Already upright (skip):  ${stats.skippedAlreadyUpright}`);
  console.log(`Stale tag, left alone:   ${stats.skippedStaleTag}`);
  console.log(
    `${dryRun ? 'Would rotate' : 'Rotated'}:${dryRun ? '            ' : '                 '}${stats.rotated}`
  );
  console.log(`Skipped (non-Supabase):  ${stats.skippedNonSupabase}`);
  console.log(`Skipped (format guard):  ${stats.skippedFormat}`);
  console.log(`Fetch failures:          ${stats.fetchFailures}`);
  console.log(`Decode/rotate failures:  ${stats.decodeFailures}`);
  console.log(`Upload failures:         ${stats.uploadFailures}`);

  if (dryRun) {
    console.log('\nℹ️  Dry run — nothing was written. Re-run without --dry-run to apply.');
  } else {
    console.log('\n✅ Done. Re-running is a no-op (idempotent).');
  }
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
