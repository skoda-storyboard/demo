/* global globalThis */
/*
 * Unit tests for skoda-links (SKODA-605): source-host links to demo pages become
 * site-relative; everything else keeps its href. Plus a drift guard for the generated
 * allow-list block.
 * Run: node --test tools/importer/transformers/skoda-links.test.mjs
 *
 * jsdom is resolved like skoda-page-cleanup.test.mjs; the DOM tests skip cleanly if it
 * is unavailable. The drift test needs no DOM.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildAllowlist, readLists, renderInto, renderPublished, previewedPaths, TARGET,
} from '../build-link-allowlist.mjs';

let JSDOM = null;
try {
  const req = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/hooks/import-validator/');
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = req('jsdom'));
} catch {
  try {
    const req = createRequire(import.meta.url);
    // eslint-disable-next-line import/no-unresolved
    ({ JSDOM } = req('jsdom'));
  } catch { /* jsdom unavailable — skip */ }
}
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

globalThis.WebImporter = { DOMUtils: { remove() {} } };

const { default: transform } = await import('./skoda-links.js');

const SRC = 'https://www.skoda-storyboard.com';
const STORY = '/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds';

function run(html, hook = 'afterTransform') {
  const dom = new JSDOM(`<body>${html}</body>`);
  globalThis.document = dom.window.document;
  const el = dom.window.document.body;
  transform(hook, el, {});
  return el;
}
const hrefs = (el) => [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
const one = (href) => hrefs(run(`<a href="${href}">x</a>`))[0];

test('demo-page link becomes site-relative without the trailing slash', { skip }, () => {
  assert.equal(one(`${SRC}${STORY}/`), STORY);
  assert.equal(one(`${SRC}/en/`), '/en');
  assert.equal(one(`${SRC}/en/videos/`), '/en/videos');
  assert.equal(one(`${SRC}/en/skoda-model/peaq/`), '/en/skoda-model/peaq');
});

test('query and hash are kept byte-for-byte', { skip }, () => {
  assert.equal(one(`${SRC}/en/images/?filter%5Bmodel%5D%5B%5D=peaq#grid`), '/en/images?filter%5Bmodel%5D%5B%5D=peaq#grid');
  assert.equal(one(`${SRC}${STORY}#comments`), `${STORY}#comments`);
});

test('http, apex, protocol-relative and uppercase host variants are rewritten', { skip }, () => {
  assert.equal(one(`http://www.skoda-storyboard.com${STORY}/`), STORY);
  assert.equal(one(`https://skoda-storyboard.com${STORY}/`), STORY);
  assert.equal(one(`//www.skoda-storyboard.com${STORY}/`), STORY);
  assert.equal(one(`HTTPS://WWW.SKODA-STORYBOARD.COM${STORY.toUpperCase()}/`), STORY);
});

test('the mixed-reality alias goes straight to its canonical', { skip }, () => {
  assert.equal(
    one(`${SRC}/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality/`),
    '/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality',
  );
});

test('source-host links outside the demo stay absolute (D-3 (b))', { skip }, () => {
  [
    `${SRC}/en/tag/model/yeti/`, // a tag archive that isn't imported
    `${SRC}/en/category/podcast/`, // 404 on the source, not an archive page here
    `${SRC}/en/news/?filter%5Bvip%5D%5B%5D=jahn`, // no demo tag page for the term (607 rule 4)
    `${SRC}/en/lifestyle/explore-albania/`, // a story that isn't imported
    `${SRC}/?attachment_id=454117`,
    `${SRC}/en/?p=312022`, // WordPress post-id shortlink, not the /en page (SKODA-207)
    `${SRC}/en/?page_id=105035`,
    `${SRC}/`,
    `${SRC}/cs/`,
  ].forEach((href) => assert.equal(one(href), href));
});

test('cdn, external, mailto, tel, anchors and relative links are untouched', { skip }, () => {
  [
    'https://cdn.skoda-storyboard.com/2026/08/release_fd432da8.pdf',
    'https://www.skoda-storyboard.com.example.org/en/',
    'https://www.youtube.com/watch?v=1Y3QHmZeLxk',
    'mailto:press@skoda-auto.cz',
    'tel:+420326811111',
    '#subscribe',
    '/en/tag/model/fabia',
    '',
  ].forEach((href) => assert.equal(one(href), href));
});

test('/direct-download/ links point at the live source', { skip }, () => {
  assert.equal(one('/direct-download/2026/08/zellmer_1a2b3c4d.jpg'), `${SRC}/direct-download/2026/08/zellmer_1a2b3c4d.jpg`);
});

test('#s_aid / #s_cid fragments are stripped, then the link is rewritten', { skip }, () => {
  assert.equal(one('https://cdn.skoda-storyboard.com/2024/10/TD-Elroq-en_new_7a3c9a44.pdf#s_aid=AbC123'), 'https://cdn.skoda-storyboard.com/2024/10/TD-Elroq-en_new_7a3c9a44.pdf');
  assert.equal(one(`${SRC}${STORY}/#s_cid=xyz`), STORY);
});

test('a scheme-less source link is the source page, raw or resolved against the page (rule 5)', { skip }, () => {
  const KIT = '/en/press-kits/classic-days-2026-press-kit';
  const OCTAVIA = `${KIT}/skoda-octavia-turns-30-three-decades-of-a-brand-icon`;
  assert.equal(one(`skoda-storyboard.com${OCTAVIA}/`), OCTAVIA);
  assert.equal(one(`www.skoda-storyboard.com${OCTAVIA}/`), OCTAVIA);
  assert.equal(one(`${SRC}${KIT}/skoda-storyboard.com${OCTAVIA}/`), OCTAVIA);
  // not on the demo: the source URL, absolute
  assert.equal(one('skoda-storyboard.com/en/lifestyle/explore-albania/'), `${SRC}/en/lifestyle/explore-albania/`);
  // a query that merely mentions the host, the cdn and another host are not rule 5
  [
    `${SRC}/en/lifestyle/explore-albania/?q=skoda-storyboard.com/x`,
    'https://cdn.skoda-storyboard.com/2026/10/a_1a2b3c4d.jpg',
    'https://example.org/skoda-storyboard.com/en/',
  ].forEach((href) => assert.equal(one(href), href));
});

test('a trailing space, raw or encoded, is trimmed from the href (rule 6)', { skip }, () => {
  const PDF = 'https://cdn.skoda-storyboard.com/2026/09/Skoda_440_469d33ab.pdf';
  assert.equal(one(`${PDF} `), PDF);
  assert.equal(one(`${PDF}%20`), PDF);
  assert.equal(one(`${SRC}${STORY}/%20`), STORY);
  assert.equal(one('https://example.org/a%20b'), 'https://example.org/a%20b', 'an inner space stays');
});

test('links inside block tables are rewritten too', { skip }, () => {
  const el = run(`<table><tr><th>Tags</th></tr><tr><td><a href="${SRC}/en/tag/model/yeti/">Yeti</a></td></tr>
    <tr><td><a href="${SRC}${STORY}/">Epiq</a></td></tr></table>`);
  assert.deepEqual(hrefs(el), [`${SRC}/en/tag/model/yeti/`, STORY]);
});

test('archive pages (skoda-archive-url-set.txt) are rewritten site-relative, no trailing slash', { skip }, () => {
  const el = run(`<a href="${SRC}/en/tag/model/epiq/">Epiq</a><a href="${SRC}/en/tag/years/2026/">2026</a>
    <a href="${SRC}/en/category/emobility/">eMobility</a><a href="${SRC}/en/category/lifestyle/people/">People</a>`);
  assert.deepEqual(hrefs(el), ['/en/tag/model/epiq', '/en/tag/years/2026', '/en/category/emobility', '/en/category/lifestyle/people']);
});

test('beforeTransform is a no-op', { skip }, () => {
  const el = run(`<a href="${SRC}${STORY}/">x</a>`, 'beforeTransform');
  assert.equal(hrefs(el)[0], `${SRC}${STORY}/`);
});

test('idempotent: a second run changes nothing', { skip }, () => {
  const html = [
    `<a href="${SRC}${STORY}/">a</a>`,
    `<a href="${SRC}/en/tag/model/epiq/">b</a>`,
    '<a href="/direct-download/2026/08/x.jpg">c</a>',
    '<a href="https://cdn.skoda-storyboard.com/x.pdf#s_aid=1">d</a>',
  ].join('');
  const first = run(html);
  const once = first.innerHTML;
  transform('afterTransform', first, {});
  assert.equal(first.innerHTML, once);
});

test('every URL-set, corpus and archive page (non-attachment) is on the allow-list', { skip }, () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const lines = ['skoda-m1-url-set.txt', 'skoda-rail-feed-corpus.txt', 'skoda-archive-url-set.txt', 'skoda-published-url-set.txt']
    .flatMap((f) => readFileSync(path.join(root, 'docs/planning', f), 'utf8').split(/\r?\n/))
    .map((l) => l.trim())
    .filter((l) => l.startsWith('https://www.skoda-storyboard.com/') && !l.includes('attachment_id='));
  assert.ok(lines.length > 100);
  lines.forEach((url) => assert.ok(one(url).startsWith('/'), `not rewritten: ${url}`));
});

