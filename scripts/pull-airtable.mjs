import fs from 'node:fs/promises';
import path from 'node:path';
import Airtable from 'airtable';

// Strict environment check - only run when explicitly enabled
if (process.env.FETCH_AIRTABLE_AT_BUILD !== 'true') {
  console.log(
    '▶︎ Skip Airtable pull – FETCH_AIRTABLE_AT_BUILD is not set to "true"'
  );
  process.exit(0);
}

// Additional safety check for development environment
if (
  process.env.NODE_ENV === 'development' &&
  process.env.FETCH_AIRTABLE_AT_BUILD !== 'true'
) {
  console.log(
    '🛡️  Development mode detected - skipping Airtable pull for safety'
  );
  process.exit(0);
}

// Validate required environment variables
const requiredEnvVars = [
  'AIRTABLE_TOKEN',
  'AIRTABLE_BASE_ID',
  'AIRTABLE_TABLE_NAME',
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ${envVar} missing – aborting.`);
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
    // Store a hash of the data to detect changes
    dataHash: JSON.stringify(records.map((r) => ({ id: r.id, ...r.fields })))
      .length,
  };

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(cacheFile, JSON.stringify(cacheInfo, null, 2));
}

async function hasDataChanged(newRecords) {
  const cacheInfo = await getCacheInfo();
  if (!cacheInfo) return true; // No cache exists, consider it changed

  // Quick checks to avoid unnecessary API calls
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

// Optimized Airtable fetch with field selection
async function fetchProducts() {
  console.log('🔄 Fetching products from Airtable...');

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

    // If API fails, try to use existing data if available
    try {
      const existingData = await fs.readFile(productsFile, 'utf8');
      console.log('⚠️  Using existing data due to API error');
      const products = JSON.parse(existingData);
      // Convert back to Airtable record format for consistency
      return products.map((p) => ({
        id: p.id,
        fields: {
          SKU: p.SKU,
          Price: p.Price,
          Category: p.Category,
          Color: p.Color,
          Size: p.Size,
          Images: p.Images,
        },
      }));
    } catch {
      console.error('❌ No existing data available, exiting');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  try {
    // Check if we should skip based on cache
    const cacheInfo = await getCacheInfo();
    if (cacheInfo) {
      const lastFetch = new Date(cacheInfo.lastFetch);
      const hoursSinceLastFetch =
        (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60);

      // Skip if data was fetched less than 1 hour ago (configurable)
      const minHoursBetweenFetches = process.env.MIN_HOURS_BETWEEN_FETCHES || 1;
      if (hoursSinceLastFetch < minHoursBetweenFetches) {
        console.log(
          `⏭️  Skipping fetch - data was updated ${hoursSinceLastFetch.toFixed(1)} hours ago (min: ${minHoursBetweenFetches}h)`
        );
        process.exit(0);
      }
    }

    // Fetch new data
    const records = await fetchProducts();

    // Transform records
    const products = records.map((r) => ({
      id: r.id,
      slug: slugify(String(r.get('SKU') ?? '')),
      ...r.fields,
    }));

    // Check if data actually changed
    const changed = await hasDataChanged(records);
    if (!changed) {
      console.log('✅ No changes detected - skipping file write');
      process.exit(0);
    }

    // Write data and cache info
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(productsFile, JSON.stringify(products, null, 2));
    await saveCacheInfo(records);

    console.log(`✅ Updated ${products.length} products (1 API call consumed)`);
  } catch (error) {
    console.error('❌ Script error:', error.message);
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
