/*
 * The library's block samples keep what a block needs to show (PR #483 review): App Promo's
 * five parts (each row its own part) with both store links; a Brand Asset logo row of three.
 * Fixture: test/fixtures/company-pages/app-promo.plain.html, the block as imported.
 * Run: node --test tools/library/build-library-samples.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rows, sampleFor } from './build-library.mjs';

const fixture = readFileSync(new URL('../../test/fixtures/company-pages/app-promo.plain.html', import.meta.url), 'utf8');

test('the App Promo sample keeps all five rows and both store links', () => {
  const sample = sampleFor([fixture], 'app-promo', '');
  assert.ok(sample, 'a sample from the imported block');
  assert.equal(rows(sample.html).length, 5);
  assert.match(sample.html, /href="https:\/\/apps\.apple\.com\//);
  assert.match(sample.html, /href="https:\/\/play\.google\.com\//);
});

test('the Brand Asset sample keeps a row of three tiles', () => {
  const tile = (n) => `<div><div><p><picture><img src="./logo-${n}.png" alt="Logo ${n}"></picture></p><p><strong><a href="https://www.skoda-storyboard.com/direct-download/2023/07/logo-${n}.pdf">PDF download</a></strong></p></div></div>`;
  const page = `<div><div class="brand-asset">${[1, 2, 3].map(tile).join('')}</div></div>`;
  assert.equal(rows(sampleFor([page], 'brand-asset', '').html).length, 3);
});