test('pages known only from the live index take plain links; listing filters to them stay live (SKODA-801a)', { skip }, () => {
  // plain links to live-only pages: a story imported after the planned lists, a hub
  assert.equal(one(`${SRC}/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain/`), '/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain');
  assert.equal(one(`${SRC}/en/press-kits/`), '/en/press-kits');
  assert.equal(one(`${SRC}/en/news/#latest`), '/en/news#latest');
  // a listing filter to a live-only hub keeps the live filtered listing (facets differ per listing)
  [`${SRC}/en/press-kits/?filter%5Bhistory%5D%5B%5D=motorsport-history`,
    `${SRC}/en/news/?filter[years]%5B0%5D=61572`].forEach((href) => assert.equal(one(href), href));
  // search's own query is always read
  assert.equal(one(`${SRC}/en/search/?filter%5Bsearch%5D%5B%5D=peaq`), '/en/search?filter%5Bsearch%5D%5B%5D=peaq');
});

test('published list: live index paths → sorted unique source URLs, QA fixtures and drafts left out (SKODA-801a)', () => {
  const text = renderPublished(['/en/news', '/en', '/en/test/listing-demo', '/drafts/x', '/en/news', '/en/emobility/teaser'], '2026-10-10');
  const urls = text.split('\n').filter((l) => l.startsWith('https://'));
  assert.deepEqual(urls, [
    'https://www.skoda-storyboard.com/en/',
    'https://www.skoda-storyboard.com/en/emobility/teaser/',
    'https://www.skoda-storyboard.com/en/news/',
  ]);
  assert.match(text, /^# ===== PUBLISHED \(3\) =====$/m);
  assert.deepEqual(buildAllowlist('', '', '', text).paths, ['/en', '/en/emobility/teaser', '/en/news']);
});

test('the generated allow-list block matches the URL set + corpus + archives + published (run npm run import:allowlist)', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const source = readFileSync(path.join(root, TARGET), 'utf8');
  assert.equal(renderInto(source, readLists(root)), source);
});

