const STORAGE_PUBLIC_MARKER = '/storage/v1/object/public/storage/';

export function getStorageObjectPathFromPublicUrl(url: unknown): string | null {
  if (typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const markerIndex = parsedUrl.pathname.indexOf(STORAGE_PUBLIC_MARKER);
    if (markerIndex < 0) {
      return null;
    }

    const objectPath = decodeURIComponent(
      parsedUrl.pathname.slice(markerIndex + STORAGE_PUBLIC_MARKER.length)
    );

    if (!objectPath.startsWith('products/') || objectPath.includes('..')) {
      return null;
    }

    return objectPath;
  } catch {
    return null;
  }
}

export function getRemovedStorageObjectPaths(
  previousUrls: unknown,
  nextUrls: unknown
) {
  const previous = Array.isArray(previousUrls) ? previousUrls : [];
  const next = Array.isArray(nextUrls) ? nextUrls : [];
  const nextUrlSet = new Set(
    next.filter((url): url is string => typeof url === 'string')
  );
  const paths = new Set<string>();

  for (const previousUrl of previous) {
    if (typeof previousUrl !== 'string' || nextUrlSet.has(previousUrl)) {
      continue;
    }

    const path = getStorageObjectPathFromPublicUrl(previousUrl);
    if (path) {
      paths.add(path);
    }
  }

  return [...paths];
}
