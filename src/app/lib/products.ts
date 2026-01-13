import fs from 'node:fs/promises';
import path from 'node:path';
import type { Product } from './types';
import {
  getAllProductsFromSupabase,
  getProductBySlugFromSupabase,
} from './supabase-products';

const jsonPath = path.join(process.cwd(), 'data/products.json');
const cacheFile = path.join(process.cwd(), 'data/.products-cache.json');

// In-memory cache with TTL
let cache: Product[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache management
async function loadCacheFromDisk() {
  try {
    const cacheData = await fs.readFile(cacheFile, 'utf8');
    const { data, timestamp } = JSON.parse(cacheData);

    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_TTL) {
      cache = data;
      cacheTimestamp = timestamp;
      return true;
    }
  } catch {
    // Cache file doesn't exist or is invalid
  }
  return false;
}

async function saveCacheToDisk(data: Product[]) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.warn('Failed to save cache to disk:', error);
  }
}

// Optimized product loading with multiple fallback strategies
async function loadProductsFromFile(): Promise<Product[]> {
  try {
    const file = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(file);
  } catch (error) {
    console.error('Failed to load products from file:', error);
    throw new Error('Products data not available');
  }
}

export async function getAllProducts(): Promise<Product[]> {
  // Check in-memory cache first
  if (cache.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL) {
    return [...cache];
  }

  // Try to load from disk cache
  if (await loadCacheFromDisk()) {
    return [...cache];
  }

  // Load from both sources: JSON (anciens) + Supabase (nouveaux)
  const [jsonProducts, supabaseProducts] = await Promise.all([
    loadProductsFromFile().catch(() => []), // Fallback si JSON échoue
    getAllProductsFromSupabase().catch(() => []), // Fallback si Supabase échoue
  ]);

  // Dédupliquer: créer un set des IDs/SKUs Supabase pour éviter les doublons
  const supabaseKeys = new Set<string>();
  supabaseProducts.forEach((product) => {
    const key = product.SKU?.toString() || product.slug || product.id;
    if (key) {
      supabaseKeys.add(key);
    }
  });

  // Filtrer les produits JSON pour exclure ceux qui existent dans Supabase
  const uniqueJsonProducts = jsonProducts.filter((product) => {
    const key = product.SKU?.toString() || product.slug || product.id;
    return key ? !supabaseKeys.has(key) : true;
  });

  // Combiner: Supabase en premier, puis JSON (sans doublons)
  const allProducts = [...supabaseProducts, ...uniqueJsonProducts];

  // Update cache
  cache = allProducts;
  cacheTimestamp = Date.now();

  // Save to disk cache for next time
  await saveCacheToDisk(allProducts);

  return [...allProducts];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    // Chercher d'abord dans Supabase (nouveaux produits)
    const supabaseProduct = await getProductBySlugFromSupabase(slug);
    if (supabaseProduct) {
      return supabaseProduct;
    }

    // Sinon chercher dans JSON (anciens produits)
    const all = await getAllProducts();
    return all.find((p) => p.slug === slug) ?? null;
  } catch (error) {
    console.error('Failed to get product by slug:', error);
    return null;
  }
}

// Utility function to check if products data is available
export async function isProductsDataAvailable(): Promise<boolean> {
  try {
    const products = await getAllProducts();
    return products.length > 0;
  } catch {
    return false;
  }
}

// Utility function to get products count
export async function getProductsCount(): Promise<number> {
  try {
    const products = await getAllProducts();
    return products.length;
  } catch {
    return 0;
  }
}
