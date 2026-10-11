/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
/*
 * Migration status block tests (SKODA-603).
 * Run: node --test blocks/migration-status/migration-status.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { decorateLinks, installLinkPolicy, DEMO_LISTINGS } from '../../scripts/links.js';

const boot = new JSDOM('', { url: 'https://example.com/drafts/migration-status' });
globalThis.window = boot.window;
globalThis.document = boot.window.document;
const {
  default: decorate, render, summarize, formatChecked,
} = await import('./migration-status.js');

const SRC = 'https://www.skoda-storyboard.com';
const NEW = 'https://main--demo--skoda-storyboard.aem.live';
const row = (type, title, p, status, extra = {}) => ({
  Type: type,
  Kind: 'page',
  Title: title,
  Source: `${SRC}${p}/`,
  Migrated: `${NEW}${p}`,
  Status: status,
  QA: '',
  Note: '',
  Checked: '2026-09-30 13:21 UTC',
  ...extra,
});
const ROWS = [
  row('Home', 'Škoda Storyboard', '/en', 'live', { Note: 'Live on an earlier import.' }),
  row('Press kits', 'Peaq – Press Kit', '/en/press-kits/peaq-2', 'live'),
  row('Press kits', 'Images', '/en/press-kits/peaq-2/images', 'held', { Note: 'Not published: 230 images, over the platform limit of 200 per page.' }),
  row('Press kits', 'Peaq press kit', '/en/press-kits/peaq', 'redirect', { Note: 'Redirects to /en/press-kits/peaq-2' }),
  row('Stories', 'Mixed reality', '/en/x/mixed-reality', 'redirect', { Kind: 'alias', Note: 'Redirects to /en/mixed-reality' }),
  row('Stories', 'Mixed reality', '/en/mixed-reality', 'live'),
];

function block() {
  const dom = new JSDOM('<div class="migration-status"></div>', { url: 'https://example.com/drafts/migration-status' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  return dom.window.document.querySelector('.migration-status');
}

test('counts pages per type; redirects count as live, aliases are listed but not counted', () => {
  const { types, total } = summarize(ROWS);
  assert.deepEqual(total, {
    pages: 5, live: 4, demo: 0, demoLive: 0,
  });
  assert.deepEqual(types.map((t) => [t.type, t.live, t.pages, t.rows.length]), [
    ['Home', 1, 1, 1], ['Press kits', 2, 3, 3], ['Stories', 1, 1, 2],
  ]);
});

test('the headline, check time and per-type cards lead the page', () => {
  const el = block();
  render(el, ROWS);
  assert.equal(el.querySelector('.migration-status-headline').textContent, '4 of 5 pilot pages are live');
  assert.equal(el.querySelector('.migration-status-checked').textContent, 'Checked 30 Sep 2026, 13:21 UTC');
  const cards = [...el.querySelectorAll('.migration-status-types li')];
  assert.deepEqual(cards.map((li) => li.textContent), ['Home1 of 1 live', 'Press kits2 of 3 live', 'Stories1 of 1 live']);
  assert.ok(cards[1].classList.contains('incomplete'));
  assert.equal(cards[1].querySelector('.migration-status-bar').style.getPropertyValue('--migration-status-share'), String(2 / 3));
});

test('needs attention lists only the exceptions, in plain words, with both links', () => {
  const el = block();
  render(el, ROWS);
  const items = [...el.querySelectorAll('.migration-status-attention li')];
  assert.deepEqual(items.map((li) => li.querySelector('.migration-status-title').textContent), ['Images', 'Peaq press kit', 'Mixed reality', 'Škoda Storyboard'], 'held first, live-with-a-note last');
  assert.match(items[0].textContent, /over the platform limit of 200/);
  const [src, dst] = items[0].querySelectorAll('a');
  assert.equal(src.href, `${SRC}/en/press-kits/peaq-2/images/`);
  assert.equal(dst.href, `${NEW}/en/press-kits/peaq-2/images`);
  assert.equal(dst.target, '_blank');
  assert.match(dst.getAttribute('aria-label'), /opens in a new tab/);
});

test('every page is in a collapsed per-type table with a caption and row headers', () => {
  const el = block();
  render(el, ROWS);
  const groups = [...el.querySelectorAll('details.migration-status-group')];
  assert.equal(groups.length, 3);
  assert.ok(groups.every((d) => !d.open));
  assert.equal(groups[1].querySelector('caption').textContent, 'Press kits: 2 of 3 pages live');
  assert.equal(el.querySelectorAll('tbody tr').length, ROWS.length);
  assert.equal(el.querySelectorAll('tbody th[scope="row"]').length, ROWS.length);
  assert.match(groups[2].querySelector('tbody tr th').textContent, /\(old address\)/);
});

test('source and new-site links keep their sheet URLs despite the demo link policy', () => {
  const rows = [...DEMO_LISTINGS].map((p) => row('Listings', p, p, 'live', {
    Source: `${SRC}${p}/?model=peaq#gallery`,
    Migrated: `${NEW}${p}?model=peaq#gallery`,
    Note: 'Compare both sites.',
  }));
  const el = block();
  render(el, rows);
  const sources = [...el.querySelectorAll('a[aria-label*="on the source site"]')];
  const migrated = [...el.querySelectorAll('a[aria-label*="on the new site"]')];
  const sourceHrefs = rows.map((r) => r.Source);
  const migratedHrefs = rows.map((r) => r.Migrated);

  decorateLinks(el);
  decorateLinks(el);
  assert.deepEqual(sources.map((a) => a.href), [...sourceHrefs, ...sourceHrefs]);
  assert.deepEqual(migrated.map((a) => a.href), [...migratedHrefs, ...migratedHrefs]);

  installLinkPolicy(document);
  document.addEventListener('click', (event) => event.preventDefault());
  [...sources, ...migrated].forEach((a) => {
    a.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  assert.deepEqual(sources.map((a) => a.href), [...sourceHrefs, ...sourceHrefs]);
  assert.deepEqual(migrated.map((a) => a.href), [...migratedHrefs, ...migratedHrefs]);
  assert.ok([...sources, ...migrated].every((a) => (
    a.target === '_blank' && a.rel === 'noopener noreferrer'
  )));
});

test('the finder filters rows, opens matching groups and announces the count', () => {
  const el = block();
  render(el, ROWS);
  const input = el.querySelector('#migration-status-find');
  assert.equal(el.querySelector('label[for="migration-status-find"]').textContent, 'Find a page');
  input.value = 'images';
  input.dispatchEvent(new window.Event('input'));
  const groups = [...el.querySelectorAll('details')];
  assert.deepEqual(
    groups.map((d) => [d.hidden, d.open]),
    [[true, false], [false, true], [true, false]],
  );
  assert.equal(groups[1].querySelectorAll('tbody tr:not([hidden])').length, 1);
  assert.equal(el.querySelector('.migration-status-found').textContent, '1 page found');
  input.value = '';
  input.dispatchEvent(new window.Event('input'));
  assert.equal(el.querySelectorAll('tbody tr[hidden]').length, 0);
  assert.equal(el.querySelector('.migration-status-found').textContent, '');
});

test('decorate reads the source row and fetches the sheet; errors are shown, not thrown', async () => {
  const el = block();
  el.innerHTML = '<div><div>source</div><div>/drafts/migration-status-data.json</div></div>';
  let asked;
  globalThis.fetch = async (url) => {
    asked = String(url);
    return { ok: true, json: async () => ({ data: ROWS }) };
  };
  await decorate(el);
  assert.equal(asked, 'https://example.com/drafts/migration-status-data.json?limit=5000');
  assert.ok(el.querySelector('.migration-status-headline'));

  const broken = block();
  broken.innerHTML = '<div><div>source</div><div>/drafts/missing.json</div></div>';
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  await decorate(broken);
  assert.match(broken.textContent, /could not be loaded \(HTTP 404\)/);
});

test('formatChecked keeps unknown formats as they are', () => {
  assert.equal(formatChecked('2026-09-30 13:21 UTC'), '30 Sep 2026, 13:21 UTC');
  assert.equal(formatChecked('today'), 'today');
});

test('demo pages carry a star, a legend line, per-type counts, and "demo" finds them', () => {
  const rows = ROWS.map((r, i) => ({ ...r, Demo: [0, 1, 2, 4].includes(i) ? 'yes' : '' }));
  const el = block();
  render(el, rows);
  assert.equal(
    el.querySelector('.migration-status-demo').textContent,
    '⭐ 2 of 3 demo pages are live. The star marks the pages asked for in the demo; the others are press-kit chapters and the pages that feed its rails and listings.',
  );
  const stars = [...el.querySelectorAll('tbody th .migration-status-star')];
  assert.equal(stars.length, 4, 'one star per demo row (the alias too)');
  assert.equal(stars[0].getAttribute('aria-label'), 'Demo page');
  const kits = [...el.querySelectorAll('.migration-status-types li')][1];
  assert.match(kits.textContent, /⭐ 1 of 2 demo pages live/);
  const [held] = el.querySelectorAll('.migration-status-attention li');
  assert.ok(held.querySelector('.migration-status-title .migration-status-star'), 'starred in Needs attention');
  const input = el.querySelector('#migration-status-find');
  input.value = 'demo';
  input.dispatchEvent(new window.Event('input'));
  assert.equal(el.querySelector('.migration-status-found').textContent, '4 pages found');
});
