import fs from 'node:fs/promises';
import path from 'node:path';
import type { Product } from './types';

const jsonPath = path.join(process.cwd(), 'data/products.json');

let cache: Product[] = [];

export async function getAllProducts(): Promise<Product[]> {
  if (cache.length > 0) return cache;
  const file = await fs.readFile(jsonPath, 'utf8');
  cache = JSON.parse(file);
  return cache;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug) ?? null;
}
