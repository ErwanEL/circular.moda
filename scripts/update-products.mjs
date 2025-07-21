#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import Airtable from 'airtable';

// This script is for manual product updates - not tied to build process
console.log('🔄 Manual product update script');

// Validate required environment variables
const requiredEnvVars = [
  'AIRTABLE_TOKEN',
  'AIRTABLE_BASE_ID',
  'AIRTABLE_TABLE_NAME',
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ${envVar} missing – please set in .env.local`);
    process.exit(1);
  }
}

const dataDir = path.join(process.cwd(), 'data');
const productsFile = path.join(dataDir, 'products.json');
const cacheFile = path.join(dataDir, '.airtable-cache.json');

// Cache management
async function getCacheInfo() {
  try {
    const cacheData = await fs.readFile(cacheFile, 'utf8');
    return JSON.parse(cacheData);
  } catch {
    return null;
  }
}

async function saveCacheInfo(records) {
  const cacheInfo = {
    lastFetch: new Date().toISOString(),
    recordCount: records.length,
    recordIds: records.map((r) => r.id).sort(),
    dataHash: JSON.stringify(records.map((r) => ({ id: r.id, ...r.fields })))
      .length,
  };

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(cacheFile, JSON.stringify(cacheInfo, null, 2));
}

async function hasDataChanged(newRecords) {
  const cacheInfo = await getCacheInfo();
  if (!cacheInfo) return true;

  if (cacheInfo.recordCount !== newRecords.length) return true;

  const newRecordIds = newRecords.map((r) => r.id).sort();
  if (JSON.stringify(cacheInfo.recordIds) !== JSON.stringify(newRecordIds))
    return true;

  const newDataHash = JSON.stringify(
    newRecords.map((r) => ({ id: r.id, ...r.fields }))
  ).length;
  if (cacheInfo.dataHash !== newDataHash) return true;

  return false;
}

// Optimized Airtable fetch
async function fetchProducts() {
  console.log('📡 Connecting to Airtable...');

  const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base(
    process.env.AIRTABLE_BASE_ID
  );

  // Fetch all fields to ensure we get the primary field
  // Note: Airtable automatically includes the primary field when no fields are specified
  try {
    const records = await base(process.env.AIRTABLE_TABLE_NAME)
      .select({
        view: 'Grid view',
        // Don't specify fields to get all fields including primary field
      })
      .all();

    console.log(`📊 Fetched ${records.length} records from Airtable`);
    return records;
  } catch (error) {
    console.error('❌ Airtable API error:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Check if data has changed
    const records = await fetchProducts();
    const changed = await hasDataChanged(records);

    if (!changed) {
      console.log('✅ No changes detected - products are up to date');
      return;
    }

    // Transform records
    const products = records.map((r) => ({
      id: r.id,
      slug: slugify(String(r.get('SKU') ?? '')),
      ...r.fields,
    }));

    // Write data and cache info
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(productsFile, JSON.stringify(products, null, 2));
    await saveCacheInfo(records);

    console.log(`✅ Successfully updated ${products.length} products`);
    console.log(`📁 Data saved to: ${productsFile}`);
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

function slugify(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Run the script
main();
