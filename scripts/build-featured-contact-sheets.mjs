#!/usr/bin/env node

/**
 * Builds contact sheets from the local Supabase product cache to visually pick
 * featured products.
 *
 * Usage:
 *   node scripts/build-featured-contact-sheets.mjs --min-id=1000
 *   node scripts/build-featured-contact-sheets.mjs --min-id=1000 --limit=120
 *
 * Output:
 *   /private/tmp/modacircular-featured-contact-sheets/sheet-01.png
 *   /private/tmp/modacircular-featured-contact-sheets/index.json
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const CACHE_PATH = path.join('data', '.products-cache.json');
const DEFAULT_OUTPUT_DIR = path.join(
  os.tmpdir(),
  'modacircular-featured-contact-sheets'
);
const DEFAULT_TILE_WIDTH = 230;
const DEFAULT_TILE_HEIGHT = 330;
const DEFAULT_IMAGE_WIDTH = 210;
const DEFAULT_IMAGE_HEIGHT = 250;
const IMAGE_FETCH_TIMEOUT_MS = 12_000;

function printUsage() {
  console.log(`Build product image contact sheets.

Usage:
  node scripts/build-featured-contact-sheets.mjs [options]

Options:
  --min-id=<N>          Only include products with numeric id >= N
  --limit=<N>           Include at most N products after filtering
  --sheet-size=<N>      Products per sheet (default: 30)
  --cols=<N>            Columns per sheet (default: 6)
  --output-dir=<path>   Output directory (default: ${DEFAULT_OUTPUT_DIR})
  --skus=<list>         Comma-separated SKUs to render in that exact order
  --include-featured    Include products already marked featured
  --help, -h            Show this help text
`);
}

function parseArgs(argv) {
  const parsed = {
    minId: 0,
    limit: Infinity,
    sheetSize: 30,
    cols: 6,
    outputDir: DEFAULT_OUTPUT_DIR,
    includeFeatured: false,
    skus: null,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg === '--include-featured') {
      parsed.includeFeatured = true;
    } else if (arg.startsWith('--min-id=')) {
      parsed.minId = parsePositiveInt(arg, '--min-id=');
    } else if (arg.startsWith('--limit=')) {
      parsed.limit = parsePositiveInt(arg, '--limit=');
    } else if (arg.startsWith('--sheet-size=')) {
      parsed.sheetSize = parsePositiveInt(arg, '--sheet-size=');
    } else if (arg.startsWith('--cols=')) {
      parsed.cols = parsePositiveInt(arg, '--cols=');
    } else if (arg.startsWith('--output-dir=')) {
      parsed.outputDir = arg.slice('--output-dir='.length);
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

  return parsed;
}

function parsePositiveInt(arg, prefix) {
  const value = Number.parseInt(arg.slice(prefix.length), 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${prefix.slice(0, -1)} must be a positive integer.`);
  }
  return value;
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(value, maxLength) {
  const text = String(value ?? '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}...`;
}

function firstImageUrl(product) {
  const images = Array.isArray(product.Images) ? product.Images : [];
  const firstImage = images[0];

  if (typeof firstImage === 'string') {
    return firstImage;
  }

  if (firstImage && typeof firstImage === 'object') {
    return firstImage.url;
  }

  return null;
}

function productId(product) {
  const id = Number.parseInt(String(product.id), 10);
  return Number.isFinite(id) ? id : 0;
}

function pickCandidates(products, options) {
  if (options.skus) {
    const bySku = new Map(products.map((product) => [product.SKU, product]));
    const missing = options.skus.filter((sku) => !bySku.has(sku));
    if (missing.length > 0) {
      throw new Error(`Unknown SKU(s): ${missing.join(', ')}`);
    }

    return options.skus
      .map((sku) => bySku.get(sku))
      .filter((product) => firstImageUrl(product));
  }

  return products
    .filter((product) => options.includeFeatured || !product.featured)
    .filter((product) => productId(product) >= options.minId)
    .filter((product) => firstImageUrl(product))
    .sort((left, right) => productId(right) - productId(left))
    .slice(0, options.limit);
}

function buildLabelSvg(product) {
  const label1 = `${product.SKU ?? product.id} | ${product.category ?? 'uncat'}`;
  const label2 = truncate(product['Product Name'] ?? '', 26);
  const label3 = product.Price === undefined ? '' : `$${product.Price}`;

  return Buffer.from(`
    <svg width="${DEFAULT_TILE_WIDTH}" height="${DEFAULT_TILE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${DEFAULT_TILE_WIDTH}" height="${DEFAULT_TILE_HEIGHT}" rx="8" fill="#ffffff" stroke="#d1d5db" />
      <text x="10" y="280" font-size="14" font-family="Arial, sans-serif" font-weight="700" fill="#111827">${escapeXml(label1)}</text>
      <text x="10" y="302" font-size="13" font-family="Arial, sans-serif" fill="#111827">${escapeXml(label2)}</text>
      <text x="10" y="322" font-size="12" font-family="Arial, sans-serif" fill="#4b5563">${escapeXml(label3)}</text>
    </svg>
  `);
}

function buildErrorSvg(product, message) {
  return Buffer.from(`
    <svg width="${DEFAULT_IMAGE_WIDTH}" height="${DEFAULT_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <text x="12" y="110" font-size="15" font-family="Arial, sans-serif" font-weight="700" fill="#991b1b">${escapeXml(product.SKU ?? product.id)}</text>
      <text x="12" y="135" font-size="12" font-family="Arial, sans-serif" fill="#991b1b">${escapeXml(truncate(message, 28))}</text>
    </svg>
  `);
}

async function loadCardImage(product) {
  const url = firstImageUrl(product);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const input = Buffer.from(await response.arrayBuffer());
  return sharp(input)
    .rotate()
    .resize(DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT, {
      fit: 'cover',
      position: 'attention',
    })
    .jpeg({ quality: 86 })
    .toBuffer();
}

async function buildSheet(sheetProducts, sheetNumber, options) {
  const cols = options.cols;
  const rows = Math.ceil(sheetProducts.length / cols);
  const sheetWidth = cols * DEFAULT_TILE_WIDTH;
  const sheetHeight = rows * DEFAULT_TILE_HEIGHT;
  const composites = [];
  const failures = [];
  const loadedImages = await Promise.all(
    sheetProducts.map(async (product) => {
      try {
        return { product, image: await loadCardImage(product), error: null };
      } catch (error) {
        return { product, image: null, error };
      }
    })
  );

  for (let index = 0; index < loadedImages.length; index += 1) {
    const { product, image, error } = loadedImages[index];
    const x = (index % cols) * DEFAULT_TILE_WIDTH;
    const y = Math.floor(index / cols) * DEFAULT_TILE_HEIGHT;

    composites.push({ input: buildLabelSvg(product), left: x, top: y });

    if (image) {
      composites.push({ input: image, left: x + 10, top: y + 10 });
    } else {
      failures.push({
        id: product.id,
        sku: product.SKU,
        name: product['Product Name'],
        error: error.message,
      });
      composites.push({
        input: buildErrorSvg(product, error.message),
        left: x + 10,
        top: y + 10,
      });
    }
  }

  const fileName = `sheet-${String(sheetNumber).padStart(2, '0')}.png`;
  const filePath = path.join(options.outputDir, fileName);
  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: '#f9fafb',
    },
  })
    .composite(composites)
    .png()
    .toFile(filePath);

  return { fileName, filePath, failures };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cache = JSON.parse(await fs.readFile(CACHE_PATH, 'utf8'));
  const products = Array.isArray(cache.data) ? cache.data : [];
  const candidates = pickCandidates(products, options);
  const sheets = [];
  const failures = [];

  await fs.mkdir(options.outputDir, { recursive: true });

  for (let offset = 0; offset < candidates.length; offset += options.sheetSize) {
    const sheetProducts = candidates.slice(offset, offset + options.sheetSize);
    const result = await buildSheet(
      sheetProducts,
      Math.floor(offset / options.sheetSize) + 1,
      options
    );
    sheets.push({
      file: result.filePath,
      products: sheetProducts.map((product) => ({
        id: product.id,
        sku: product.SKU,
        name: product['Product Name'],
        category: product.category,
        price: product.Price,
        image: firstImageUrl(product),
      })),
    });
    failures.push(...result.failures);
    console.log(`Wrote ${result.filePath}`);
  }

  await fs.writeFile(
    path.join(options.outputDir, 'index.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        cacheTimestamp: cache.timestamp
          ? new Date(cache.timestamp).toISOString()
          : null,
        options,
        candidateCount: candidates.length,
        sheets,
        failures,
      },
      null,
      2
    )}\n`
  );

  console.log(
    `Built ${sheets.length} sheet(s) for ${candidates.length} candidate(s).`
  );
  if (failures.length > 0) {
    console.log(`${failures.length} image(s) failed; see index.json.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
