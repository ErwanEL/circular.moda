import assert from 'node:assert/strict';
import test from 'node:test';

const {
  BOOST_OFFER,
  PREMIUM_OFFER,
  getDefaultOfferForFeature,
  isMonetizationFeature,
  isMonetizationSource,
} = await import('./monetization-interest.ts');

test('validates known monetization interest values', () => {
  assert.equal(isMonetizationFeature('boost'), true);
  assert.equal(isMonetizationFeature('stats'), true);
  assert.equal(isMonetizationFeature('unknown'), false);
  assert.equal(isMonetizationSource('me_product_card'), true);
  assert.equal(isMonetizationSource('catalogue'), false);
});

test('maps interest features to the current single offers', () => {
  assert.equal(getDefaultOfferForFeature('boost').id, BOOST_OFFER.id);
  assert.equal(getDefaultOfferForFeature('plus').id, PREMIUM_OFFER.id);
  assert.equal(
    getDefaultOfferForFeature('photo_optimization').id,
    PREMIUM_OFFER.id
  );
});
