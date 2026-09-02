export const MAX_UPLOADED_PRODUCT_IMAGE_BYTES = 900_000;
export const MAX_UPLOADED_PRODUCT_IMAGES_TOTAL_BYTES = 3_800_000;

const PRODUCT_IMAGE_FORMATS_MESSAGE =
  'Solo se aceptan fotos JPG, PNG, WebP o AVIF.';

const PRODUCT_IMAGE_EXTENSIONS = new Set([
  'avif',
  'jfif',
  'jpe',
  'jpeg',
  'jpg',
  'png',
  'webp',
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  avif: 'image/avif',
  jfif: 'image/jpeg',
  jpe: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function getExtensionFromName(fileName: string): string | null {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot < 0 || lastDot === fileName.length - 1) {
    return null;
  }

  const extension = fileName.slice(lastDot + 1).toLowerCase();
  const safeExtension = extension.replace(/[^a-z0-9]/g, '');
  return safeExtension.length > 0 ? safeExtension : null;
}

function normalizeMimeType(mimeType: string | undefined): string | null {
  const normalized = mimeType?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function getUploadedImageMetadata(file: File): {
  contentType: string;
  extension: string;
} | null {
  const mimeType = normalizeMimeType(file.type);
  const extensionFromName = getExtensionFromName(file.name);
  const extensionFromMime = mimeType ? EXTENSION_BY_MIME[mimeType] : undefined;
  const hasImageMime = Boolean(mimeType?.startsWith('image/'));
  const hasKnownImageExtension =
    extensionFromName != null &&
    PRODUCT_IMAGE_EXTENSIONS.has(extensionFromName);
  const hasLooseImageType =
    !mimeType ||
    mimeType === 'application/octet-stream' ||
    mimeType === 'binary/octet-stream';

  if (
    hasImageMime &&
    mimeType &&
    !Object.prototype.hasOwnProperty.call(EXTENSION_BY_MIME, mimeType)
  ) {
    return null;
  }

  if (!hasImageMime && !(hasLooseImageType && hasKnownImageExtension)) {
    return null;
  }

  const extension = hasKnownImageExtension
    ? extensionFromName
    : (extensionFromMime ?? 'img');

  return {
    extension,
    contentType:
      hasImageMime && mimeType
        ? mimeType
        : (MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'),
  };
}

function formatUploadBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateUploadedProductImage(file: File): {
  metadata?: { contentType: string; extension: string };
  error?: string;
} {
  const metadata = getUploadedImageMetadata(file);
  if (!metadata) {
    return { error: PRODUCT_IMAGE_FORMATS_MESSAGE };
  }

  if (file.size > MAX_UPLOADED_PRODUCT_IMAGE_BYTES) {
    return {
      error: `Cada foto debe pesar menos de ${formatUploadBytes(
        MAX_UPLOADED_PRODUCT_IMAGE_BYTES
      )} después de optimizarse.`,
    };
  }

  return { metadata };
}

export function validateUploadedProductImages(files: File[]): {
  error?: string;
} {
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_UPLOADED_PRODUCT_IMAGES_TOTAL_BYTES) {
    return {
      error: `Las fotos pesan ${formatUploadBytes(
        totalBytes
      )} en total. Probá con menos fotos o menor resolución.`,
    };
  }

  return {};
}
