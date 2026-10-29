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
  pathStatus, checkFragments, findingCount, MAX_REDIRECTS, isUnresolved,
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
  // #542 review: only the site's hosts, not its CDN or another subdomain
  assert.equal(treeOf('https://cdn.skoda-storyboard.com/de/x.jpg'), null);
  assert.equal(treeOf('https://skoda-1006-chrome-check--demo--skoda-storyboard.aem.page/sk/x'), 'sk');
  assert.equal(treeOf('//evil.example/de/x'), null);
  assert.equal(treeOf('mailto:a@b.cz'), null);
});

test('crossLocaleLinks: another locale outside the switcher is a finding, English included', () => {
  const html = nav('<li><a href="/cs/x">X</a></li><li><a href="/sk/y">Y</a></li><li><a href="/en/news">News</a></li>'
    + `<li><a href="${LIVE}/de/z/">Z</a></li><li><a href="https://www.facebook.com/skoda">FB</a></li>`);
  assert.deepEqual(crossLocaleLinks(html, 'cs'), ['/sk/y', '/en/news', `${LIVE}/de/z/`]);
  // the switcher's own links into other locales are fine
  assert.deepEqual(crossLocaleLinks(nav('<li><a href="/cs/x">X</a></li>'), 'cs'), []);
  // #542 review: by position, not by value: a menu link to a switcher target is still a finding
  assert.deepEqual(crossLocaleLinks(nav('<li><a href="/en">English stories</a></li>'), 'cs'), ['/en']);
  // a list item holding a paragraph and a sub-list does not hide its links as a switcher
  assert.deepEqual(crossLocaleLinks('<ul><li><p><a href="/en">EN</a></p><ul><li><a href="/sk/x">X</a></li></ul></li></ul>', 'cs'), ['/sk/x']);
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
  // compared as the link rule writes paths: without the trailing slash, in any case
  const migrated = '<p><strong>SR</strong> <a href="/en">EN</a></p><ul><li><a href="/sl/Category/modeli-si">Modeli</a></li></ul>';
  assert.deepEqual(crossLocaleLinks(migrated, 'sr'), []);
});

test('sitePaths: the in-site links after the runtime link policy, each once', () => {
  const html = '<p><a href="/cs/x/">X</a> <a href="/cs/x">X</a> <a href="/en/feed/">RSS</a> '
    + `<a href="${LIVE}/cs/y/">Y</a> <a href="mailto:a@b.cz">mail</a> <a href="#subscribe">S</a></p>`;
  const paths = sitePaths(html, BASE);
  assert.deepEqual(sitePaths('<p><a href="/cs/x/">X</a></p>', BASE), ['/cs/x'], 'the trailing slash dropped, as at runtime');
  assert.equal(paths.filter((p) => p === '/cs/x').length, 1);
  assert.ok(!paths.includes('/cs/x/'));
  assert.ok(!paths.some((p) => p.startsWith('/en/feed')), 'a feed is a live-site link (LIVE_ONLY)');
  assert.ok(!paths.includes('/cs/y'), 'a source-host link is not fetched');
});

// --- the network side, with a fake fetch -----------------------------------------------------
const response = (status, { body = '', location } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (h) => (h.toLowerCase() === 'location' ? location ?? null : null) },
  text: async () => body,
});

const fake = (map, calls = []) => async (url) => {
  calls.push(new URL(url).pathname);
  const next = map[new URL(url).pathname];
  if (typeof next === 'function') return next();
  if (next instanceof Error) throw next;
  return next ?? response(404);
};

test('pathStatus: redirects followed, errors and 429 retried, never answering is 0', async () => {
  assert.equal(await pathStatus(BASE, '/cs/a', fake({ '/cs/a': response(200) })), 200);
  const toDead = fake({ '/cs/old': response(301, { location: '/cs/gone' }) });
  assert.equal(await pathStatus(BASE, '/cs/old', toDead), 404, 'a redirect to a dead page is dead');
  const toPage = fake({ '/cs/old': response(302, { location: '/cs/a' }), '/cs/a': response(200) });
  assert.equal(await pathStatus(BASE, '/cs/old', toPage), 200);
  const toLive = fake({ '/cs/out': response(301, { location: `${LIVE}/cs/out/` }) });
  assert.equal(await pathStatus(BASE, '/cs/out', toLive), 200, 'a redirect to the live source leaves the site');
  let n = 0;
  const flaky = () => { n += 1; return n < 3 ? response(429) : response(200); };
  assert.equal(await pathStatus(BASE, '/cs/flaky', fake({ '/cs/flaky': flaky })), 200);
  assert.equal(await pathStatus(BASE, '/cs/down', fake({ '/cs/down': new Error('ECONNRESET') })), 0);
});

