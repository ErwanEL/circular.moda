import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CABA_NEIGHBORHOODS,
  STOREFRONT_CITY,
  parseStorefront,
  splitStorefrontProducts,
} from './storefront.ts';
const valid = {
  boutique_name: ' Ana ',
  bio: '',
  city: 'Rosario',
  neighborhood: 'Palermo',
  pinned_product_ids: [2, 1],
};
test('storefront validates text and up to three distinct safe product IDs', () => {
  assert.deepEqual(parseStorefront(valid), {
    ...valid,
    boutique_name: 'Ana',
    city: STOREFRONT_CITY,
  });
  for (const ids of [
    [1, 1],
    [1, 2, 3, 4],
    ['1'],
    [null],
    [0],
    [-1],
    [1.5],
    [Number.MAX_SAFE_INTEGER + 1],
    null,
  ])
    assert.throws(() => parseStorefront({ ...valid, pinned_product_ids: ids }));
  for (const [key, value] of [
    ['bio', 'a'.repeat(301)],
    ['neighborhood', 'Olivos'],
    ['neighborhood', null],
    ['boutique_name', 'a'.repeat(61)],
    ['bio', null],
  ])
    assert.throws(() => parseStorefront({ ...valid, [key]: value }));
});
test('pins keep seller order, omit removed/foreign products, and do not repeat in catalogue', () => {
  const products = [{ id: '1' }, { id: '2' }, { id: '3' }];
  assert.deepEqual(splitStorefrontProducts(products, [2, 999, 1]), {
    pinned: [products[1], products[0]],
    rest: [products[2]],
  });
  assert.deepEqual(splitStorefrontProducts(products, []), {
    pinned: [],
    rest: products,
  });
});

test('CABA city is server controlled and every official neighborhood is accepted', () => {
  assert.equal(new Set(CABA_NEIGHBORHOODS).size, 48);
  for (const neighborhood of ['', ...CABA_NEIGHBORHOODS]) {
    const result = parseStorefront({ ...valid, city: 'Rosario', neighborhood });
    assert.equal(result.city, STOREFRONT_CITY);
    assert.equal(result.neighborhood, neighborhood);
  }
});
