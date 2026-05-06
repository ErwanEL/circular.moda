import { revalidatePath, revalidateTag } from 'next/cache';
import { getProductTag, PRODUCTS_TAG } from './product-cache';

type RevalidateProductContentOptions = {
  slug?: string | null;
  oldSlug?: string | null;
  paths?: string[];
};

type RevalidationResult = {
  paths: string[];
  tags: string[];
};

function normalizeSlug(slug?: string | null): string | null {
  if (typeof slug !== 'string') {
    return null;
  }

  const trimmed = slug.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizePath(path: unknown): string | null {
  if (typeof path !== 'string') {
    return null;
  }

  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  return trimmed;
}

export function revalidateProductContent(
  options: RevalidateProductContentOptions = {}
): RevalidationResult {
  const paths = new Set<string>(['/products']);
  const tags = new Set<string>([PRODUCTS_TAG]);

  for (const slug of [options.oldSlug, options.slug]) {
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) {
      continue;
    }

    paths.add(`/products/${normalizedSlug}`);
    tags.add(getProductTag(normalizedSlug));
  }

  for (const path of options.paths ?? []) {
    const normalizedPath = normalizePath(path);
    if (normalizedPath) {
      paths.add(normalizedPath);
    }
  }

  for (const tag of tags) {
    revalidateTag(tag, 'max');
  }

  for (const path of paths) {
    revalidatePath(path, 'page');
  }

  return {
    paths: [...paths],
    tags: [...tags],
  };
}
