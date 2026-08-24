const TARGET_IMAGE_BYTES = 650_000;
const MAX_UPLOAD_BODY_BYTES = 3_800_000;

const PAYLOAD_TOO_LARGE_MESSAGE =
  'Las fotos son demasiado pesadas para publicarlas juntas. Probá con menos fotos o sacalas con menor resolución.';

const COMPRESSIBLE_IMAGE_EXTENSIONS = new Set([
  'avif',
  'bmp',
  'jpeg',
  'jpg',
  'png',
  'webp',
]);

const COMPRESSION_ATTEMPTS = [
  { maxDimension: 1600, quality: 0.82 },
  { maxDimension: 1400, quality: 0.78 },
  { maxDimension: 1200, quality: 0.74 },
  { maxDimension: 1000, quality: 0.7 },
];

type UploadApiResponse = {
  error?: unknown;
  [key: string]: unknown;
};

function getFileExtension(name: string) {
  const lastDot = name.lastIndexOf('.');
  if (lastDot < 0 || lastDot === name.length - 1) return null;
  const extension = name.slice(lastDot + 1).toLowerCase();
  return extension.replace(/[^a-z0-9]/g, '') || null;
}

function getBaseFileName(name: string) {
  const withoutExtension = name.replace(/\.[^.]+$/, '').trim();
  return withoutExtension || 'imagen';
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canCompressInBrowser(file: File) {
  if (typeof document === 'undefined') return false;

  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  if (mimeType === 'image/svg+xml') return false;
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return false;
  if (extension === 'svg' || extension === 'heic' || extension === 'heif') {
    return false;
  }

  if (mimeType.startsWith('image/')) return true;

  const hasLooseMime =
    !mimeType ||
    mimeType === 'application/octet-stream' ||
    mimeType === 'binary/octet-stream';

  return (
    hasLooseMime &&
    extension != null &&
    COMPRESSIBLE_IMAGE_EXTENSIONS.has(extension)
  );
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
}

async function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo preparar una imagen para subirla.'));
    };
    image.src = url;
  });
}

async function loadDrawableImage(file: File) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      return loadImageElement(file);
    }
  }

  return loadImageElement(file);
}

async function createCompressedJpeg(
  source: CanvasImageSource & { width: number; height: number },
  maxDimension: number,
  quality: number
) {
  const scale = Math.min(
    1,
    maxDimension / Math.max(source.width, source.height)
  );
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  if (!context) return null;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return canvasToJpegBlob(canvas, quality);
}

async function compressImageForUpload(file: File) {
  if (!canCompressInBrowser(file)) return file;

  const source = await loadDrawableImage(file);
  let bestBlob: Blob | null = null;

  for (const attempt of COMPRESSION_ATTEMPTS) {
    const blob = await createCompressedJpeg(
      source,
      attempt.maxDimension,
      attempt.quality
    );
    if (!blob) continue;

    bestBlob = !bestBlob || blob.size < bestBlob.size ? blob : bestBlob;
    if (blob.size <= TARGET_IMAGE_BYTES) break;
  }

  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }

  if (!bestBlob) return file;

  if (bestBlob.size >= file.size && file.size <= MAX_UPLOAD_BODY_BYTES) {
    return file;
  }

  return new File([bestBlob], `${getBaseFileName(file.name)}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}

export async function prepareProductImagesForUpload(files: File[]) {
  const preparedFiles = await Promise.all(
    files.map(async (file) => {
      try {
        return await compressImageForUpload(file);
      } catch (error) {
        console.warn('[Upload] Image preparation failed:', error);
        return file;
      }
    })
  );

  const totalBytes = preparedFiles.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_UPLOAD_BODY_BYTES) {
    throw new Error(
      `${PAYLOAD_TOO_LARGE_MESSAGE} Peso actual: ${formatBytes(totalBytes)}.`
    );
  }

  return preparedFiles;
}

function getNonJsonUploadError(response: Response, responseText: string) {
  const text = responseText.trim();
  const normalized = text.toLowerCase();

  if (
    response.status === 413 ||
    normalized.includes('request entity too large') ||
    normalized.includes('payload too large')
  ) {
    return PAYLOAD_TOO_LARGE_MESSAGE;
  }

  if (response.ok) {
    return 'El servidor respondió en un formato inesperado. Probá de nuevo.';
  }

  return text || 'No se pudo completar la publicación. Probá de nuevo.';
}

export async function readUploadApiResponse<T extends UploadApiResponse>(
  response: Response
): Promise<T> {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(getNonJsonUploadError(response, responseText));
  }
}

export function getUploadApiErrorMessage(
  data: UploadApiResponse,
  fallbackMessage: string
) {
  return typeof data.error === 'string' && data.error.trim()
    ? data.error
    : fallbackMessage;
}