test('single-tag news filter becomes the demo tag page (SKODA-607)', { skip }, () => {
  // exact taxonomy match
  assert.equal(one(`${SRC}/en/news/?filter%5Byears%5D%5B%5D=2026`), '/en/tag/years/2026');
  assert.equal(one(`${SRC}/en/news/?filter[model][]=peaq`), '/en/tag/model/peaq');
  // the demo files the term under another taxonomy: unique slug match
  assert.equal(one(`${SRC}/en/news/?filter%5Btechnology%5D%5B%5D=electromobility`), '/en/tag/crew/electromobility');
  // no demo tag page → unchanged
  const jahn = `${SRC}/en/news/?filter%5Bvip%5D%5B%5D=jahn`;
  assert.equal(one(jahn), jahn);
  // multi-filter "All" links are not tag links
  const all = `${SRC}/en/news/?filter[years]%5B0%5D=61572&amp;filter[model]%5B0%5D=61611`;
  assert.equal(one(all), `${SRC}/en/news/?filter[years]%5B0%5D=61572&filter[model]%5B0%5D=61611`);
});

test('a Story Rail viewall keeps the filtered listing, as the source rail "All" (#284)', { skip }, () => {
  const rail = (head, key, href) => run(`<table><tr><th colspan="2">${head}</th></tr>
    <tr><td>template</td><td>press_release</td></tr><tr><td>${key}</td><td><a href="${href}">All</a></td></tr></table>`);
  // not the tag page: rule 1 as for any link (a filter link to the live-only /en/news stays
  // as authored, and the runtime links policy opens it on the demo listing, scripts/links.js)
  const news = `${SRC}/en/news/?filter[model][]=superb`;
  assert.deepEqual(hrefs(rail('Story Rail', 'viewall', news)), [news]);
  assert.deepEqual(hrefs(rail('Story Rail (wide)', 'viewall', news)), [news]);
  assert.deepEqual(hrefs(rail('Story Rail', 'viewall', '/en/news?filter[model][]=superb')), ['/en/news?filter[model][]=superb']);
  // the other "All" keys story-rail reads
  assert.deepEqual(hrefs(rail('Story Rail', 'view-all', news)), [news]);
  assert.deepEqual(hrefs(rail('Story Rail', 'All', news)), [news]);
  // a tag chip elsewhere (another block, another row) still becomes the tag page
  assert.deepEqual(hrefs(rail('Tags', 'viewall', news)), ['/en/tag/model/superb']);
  assert.deepEqual(hrefs(rail('Story Rail', 'tags', news)), ['/en/tag/model/superb']);
});

