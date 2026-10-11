/*
 * Unit tests for iconsReady, the header / footer wait for their icon images (SKODA-308).
 * Run: node --test scripts/icons-ready.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import iconsReady from './icons-ready.js';

// a stand-in for the decorated block: `.icon img` images with a controllable decode()
const block = (...decodes) => {
  const imgs = decodes.map((decode) => ({ loading: 'lazy', decode }));
  return { imgs, querySelectorAll: (sel) => (sel === '.icon img' ? imgs : []) };
};

test('starts the lazy icons loading and resolves once they are decoded', async () => {
  let done = 0;
  const root = block(async () => { done += 1; }, async () => { done += 1; });
  await iconsReady(root, 5000);
  assert.equal(done, 2);
  assert.deepEqual(root.imgs.map((i) => i.loading), ['eager', 'eager']);
});

test('never waits longer than its cap for an icon that does not decode', async () => {
  const root = block(() => new Promise(() => {}));
  const start = Date.now();
  await iconsReady(root, 30);
  assert.ok(Date.now() - start < 1000);
});

test('a failed icon or no decode() support does not hold the block back', async () => {
  await iconsReady(block(() => Promise.reject(new Error('404')), undefined), 5000);
  await iconsReady(block(), 5000); // no icons at all
});
