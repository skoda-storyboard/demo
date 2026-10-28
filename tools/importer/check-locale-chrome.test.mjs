/*
 * The locale chrome check (SKODA-1006): a `/{loc}/` chrome fragment may link another locale only
 * through the language switcher or a PO-accepted source link, and its in-site links are read after
 * the runtime link policy.
 * Run: node --test tools/importer/check-locale-chrome.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  switcherHrefs, treeOf, crossLocaleLinks, sitePaths, ACCEPTED, LOCALES, FRAGMENTS,
} from './check-locale-chrome.mjs';

const LIVE = 'https://www.skoda-storyboard.com';
const BASE = 'https://main--demo--skoda-storyboard.aem.live';
// a locale nav's shape: the topbar's tabs, the switcher paragraph, then the menu
const nav = (menu, switcher = '<p><strong>CZ</strong> <a href="/en">EN</a> <a href="/de">DE</a></p>') => `<div><ul>
<li><a href="/cs">Příběhy</a></li><li><a href="/cs/media-room">Media Room</a></li></ul>${switcher}</div>
<div><ul>${menu}</ul></div>`;

test('the 20 fragments of the five locales', () => {
  assert.deepEqual(LOCALES, ['cs', 'de', 'sk', 'sr', 'sl']);
  assert.equal(LOCALES.length * FRAGMENTS.length, 20);
});

test('switcherHrefs: the anchors of a paragraph of locale codes only', () => {
  assert.deepEqual([...switcherHrefs(nav('<li><a href="/en/news">News</a></li>'))], ['/en', '/de']);
  // a menu item reading "EN…" or a paragraph with other text is not the switcher
  assert.deepEqual([...switcherHrefs('<p><a href="/en">English site</a></p>')], []);
  assert.deepEqual([...switcherHrefs('<p>Go <a href="/en">EN</a> <a href="/en/news">news</a></p>')], []);
});

test('treeOf: the locale tree of a demo or source link, nothing else', () => {
  assert.equal(treeOf('/cs/e-mobilita-cs'), 'cs');
  assert.equal(treeOf(`${LIVE}/sk/tag/model/elroq-sk/`), 'sk');
  assert.equal(treeOf(`${BASE}/en`), 'en');
  assert.equal(treeOf('https://www.skoda-auto.cz/cs/x'), null, 'another host');
  assert.equal(treeOf('/'), null);
  assert.equal(treeOf('/csx/a'), null, 'not a locale segment');
  assert.equal(treeOf('/xx/a'), null, 'not a site locale');
  assert.equal(treeOf('#subscribe'), null);
});

test('crossLocaleLinks: another locale outside the switcher is a finding, English included', () => {
  const html = nav('<li><a href="/cs/x">X</a></li><li><a href="/sk/y">Y</a></li><li><a href="/en/news">News</a></li>'
    + `<li><a href="${LIVE}/de/z/">Z</a></li><li><a href="https://www.facebook.com/skoda">FB</a></li>`);
  assert.deepEqual(crossLocaleLinks(html, 'cs'), ['/sk/y', '/en/news', `${LIVE}/de/z/`]);
  // the switcher's own links into other locales are fine
  assert.deepEqual(crossLocaleLinks(nav('<li><a href="/cs/x">X</a></li>'), 'cs'), []);
});

test('crossLocaleLinks: the PO-accepted source links pass, and only those', () => {
  const sr = `<div><ul><li><a href="/sr">Priče</a></li></ul><p><strong>SR</strong> <a href="/en">EN</a></p></div>
<div><ul><li><p><a href="${LIVE}/sl/category/modeli-si/">Modeli</a></p></li><li><a href="${LIVE}/sl/other/">O</a></li></ul></div>`;
  assert.deepEqual(crossLocaleLinks(sr, 'sr'), [`${LIVE}/sl/other/`]);
  // the same link without the exception is a finding: the check is not blind to it
  assert.deepEqual(crossLocaleLinks(sr, 'sr', []), [`${LIVE}/sl/category/modeli-si/`, `${LIVE}/sl/other/`]);
  // an exception belongs to its locale only
  const cs = nav(`<li><a href="${LIVE}/sl/category/modeli-si/">Modeli</a></li>`);
  assert.deepEqual(crossLocaleLinks(cs, 'cs'), [`${LIVE}/sl/category/modeli-si/`], 'a Serbian exception, not a Czech one');
  assert.ok(Object.values(ACCEPTED).flat().every((p) => p.startsWith('/') && treeOf(p)));
});

test('sitePaths: the in-site links after the runtime link policy, each once', () => {
  const html = '<p><a href="/cs/x/">X</a> <a href="/cs/x">X</a> <a href="/en/feed/">RSS</a> '
    + `<a href="${LIVE}/cs/y/">Y</a> <a href="mailto:a@b.cz">mail</a> <a href="#subscribe">S</a></p>`;
  const paths = sitePaths(html, BASE);
  assert.ok(paths.includes('/cs/x'), 'the trailing slash dropped, as at runtime');
  assert.equal(paths.filter((p) => p === '/cs/x').length, 1);
  assert.ok(!paths.some((p) => p.startsWith('/en/feed')), 'a feed is a live-site link (LIVE_ONLY)');
  assert.ok(!paths.includes('/cs/y'), 'a source-host link is not fetched');
});
