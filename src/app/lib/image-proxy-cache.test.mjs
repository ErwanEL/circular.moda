import assert from 'node:assert/strict';
import test from 'node:test';
import { ImageMemoryCache, parseImageSize } from './image-proxy-cache.ts';

const payload = () => ({ body: Buffer.alloc(4), contentType: 'image/webp' });

test('allows the UI variants and rejects arbitrary or malformed resizing', () => {
  for (const args of [
    [null, null],
    ['300', null],
    [null, '800'],
    ['80', '80'],
  ]) {
    assert.ok(parseImageSize(...args));
  }
  for (const args of [
    ['100000', null],
    ['300junk', null],
    ['0', null],
    ['300', '800'],
    ['', null],
  ]) {
    assert.equal(parseImageSize(...args), null);
  }
});

test('shares simultaneous work and retains the binary result', async () => {
  const cache = new ImageMemoryCache(8, 1000);
  let calls = 0;
  const fetch = async () => {
    calls++;
    return payload();
  };
  const [a, b] = await Promise.all([
    cache.get('a', fetch),
    cache.get('a', fetch),
  ]);
  assert.equal(a, b);
  assert.equal(await cache.get('a', fetch), a);
  assert.equal(calls, 1);
});

test('evicts to its byte budget and does not retain expired results or failures', async () => {
  const cache = new ImageMemoryCache(4, 1000);
  let calls = 0;
  const fetch = async () => {
    calls++;
    return payload();
  };
  await cache.get('a', fetch);
  await cache.get('b', fetch);
  await cache.get('a', fetch);
  assert.equal(calls, 3);
  const expired = new ImageMemoryCache(4, 0);
  await expired.get('a', fetch);
  await expired.get('a', fetch);
  assert.equal(calls, 5);
  await assert.rejects(
    cache.get('error', async () => {
      throw new Error('upstream');
    })
  );
  assert.deepEqual(await cache.get('error', fetch), payload());
});

test('queues a gallery of images with at most four simultaneous conversions', async () => {
  const cache = new ImageMemoryCache(100, 1000);
  let active = 0;
  let peak = 0;
  await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      cache.get(String(index), async () => {
        peak = Math.max(peak, ++active);
        await new Promise((resolve) => setTimeout(resolve, 1));
        active--;
        return payload();
      })
    )
  );
  assert.equal(peak, 4);
});
