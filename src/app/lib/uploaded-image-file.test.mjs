import assert from 'node:assert/strict';
import test from 'node:test';

const { getUploadedImageMetadata, validateUploadedProductImage } = await import(
  './uploaded-image-file.ts'
);

test('rejects HEIC uploads when the browser sends no MIME type', () => {
  const metadata = getUploadedImageMetadata(new File(['x'], 'photo.HEIC'));

  assert.equal(metadata, null);
});

test('normalizes MIME-only image uploads to a safe image extension', () => {
  const metadata = getUploadedImageMetadata(
    new File(['x'], 'upload.tmp', { type: 'image/jpeg' })
  );

  assert.deepEqual(metadata, {
    contentType: 'image/jpeg',
    extension: 'jpg',
  });
});

test('accepts octet-stream images when the extension is a known image format', () => {
  const metadata = getUploadedImageMetadata(
    new File(['x'], 'listing.avif', { type: 'application/octet-stream' })
  );

  assert.deepEqual(metadata, {
    contentType: 'image/avif',
    extension: 'avif',
  });
});

test('rejects non-image uploads', () => {
  const metadata = getUploadedImageMetadata(
    new File(['x'], 'invoice.pdf', { type: 'application/pdf' })
  );

  assert.equal(metadata, null);
});

test('rejects unsupported image MIME types even with image prefix', () => {
  const metadata = getUploadedImageMetadata(
    new File(['x'], 'scan.tiff', { type: 'image/tiff' })
  );

  assert.equal(metadata, null);
});

test('rejects product images over the server-side size limit', () => {
  const file = new File([new Uint8Array(901_000)], 'large.jpg', {
    type: 'image/jpeg',
  });

  const validation = validateUploadedProductImage(file);

  assert.match(validation.error ?? '', /Cada foto debe pesar menos/);
});
