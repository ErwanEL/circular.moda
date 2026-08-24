import assert from 'node:assert/strict';
import test from 'node:test';

const { getUploadApiErrorMessage, readUploadApiResponse } = await import(
  './client-upload.ts'
);

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
