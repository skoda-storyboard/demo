/* global globalThis */
/*
 * Unit tests for the SKODA-217 homepage social-cards parser (Cards (social)).
 * Fixture mirrors the live /en/ .socials-static markup (measured 2026-09-25).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  const req = createRequire(import.meta.url);
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = req('jsdom'));
} catch { /* jsdom unavailable — DOM tests skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

// Minimal createTable stub — plain-array cells only (the helix-importer contract).
globalThis.WebImporter = {
  DOMUtils: {
    createTable(cells, document) {
      const table = document.createElement('table');
      const [[blockName]] = cells;
      table.dataset.block = blockName;
      cells.slice(1).forEach((row) => {
        const tr = document.createElement('tr');
        row.forEach((col) => {
          const td = document.createElement('td');
          (Array.isArray(col) ? col : [col]).forEach((v) => { if (v != null) td.append(v); });
          tr.append(td);
        });
        table.append(tr);
      });
      return table;
    },
  },
};

const { default: parse } = await import('./social-cards.js');

const item = (href, handle) => `<div class="search-results-item"><article class="article-teaser">
  <a class="article-teaser-media" href="${href}" target="_blank"><div class="article-teaser-overlay">
    <svg viewBox="0 0 242.667 242.667"><path d="M0,0z"></path></svg><h3 class="entry-title">${handle}</h3>
  </div></a></article></div>`;
const BAND = `<main><div class="cover-box">before</div>
  <div class="cover-box dark socials-static"><div class="search-results type-post type-social">
    <div class="search-results-container"><header class="search-results-header">
      <h3 class="search-results-heading">Social media</h3></header>
      <div class="search-results-items">
        ${item('https://www.facebook.com/skodaglobal/', '@skodaglobal')}
        ${item('https://www.instagram.com/skodagram/', '@skodagram')}
        ${item('https://www.youtube.com/@skoda', '@skoda')}
      </div></div></div></div>
  <div class="cover-box">after</div></main>`;

const run = (html) => {
  const { document } = new JSDOM(html).window;
  parse(document.querySelector('.socials-static'), { document });
  return document;
};

test('the social band becomes its own dark section: hr, heading, Cards (social), Section Metadata, hr', { skip }, () => {
  const doc = run(BAND);
  const kids = [...doc.querySelector('main').children].map((el) => el.tagName.toLowerCase() + (el.dataset?.block ? `:${el.dataset.block}` : ''));
  assert.deepEqual(kids, ['div', 'hr', 'h2', 'table:Cards (social)', 'table:Section Metadata', 'hr', 'div']);
  assert.equal(doc.querySelector('h2').textContent, 'Social media');
  const meta = [...doc.querySelector('table[data-block="Section Metadata"] tr').children].map((td) => td.textContent);
  assert.deepEqual(meta, ['Style', 'dark']);
  assert.ok(!doc.querySelector('.socials-static'), 'source band replaced');
});

test('one row per profile, in source order, each a link whose text is the handle', { skip }, () => {
  const rows = [...run(BAND).querySelectorAll('table[data-block="Cards (social)"] tr')].map((tr) => {
    const a = tr.querySelector('a');
    return [a.getAttribute('href'), a.textContent, tr.querySelectorAll('td').length];
  });
  assert.deepEqual(rows, [
    ['https://www.facebook.com/skodaglobal/', '@skodaglobal', 1],
    ['https://www.instagram.com/skodagram/', '@skodagram', 1],
    ['https://www.youtube.com/@skoda', '@skoda', 1],
  ]);
});

test('an item linking the same profile twice (media + title) is still one card', { skip }, () => {
  const twice = BAND.replace(
    '<h3 class="entry-title">@skodagram</h3>',
    '<h3 class="entry-title">@skodagram</h3></div></a><a href="https://www.instagram.com/skodagram/">@skodagram<div>',
  );
  const hrefs = [...run(twice).querySelectorAll('table a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(hrefs, [
    'https://www.facebook.com/skodaglobal/', 'https://www.instagram.com/skodagram/', 'https://www.youtube.com/@skoda',
  ]);
});

test('the source icon is not imported (the block draws it from the host)', { skip }, () => {
  const doc = run(BAND);
  assert.equal(doc.querySelectorAll('table svg, table img').length, 0);
});

test('a band without profile links is left for the shared cleanup', { skip }, () => {
  const doc = run('<main><div class="cover-box dark socials-static"><h3 class="search-results-heading">Social media</h3></div></main>');
  assert.ok(doc.querySelector('.socials-static'), 'untouched');
  assert.equal(doc.querySelectorAll('table').length, 0);
});
