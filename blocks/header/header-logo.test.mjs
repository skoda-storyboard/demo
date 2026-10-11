/* eslint import/no-extraneous-dependencies: ["error", { "devDependencies": true }] */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const logoUrl = new URL('../../icons/skoda-storyboard-logo.svg', import.meta.url);
const { window } = new JSDOM(readFileSync(logoUrl, 'utf8'), { contentType: 'image/svg+xml' });
const svg = window.document.documentElement;
const paths = [...svg.querySelectorAll('path')];

// Source: https://www.skoda-storyboard.com/en/ (.brand a.logo svg), captured 2026-10-06.
// Independent DevTools SHA-256: UTF-8 JSON.stringify of ordered { d, fillRule, fill } records.
const SOURCE_ARTWORK_SHA256 = 'a81001bb89d20ea2ec13bc115d546a2de4a930737a2ac43939febed2313d9cac';

after(() => window.close());

test('header wordmark preserves the source viewBox and accessible name', () => {
  assert.equal(svg.localName, 'svg');
  assert.equal(svg.namespaceURI, 'http://www.w3.org/2000/svg');
  assert.equal(svg.getAttribute('viewBox'), '0 0 255.19 23.1');
  assert.equal(svg.getAttribute('role'), 'img');
  assert.equal(svg.getAttribute('aria-label'), 'Škoda Storyboard, home');
});

test('header wordmark preserves the exact seven original paths and fill rule', () => {
  assert.equal(paths.length, 7);
  assert.deepEqual([...svg.children].map((element) => element.localName), ['g', 'path']);
  assert.equal(svg.querySelector('g').children.length, 6);
  assert.deepEqual(paths.map((path) => path.getAttribute('fill-rule')), [
    null, null, null, 'evenodd', null, null, null,
  ]);
  const fingerprint = createHash('sha256')
    .update(JSON.stringify(paths.map((path) => ({
      d: path.getAttribute('d'),
      fillRule: path.getAttribute('fill-rule'),
      fill: path.closest('[fill]')?.getAttribute('fill'),
    }))))
    .digest('hex');
  assert.equal(fingerprint, SOURCE_ARTWORK_SHA256);
});

test('header wordmark is dark-green path artwork without fonts or external resources', () => {
  const elements = [svg, ...svg.querySelectorAll('*')];
  assert.deepEqual([...new Set(elements.map((element) => element.localName))], ['svg', 'g', 'path']);
  const allowedAttributes = {
    svg: ['xmlns', 'viewBox', 'role', 'aria-label'],
    g: ['fill'],
    path: ['d', 'fill', 'fill-rule'],
  };
  elements.forEach((element) => {
    assert.ok([...element.attributes].every(({ name }) => (
      allowedAttributes[element.localName].includes(name)
    )), `${element.localName} must not depend on styles, fonts or external resources`);
  });
  paths.forEach((path) => {
    assert.equal(path.closest('[fill]')?.getAttribute('fill'), '#0e3a2f');
  });
});
