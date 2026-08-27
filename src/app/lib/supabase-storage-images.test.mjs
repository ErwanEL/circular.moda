import assert from 'node:assert/strict';
import test from 'node:test';

const { getRemovedStorageObjectPaths, getStorageObjectPathFromPublicUrl } =
  await import('./supabase-storage-images.ts');

test('extracts product object path from a Supabase public storage URL', () => {
  const path = getStorageObjectPathFromPublicUrl(
    'https://example.supabase.co/storage/v1/object/public/storage/products/item-1.jpg'
  );

  assert.equal(path, 'products/item-1.jpg');
});

test('ignores non-product public storage URLs', () => {
  const path = getStorageObjectPathFromPublicUrl(
    'https://example.supabase.co/storage/v1/object/public/storage/avatars/user.jpg'
  );

  assert.equal(path, null);
});

test('returns only storage paths that are no longer referenced', () => {
  const removed = getRemovedStorageObjectPaths(
    [
      'https://example.supabase.co/storage/v1/object/public/storage/products/a.jpg',
      'https://example.supabase.co/storage/v1/object/public/storage/products/b.jpg',
      'https://cdn.example.com/external.jpg',
    ],
    [
      'https://example.supabase.co/storage/v1/object/public/storage/products/b.jpg',
    ]
  );

  assert.deepEqual(removed, ['products/a.jpg']);
});
