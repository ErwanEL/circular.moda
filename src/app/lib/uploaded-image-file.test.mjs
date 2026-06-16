import assert from 'node:assert/strict';
import test from 'node:test';

const { getUploadedImageMetadata } = await import('./uploaded-image-file.ts');

test('accepts HEIC uploads when the browser sends no MIME type', () => {
  const metadata = getUploadedImageMetadata(new File(['x'], 'photo.HEIC'));

  assert.deepEqual(metadata, {
    contentType: 'image/heic',
    extension: 'heic',
  });
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
