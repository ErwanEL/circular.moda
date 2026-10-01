import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getInstallPlatform,
  isIosDevice,
  isSafariBrowser,
} from './pwa-install.ts';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';

test('detects iPhone and touch-enabled iPadOS user agents', () => {
  assert.equal(isIosDevice(IPHONE_SAFARI), true);
  assert.equal(isIosDevice('Desktop-style iPad', 'MacIntel', 5), true);
  assert.equal(isIosDevice(ANDROID_CHROME, 'Linux armv8l', 5), false);
});

test('distinguishes Safari from other iOS browsers', () => {
  assert.equal(isSafariBrowser(IPHONE_SAFARI), true);
  assert.equal(isSafariBrowser(IPHONE_CHROME), false);
  assert.equal(getInstallPlatform(IPHONE_SAFARI), 'ios-safari');
  assert.equal(getInstallPlatform(IPHONE_CHROME), 'ios-other');
  assert.equal(getInstallPlatform(ANDROID_CHROME), 'other');
});
