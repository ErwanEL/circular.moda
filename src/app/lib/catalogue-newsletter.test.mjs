import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NEWSLETTER_TOKEN_SECRET = 'newsletter-test-secret';

const newsletter = await import('./catalogue-newsletter.ts');

test('normalizeSubscriberEmail lowercases and trims emails', () => {
  assert.equal(
    newsletter.normalizeSubscriberEmail('  USER@Example.COM  '),
    'user@example.com'
  );
});

test('normalizeSubscriberEmail rejects invalid emails', () => {
  assert.equal(newsletter.normalizeSubscriberEmail('not-an-email'), null);
});

test('calculateNextMonthlySendAt keeps same calendar day when possible', () => {
  const nextSendAt = newsletter.calculateNextMonthlySendAt(
    new Date('2026-05-12T16:45:00.000Z')
  );

  assert.equal(nextSendAt.toISOString(), '2026-06-12T13:00:00.000Z');
});

test('calculateNextMonthlySendAt clamps to last day of next month', () => {
  const nextSendAt = newsletter.calculateNextMonthlySendAt(
    new Date('2026-01-31T22:15:00.000Z')
  );

  assert.equal(nextSendAt.toISOString(), '2026-02-28T13:00:00.000Z');
});

test('unsubscribe token roundtrip returns normalized email', () => {
  const token = newsletter.createUnsubscribeToken('Person@Example.com');
  assert.equal(newsletter.parseUnsubscribeToken(token), 'person@example.com');
});
