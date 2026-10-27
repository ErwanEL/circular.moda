import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeUsername,
  usernameError,
  normalizeInstagram,
  suggestUsername,
  sellerPath,
  parseSellerHandle,
} from './profile-identity.ts';

test('usernames normalize case and optional @ without silently rewriting identity', () => {
  assert.equal(normalizeUsername(' @MARIA-vintage '), 'maria-vintage');
  for (const value of [
    'ab',
    '-maria',
    'maria-',
    'maría',
    'maria.vintage',
    'a'.repeat(31),
    'admin',
    'api',
  ])
    assert.ok(usernameError(value), value);
  for (const value of ['maria-42', 'maria-vintage', 'a'.repeat(30)])
    assert.equal(usernameError(value), null);
});
test('Instagram accepts handles and profile URLs but never arbitrary redirect targets', () => {
  for (const input of [
    '@Maria.Vintage',
    'maria.vintage',
    'https://www.instagram.com/Maria.Vintage/?igsh=abc',
    'instagram.com/maria.vintage/',
  ])
    assert.equal(normalizeInstagram(input), 'maria.vintage');
  for (const input of [
    'https://evil.example/maria',
    'https://instagram.com.evil.example/maria',
    'https://instagram.com/p/abc',
    'maria..vintage',
    '.maria',
    'maria.',
    'a'.repeat(31),
    'https://instagram.com:123/maria',
  ])
    assert.equal(normalizeInstagram(input), null, input);
  assert.equal(normalizeInstagram(' '), '');
});
test('suggestions do not mutate links and remain valid Circular usernames', () => {
  assert.equal(suggestUsername('@maria.vintage'), 'maria-vintage');
  assert.equal(suggestUsername('maria_vintage'), 'maria-vintage');
  assert.equal(suggestUsername('admin'), '');
  assert.equal(suggestUsername('ab'), '');
  assert.equal(
    sellerPath({ id: 42, username: 'maria-vintage' }),
    '/@maria-vintage'
  );
  assert.equal(sellerPath({ id: 42 }), '/user/42');
});

test('public routes accept literal and URL-encoded @ without accepting malformed paths', () => {
  for (const value of ['@jose-1', '%40jose-1'])
    assert.equal(parseSellerHandle(value)?.username, 'jose-1');
  assert.deepEqual(parseSellerHandle('%40JOSE-1'), {
    handle: '@JOSE-1',
    username: 'jose-1',
  });
  for (const value of ['jose-1', '%2540jose-1', '%', '@a/b', '@admin'])
    assert.equal(parseSellerHandle(value), null);
});
