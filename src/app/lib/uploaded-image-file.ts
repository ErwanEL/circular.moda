const IMAGE_EXTENSIONS = new Set([
  '3fr',
  'apng',
  'ari',
  'arw',
  'avif',
  'bay',
  'bmp',
  'cap',
  'cr2',
  'cr3',
  'dcr',
  'dng',
  'erf',
  'fff',
  'gif',
  'heic',
  'heif',
  'ico',
  'iiq',
  'jfif',
  'jp2',
  'jpe',
  'jpeg',
  'jpg',
  'jxl',
  'kdc',
  'mef',
  'mos',
  'mrw',
  'nef',
  'nrw',
  'orf',
  'pef',
  'png',
  'psd',
  'raf',
  'raw',
  'rw2',
  'rwl',
  'sr2',
  'srf',
  'srw',
  'svg',
  'tif',
  'tiff',
  'webp',
  'x3f',
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/apng': 'apng',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jp2': 'jp2',
  'image/jpeg': 'jpg',
  'image/jxl': 'jxl',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/tiff': 'tiff',
  'image/vnd.adobe.photoshop': 'psd',
  'image/vnd.microsoft.icon': 'ico',
  'image/webp': 'webp',
  'image/x-adobe-dng': 'dng',
  'image/x-canon-cr2': 'cr2',
  'image/x-canon-cr3': 'cr3',
  'image/x-icon': 'ico',
  'image/x-nikon-nef': 'nef',
  'image/x-olympus-orf': 'orf',
  'image/x-panasonic-raw': 'rw2',
  'image/x-pentax-pef': 'pef',
  'image/x-sony-arw': 'arw',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  apng: 'image/apng',
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  ico: 'image/x-icon',
  jfif: 'image/jpeg',
  jpe: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  jxl: 'image/jxl',
  png: 'image/png',
  svg: 'image/svg+xml',
  tif: 'image/tiff',
  tiff: 'image/tiff',
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
    extensionFromName != null && IMAGE_EXTENSIONS.has(extensionFromName);
  const hasLooseImageType =
    !mimeType ||
    mimeType === 'application/octet-stream' ||
    mimeType === 'binary/octet-stream';

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
