/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
/*
 * Migration status block tests (SKODA-603).
 * Run: node --test blocks/migration-status/migration-status.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

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
  row('Home', 'Škoda Storyboard', '/en', 'live'),
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
  assert.deepEqual(total, { pages: 5, live: 4 });
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
  assert.deepEqual(items.map((li) => li.querySelector('.migration-status-title').textContent), ['Images', 'Peaq press kit', 'Mixed reality']);
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

test('the finder filters rows, opens matching groups and announces the count', () => {
  const el = block();
  render(el, ROWS);
  const input = el.querySelector('#migration-status-find');
  assert.equal(el.querySelector('label[for="migration-status-find"]').textContent, 'Find a page');
  input.value = 'images';
  input.dispatchEvent(new window.Event('input'));
  const groups = [...el.querySelectorAll('details')];
  assert.deepEqual(groups.map((d) => [d.hidden, d.open]), [[true, false], [false, true], [true, false]]);
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