// #542 review: a redirect counts only when it ends on a 2xx
test('pathStatus: a redirect that never ends on a page is unresolved, with its last status', async () => {
  const cases = [
    ['a redirect to itself', { '/cs/start': response(301, { location: '/cs/start' }) }, 301],
    ['a 302 without Location', { '/cs/start': response(302) }, 302],
    ['301 → 302 → 404: the end is requested', {
      '/cs/start': response(301, { location: '/cs/b' }),
      '/cs/b': response(302, { location: '/cs/c' }),
      '/cs/c': response(404),
    }, 404],
    ['a loop A → B → A', {
      '/cs/start': response(301, { location: '/cs/b' }),
      '/cs/b': response(302, { location: `${BASE}/cs/start` }),
    }, 302],
    ['an unparsable Location', { '/cs/start': response(301, { location: 'http://[' }) }, 301],
  ];
  for (const [name, map, status] of cases) {
    const got = await pathStatus(BASE, '/cs/start', fake(map));
    assert.equal(got, status, name);
    assert.ok(isUnresolved(got), `${name} is unresolved`);
  }
  // a chain within the limit resolves; one past it is unresolved, and stops asking
  const chain = (hops) => Object.fromEntries(Array.from({ length: hops }, (_, i) => [
    i ? `/cs/h${i}` : '/cs/start', response(301, { location: `/cs/h${i + 1}` }),
  ]).concat([[`/cs/h${hops}`, response(200)]]));
  assert.equal(await pathStatus(BASE, '/cs/start', fake(chain(MAX_REDIRECTS))), 200);
  const calls = [];
  assert.equal(await pathStatus(BASE, '/cs/start', fake(chain(MAX_REDIRECTS + 1), calls)), 301);
  assert.equal(calls.length, MAX_REDIRECTS + 1, 'no request past the limit');
  assert.deepEqual([200, 204].map(isUnresolved), [false, false]);
  assert.deepEqual([0, 301, 404, 500].map(isUnresolved), [true, true, true, true]);
});

test('checkFragments: each unresolved redirect is a finding (#542 review)', async () => {
  const redirects = {
    '/cs/start': response(301, { location: '/cs/start' }),
    '/cs/nolocation': response(302),
    '/cs/chain': response(301, { location: '/cs/b' }),
    '/cs/b': response(302, { location: '/cs/c' }),
    '/cs/c': response(404),
    '/cs/ok': response(301, { location: '/cs/page' }),
    '/cs/page': response(200),
  };
  const links = ['/cs/start', '/cs/nolocation', '/cs/chain', '/cs/ok']
    .map((href) => `<li><a href="${href}">${href}</a></li>`).join('');
  const pages = {
    '/cs/nav.plain.html': response(200, { body: `<ul>${links}</ul>` }),
    '/cs/footer.plain.html': response(200, { body: '' }),
    '/cs/media-room/nav.plain.html': response(200, { body: '' }),
    '/cs/media-room/footer.plain.html': response(200, { body: '' }),
    ...redirects,
  };
  const fetchImpl = async (url) => pages[new URL(url).pathname] ?? response(404);
  const [navResult] = await checkFragments({ base: BASE, locales: ['cs'], fetchImpl });
  assert.deepEqual(navResult.dead, [['/cs/start', 301], ['/cs/nolocation', 302], ['/cs/chain', 404]]);
});

test('checkFragments: a missing fragment, a dead link and a cross-locale link are findings', async () => {
  const pages = {
    '/cs/nav.plain.html': response(200, { body: nav('<li><a href="/cs/ok">OK</a></li><li><a href="/cs/dead">D</a></li><li><a href="/sk/x">X</a></li>') }),
    '/cs/footer.plain.html': response(404),
    '/cs/media-room/nav.plain.html': response(200, { body: '<p><a href="/cs/ok">OK</a></p>' }),
    '/cs/media-room/footer.plain.html': response(200, { body: '' }),
    '/cs/ok': response(200),
    '/cs/media-room': response(200),
    '/cs': response(200),
    '/sk/x': response(200), // a page here, in another locale: a cross-locale finding only
    '/en': response(200), // the switcher's targets
    '/de': response(200),
  };
  const fetchImpl = async (url) => pages[new URL(url).pathname] ?? response(404);
  const results = await checkFragments({ base: BASE, locales: ['cs'], fetchImpl });
  assert.deepEqual(results.map((r) => r.path), ['/cs/nav', '/cs/footer', '/cs/media-room/nav', '/cs/media-room/footer']);
  const [navResult, footer, mrNav, mrFooter] = results;
  assert.deepEqual(navResult.cross, ['/sk/x']);
  assert.deepEqual(navResult.dead, [['/cs/dead', 404]]);
  assert.equal(footer.missing, 404);
  assert.deepEqual([mrNav.cross, mrNav.dead, mrFooter.cross, mrFooter.dead], [[], [], [], []]);
  assert.equal(findingCount(results), 3, 'the dead link, the other-locale link, the missing footer');
});
