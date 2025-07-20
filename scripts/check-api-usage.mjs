#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

console.log('🔍 API Usage Checker');
console.log('==================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log(
  `FETCH_AIRTABLE_AT_BUILD: ${process.env.FETCH_AIRTABLE_AT_BUILD || 'NOT SET'}`
);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(
  `AIRTABLE_TOKEN: ${process.env.AIRTABLE_TOKEN ? 'SET' : 'NOT SET'}`
);

// Check cache files
const dataDir = path.join(process.cwd(), 'data');
const cacheFile = path.join(dataDir, '.airtable-cache.json');

try {
  const cacheData = await fs.readFile(cacheFile, 'utf8');
  const cache = JSON.parse(cacheData);

  console.log('\n📊 Cache Information:');
  console.log(`Last fetch: ${cache.lastFetch}`);
  console.log(`Record count: ${cache.recordCount}`);
  console.log(
    `Hours since last fetch: ${((Date.now() - new Date(cache.lastFetch).getTime()) / (1000 * 60 * 60)).toFixed(2)}`
  );
} catch {
  console.log('\n📊 Cache Information: No cache file found');
}

// Check if products.json exists
const productsFile = path.join(dataDir, 'products.json');
try {
  const productsData = await fs.readFile(productsFile, 'utf8');
  const products = JSON.parse(productsData);
  console.log(`\n📦 Products file: ${products.length} products available`);
} catch {
  console.log('\n📦 Products file: Not found');
}

// Check package.json scripts
try {
  const packageJson = await fs.readFile('package.json', 'utf8');
  const packageData = JSON.parse(packageJson);

  console.log('\n📜 Build Scripts:');
  console.log(`prebuild: ${packageData.scripts.prebuild}`);
  console.log(`build: ${packageData.scripts.build}`);
  console.log(`build:safe: ${packageData.scripts['build:safe'] || 'NOT SET'}`);
} catch {
  console.log('\n📜 Build Scripts: Could not read package.json');
}

console.log('\n✅ API Usage Check Complete');
console.log('\n💡 Recommendations:');
console.log('1. Use "npm run build:safe" for builds without API calls');
console.log('2. Set FETCH_AIRTABLE_AT_BUILD=false in all environments');
console.log('3. Use "npm run update-products" only when you need fresh data');
