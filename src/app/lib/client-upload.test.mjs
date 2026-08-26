import assert from 'node:assert/strict';
import test from 'node:test';

const {
  MAX_PRODUCT_IMAGE_COUNT,
  getUploadApiErrorMessage,
  getUploadExceptionMessage,
  prepareProductImagesForUpload,
  readUploadApiResponse,
} = await import('./client-upload.ts');

test('reads JSON upload API errors', async () => {
  const response = new Response(JSON.stringify({ error: 'Error esperado' }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });

  const data = await readUploadApiResponse(response);

  assert.equal(getUploadApiErrorMessage(data, 'Fallback'), 'Error esperado');
});

test('turns plain text payload errors into a user friendly message', async () => {
  const response = new Response('Request Entity Too Large', { status: 413 });

  await assert.rejects(
    () => readUploadApiResponse(response),
    /Las fotos son demasiado pesadas/
  );
});

test('falls back when an upload API error has no JSON body', async () => {
  const response = new Response('', { status: 500 });

  const data = await readUploadApiResponse(response);

  assert.equal(getUploadApiErrorMessage(data, 'Fallback'), 'Fallback');
});

test('rejects too many product images before upload', async () => {
  const files = Array.from(
    { length: MAX_PRODUCT_IMAGE_COUNT + 1 },
    (_, index) => new File(['x'], `image-${index}.jpg`, { type: 'image/jpeg' })
  );

  await assert.rejects(
    () => prepareProductImagesForUpload(files),
    /Podés subir hasta 5 fotos/
  );
});

test('turns generic network errors into actionable upload guidance', () => {
  assert.equal(
    getUploadExceptionMessage(new Error('Failed to fetch')),
    'No pudimos publicar la prenda. Probá con 3 fotos primero, o escribinos por WhatsApp y te ayudamos.'
  );
});
