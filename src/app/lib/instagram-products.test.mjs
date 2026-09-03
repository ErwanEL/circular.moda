import assert from 'node:assert/strict';
import test from 'node:test';

const instagramProducts = await import('./instagram-product-planning.ts');

test('buildInstagramCaption includes product URL and concise selling details', () => {
  const caption = instagramProducts.buildInstagramCaption({
    productName: 'Campera denim vintage',
    productUrl: 'https://circular.moda/products/campera-denim-abc',
    price: 18000,
    size: 'M',
    category: 'Camperas',
  });

  assert.match(caption, /Campera denim vintage/);
  assert.match(caption, /Link directo en bio/);
  assert.match(caption, /Detalle del producto:\nhttps:\/\/circular\.moda\/products\/campera-denim-abc/);
  assert.doesNotMatch(caption, /Si estás desde Instagram/);
  assert.match(caption, /Talle M/);
  assert.match(caption, /Campera denim vintage\n\n/);
  assert.ok(caption.length <= 2200);
});

test('selectInstagramProductCandidates skips unsafe products and returns eligible posts', () => {
  const rows = [
    {
      id: 1,
      name: 'Publicado',
      public_id: '11111111-1111-4111-8111-111111111111',
      stock: 1,
      images: ['https://example.com/one.jpg'],
      owner: 10,
    },
    {
      id: 2,
      name: 'Sin imagen',
      public_id: '22222222-2222-4222-8222-222222222222',
      stock: 1,
      images: [],
      owner: 10,
    },
    {
      id: 3,
      name: 'Vendida',
      public_id: '33333333-3333-4333-8333-333333333333',
      stock: 0,
      images: ['https://example.com/three.jpg'],
      owner: 10,
    },
    {
      id: 4,
      name: 'Remera circular',
      public_id: '44444444-4444-4444-8444-444444444444',
      price: 12000,
      size: 'S',
      category: 'Remeras',
      stock: 1,
      images: ['https://example.com/four.jpg'],
      owner: 10,
      featured: true,
      created_at: '2026-09-01T10:00:00.000Z',
    },
  ];

  const result = instagramProducts.selectInstagramProductCandidates({
    rows,
    publishedProductIds: new Set(['1']),
    sellerPhoneById: new Map([['10', '+541112345678']]),
    siteUrl: 'https://circular.moda',
    limit: 2,
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].productId, '4');
  assert.equal(
    result.candidates[0].productUrl,
    'https://circular.moda/products/remera-circular-44444444-4444-4444-8444-444444444444'
  );
  assert.equal(
    result.candidates[0].instagramImageUrl,
    'https://circular.moda/api/instagram/product-image/4'
  );
  assert.deepEqual(
    result.skipped.map((item) => item.reason),
    ['already_published_or_in_progress', 'missing_public_image', 'out_of_stock']
  );
});