// --- SKODA-1001: other locales -----------------------------------------------------------

test('a published translation is a demo page: its link becomes site-relative', { skip }, () => {
  assert.equal(one(`${SRC}/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund/`), '/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund');
  // a translation that isn't migrated keeps opening the live site
  assert.equal(one(`${SRC}/cs/category/modely-cs/`), `${SRC}/cs/category/modely-cs/`);
});

test('a Czech tag chip only becomes a Czech tag page, never an English one', { skip }, () => {
  // no demo Czech tag page yet: the chip stays as it is (rule 1 then keeps it live)
  const chip = `${SRC}/cs/tiskove-zpravy/?filter%5Bmodel%5D%5B%5D=elroq-cs`;
  assert.equal(one(chip), chip);
  // the English chip keeps working as before
  assert.equal(one(`${SRC}/en/news/?filter%5Bmodel%5D%5B%5D=fabia`), '/en/tag/model/fabia');
  // another listing in the same shape is not a tag chip
  const other = `${SRC}/cs/foto/?filter%5Bmodel%5D%5B%5D=elroq-cs`;
  assert.equal(one(other), other);
});

test('NEWS_LISTINGS mirrors the runtime per-locale News paths (scripts/locale-paths.js)', async () => {
  const { LOCALE_PATHS } = await import('../../../scripts/locale-paths.js');
  const src = readFileSync(fileURLToPath(new URL('./skoda-links.js', import.meta.url)), 'utf8');
  const block = src.match(/const NEWS_LISTINGS = \{([\s\S]*?)\};/)[1];
  const mirrored = Object.fromEntries([...block.matchAll(/(\w+): '([^']+)'/g)].map((m) => [m[1], m[2]]));
  const runtime = Object.fromEntries(Object.entries(LOCALE_PATHS)
    .filter(([, p]) => p.news).map(([l, p]) => [l, p.news.split('/')[2]]));
  assert.deepEqual(mirrored, runtime);
});

test('previewedPaths: the pages import:push previewed count as demo pages; chrome and fragments do not (SKODA-1001)', () => {
  const manifest = {
    pages: {
      '/cs/tiskove-zpravy': { hash: 'a', previewedHash: 'a' },
      '/cs/e-mobilita-cs/x': { hash: 'b', previewedHash: 'b' },
      '/cs/pushed-not-previewed': { hash: 'c' },
      '/cs/nav': { hash: 'd', previewedHash: 'd' },
      '/cs/media-room/footer': { hash: 'e', previewedHash: 'e' },
      '/cs/nav-newsletter': { hash: 'f', previewedHash: 'f' },
      '/en/fragments/newsletter-card': { hash: 'g', previewedHash: 'g' },
      '/drafts/y': { hash: 'h', previewedHash: 'h' },
    },
  };
  assert.deepEqual(previewedPaths(manifest), ['/cs/tiskove-zpravy', '/cs/e-mobilita-cs/x']);
  assert.deepEqual(previewedPaths({}), []);
  assert.deepEqual(previewedPaths(null), []);
});
