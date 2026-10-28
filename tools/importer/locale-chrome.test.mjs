/*
 * locale-chrome.js (SKODA-303a): the translated nav / Subscribe panel / footer fragments built
 * from a source page's header and footer, in the shape of the English fragments.
 * Run: node --test tools/importer/locale-chrome.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  localeOfUrl, authoredHref, buildNav, buildNewsletter, buildFooter, buildSectionNav,
  siteWideLocaleHref,
} from './locale-chrome.js';

const LIVE = 'https://www.skoda-storyboard.com';
// the source chrome, trimmed (the shape of the Czech Epiq story)
const SOURCE = `<header>
  <div class="topbar">
    <a href="${LIVE}/cs/">Stories</a><a href="${LIVE}/cs/media-room/">Media Room</a>
    <a class="topbar__newsletter newsletter" href="${LIVE}/cs/x/#nl-form"><svg></svg> Odebírat články </a>
    <div class="lang-links"><span>cs</span><a href="${LIVE}/en/x/">en</a></div>
    <div class="topbar__dropdown"><div class="topbar__dropdown__newsletter hidden"><form>
      <input type="hidden" name="language" value="cs_CZ">
      <label for="topbar-newsletter-email"> Odebírejte naše články, ať vám už nic neunikne: </label>
      <div class="topbar__dropdown__newsletter-form"><input name="list" type="hidden" value="386">
        <input name="email" type="email" placeholder="Zadejte svůj e-mail"><button type="submit">Přihlásit</button></div>
      <div class="terms"><input type="checkbox"><label> Tímto uděluji <a class="light" target="_blank" href="${LIVE}/cs/souhlas/">souhlas se zpracováním</a> svých údajů.
        <div class="manage-subscription-link light"><a href="${LIVE}/cs/sprava-newsletteru/">Správa newsletteru</a></div></label></div>
    </form></div></div>
  </div>
  <a class="logo" href="${LIVE}/cs/"><svg></svg></a>
  <nav class="topnav"><ul>
    <li><a href="${LIVE}/cs/category/modely-cs/">Modely</a><ul>
      <li class="heading"><a href="${LIVE}/cs/category/modely-cs/">Modely</a></li>
      <li class="heading"><a href="${LIVE}/cs/category/modely-cs/">Modely</a></li>
      <li><a href="${LIVE}/cs/tag/model/fabia-cs/">Fabia</a></li></ul></li>
    <li><a href="${LIVE}/cs/category/e-mobilita-cs/">eMobilita</a><ul><li><a href="${LIVE}/cs/category/e-mobilita-cs/">eMobilita</a></li></ul></li>
    <li><a href="#">Newsletter</a></li>
  </ul></nav>
  <div class="search-bar"><form class="search-form" action="${LIVE}/cs/hledat/"><input type="search" placeholder="Vyhledat"></form></div>
</header>
<footer>
  <section class="social"><div class="app-download-buttons"><ul>
    <li><a href="https://apps.apple.com/cz/app/x"><svg></svg></a></li><li><a href="https://play.google.com/store/x"><svg></svg></a></li></ul></div>
    <div class="social-links"><ul><li><a class="icon icon-facebook" href="https://www.facebook.com/skoda.cz/">Facebook</a></li></ul></div></section>
  <div class="footer-nav"><ul class="menu">
    <li><a href="${LIVE}/cs/category/modely-cs/">Modely</a><ul class="sub-menu">
      <li class="heading"><a href="${LIVE}/cs/category/modely-cs/">Modely</a></li><li><a href="${LIVE}/cs/tag/model/fabia-cs/">Fabia</a></li></ul></li>
    <li><a href="#">Newsletter</a></li></ul></div>
  <div class="copyright-text"><p> Více na <a target="_blank" href="https://www.skoda-auto.cz/ochrana/">Ochrana&nbsp;údajů</a> , <a href="${LIVE}/cs/copyright/">Copyright</a> . </p></div>
  <div class="copyright-notice"><p> © Škoda Auto a.s. 2026 </p></div>
  <div class="feed-links"><a href="${LIVE}/cs/feed/">RSS</a></div>
</footer>`;

const doc = () => new JSDOM(`<!DOCTYPE html><html><body>${SOURCE}</body></html>`, { url: `${LIVE}/cs/x/` }).window.document;
const sections = (root) => {
  const out = [[]];
  [...root.children].forEach((el) => (el.tagName === 'HR' ? out.push([]) : out[out.length - 1].push(el)));
  return out;
};
const links = (el) => [...el.querySelectorAll('a')].map((a) => `${a.textContent}=${a.getAttribute('href')}`);

test('localeOfUrl / authoredHref: the locale segment; live links stay absolute (the link rule decides), #… and others stay', () => {
  assert.equal(localeOfUrl(`${LIVE}/cs/e-mobilita-cs/x/`), 'cs');
  assert.equal(authoredHref(`${LIVE}/cs/category/modely-cs/`), `${LIVE}/cs/category/modely-cs/`);
  assert.equal(authoredHref('/cs/foto/'), `${LIVE}/cs/foto/`, 'a root-relative source link too');
  assert.equal(authoredHref('#subscribe'), '#subscribe');
  assert.equal(authoredHref('https://www.facebook.com/skoda.cz/'), 'https://www.facebook.com/skoda.cz/');
  assert.equal(authoredHref(''), '');
});

test('buildNav: the 4 sections of /nav (topbar, brand, menu, search), in the locale', () => {
  const s = sections(buildNav(doc(), 'cs'));
  assert.equal(s.length, 4);
  const [topbar, brand, menu, search] = s;
  assert.deepEqual(links(topbar[0]), ['Stories=https://www.skoda-storyboard.com/cs/', 'Media Room=https://www.skoda-storyboard.com/cs/media-room/']);
  assert.deepEqual(links(topbar[1]), ['Odebírat články=#subscribe']);
  // the source story's own `en` link names its translation (`/en/x/`), not the locale: the row
  // a whole locale shares keeps each locale's home (1001 review)
  assert.equal(topbar[2].innerHTML, '<a href="https://www.skoda-storyboard.com/en/">EN</a> <strong>CZ</strong> <a href="https://www.skoda-storyboard.com/de/">DE</a> <a href="https://www.skoda-storyboard.com/sk/">SK</a> <a href="https://www.skoda-storyboard.com/sr/">SR</a> <a href="https://www.skoda-storyboard.com/sl/">SL</a>');
  assert.deepEqual(links(brand[0]), ['Škoda Storyboard=https://www.skoda-storyboard.com/cs/']);
  const items = [...menu[0].children];
  assert.deepEqual(links(items[0]), ['Modely=https://www.skoda-storyboard.com/cs/category/modely-cs/', 'Modely=https://www.skoda-storyboard.com/cs/category/modely-cs/', 'Fabia=https://www.skoda-storyboard.com/cs/tag/model/fabia-cs/'], 'the heading kept once, as /nav');
  assert.deepEqual(links(items[1]), ['eMobilita=https://www.skoda-storyboard.com/cs/category/e-mobilita-cs/'], 'a lone heading is no sub-list');
  assert.deepEqual(links(items[2]), ['Newsletter=#newsletter']);
  assert.deepEqual(links(search[0]), ['Vyhledat=https://www.skoda-storyboard.com/cs/hledat/']);
});

test('buildNewsletter: the Newsletter Stub (topbar) rows of /nav-newsletter', () => {
  globalThis.WebImporter = {
    DOMUtils: {
      createTable: (cells, d) => {
        const table = d.createElement('table');
        cells.forEach((row) => {
          const tr = d.createElement('tr');
          row.forEach((cell) => {
            const td = d.createElement('td');
            td.append(cell);
            tr.append(td);
          });
          table.append(tr);
        });
        return table;
      },
    },
  };
  try {
    const rows = [...buildNewsletter(doc(), 'cs', { message: 'Thanks' }).querySelectorAll('tr')]
      .map((tr) => [...tr.children].map((td) => td.innerHTML.trim()));
    assert.deepEqual(rows, [
      ['Newsletter Stub (topbar)'],
      ['label', 'Odebírejte naše články, ať vám už nic neunikne:'],
      ['placeholder', 'Zadejte svůj e-mail'],
      ['button', 'Přihlásit'],
      ['consent', '<div>Tímto uděluji <a href="https://www.skoda-storyboard.com/cs/souhlas/">souhlas se zpracováním</a> svých údajů.</div>'],
      ['manage', '<a href="https://www.skoda-storyboard.com/cs/sprava-newsletteru/">Správa newsletteru</a>'],
      ['message', 'Thanks'],
      ['list', '386'],
      ['language', 'cs_CZ'],
    ]);
  } finally {
    delete globalThis.WebImporter;
  }
});

test('buildFooter: the 3 sections of /footer; headings and Newsletter dropped; icons as :name:', () => {
  const [icons, menu, legal] = sections(buildFooter(doc()));
  assert.deepEqual(links(icons[0]), [
    ':appstore:=https://apps.apple.com/cz/app/x', ':googleplay:=https://play.google.com/store/x',
  ]);
  assert.deepEqual(links(icons[1]), [':facebook:=https://www.facebook.com/skoda.cz/']);
  assert.deepEqual(links(menu[0]), ['Modely=https://www.skoda-storyboard.com/cs/category/modely-cs/', 'Fabia=https://www.skoda-storyboard.com/cs/tag/model/fabia-cs/']);
  assert.equal(legal[0].innerHTML, 'Více na <a href="https://www.skoda-auto.cz/ochrana/">Ochrana&nbsp;údajů</a>, <a href="https://www.skoda-storyboard.com/cs/copyright/">Copyright</a>.');
  assert.equal(legal[1].textContent, '© Škoda Auto a.s. 2026');
  assert.deepEqual(links(legal[2]), ['RSS=https://www.skoda-storyboard.com/cs/feed/']);
});

test('buildFooter: a `#` parent column\'s label links to its first link, then its links (the German Modelle, 1001 review)', () => {
  const d = doc();
  d.querySelector('.footer-nav ul.menu').insertAdjacentHTML('afterbegin', `<li><a href="#">Modelle</a><ul class="sub-menu">
    <li><a href="${LIVE}/de/category/modelle-de/">Modelle</a></li><li><a href="${LIVE}/de/tag/model/fabia-de/">Fabia</a></li></ul></li>
    <li><a href="#">Leer</a><ul class="sub-menu"><li><a href="${LIVE}/de/x/">Nur einer</a></li></ul></li>`);
  const [, menu] = sections(buildFooter(d));
  const [first, second] = [...menu[0].children];
  // the source's phone footer: the label opens the category; from 992px the footer block hides it
  assert.deepEqual(links(first.querySelector(':scope > p')), [`Modelle=${LIVE}/de/category/modelle-de/`]);
  assert.deepEqual(links(first.querySelector(':scope > ul')), [`Modelle=${LIVE}/de/category/modelle-de/`, `Fabia=${LIVE}/de/tag/model/fabia-de/`]);
  assert.deepEqual(links(second), [`Leer=${LIVE}/de/x/`], 'a `#` parent with a single link: its label, no sub-list');
});

test('a page without the chrome: empty fragments, no throw', () => {
  const bare = new JSDOM('<!DOCTYPE html><html><body><p>x</p></body></html>', { url: `${LIVE}/cs/x/` }).window.document;
  assert.equal(buildFooter(bare).children.length, 0);
  assert.equal(buildNewsletter(bare, 'cs').children.length, 0);
  assert.equal(sections(buildNav(bare, 'cs')).length, 4, 'the nav keeps its 4 sections');
});

test('siteWideLocaleHref: a locale or Media Room home, or another site; never one page\'s translation', () => {
  [
    [`${LIVE}/en/`, `${LIVE}/en/`],
    [`${LIVE}/cs/media-room/`, `${LIVE}/cs/media-room/`],
    ['/sk/', '/sk/'],
    ['https://www.skoda-media.de/', 'https://www.skoda-media.de/'],
    [`${LIVE}/en/emobility/skoda-epiq-will-win-you-over/`, ''],
    [`${LIVE}/cs/tiskove-zpravy/`, ''],
    ['javascript:alert(1)', ''],
    ['', ''],
  ].forEach(([href, want]) => assert.equal(siteWideLocaleHref(href), want, href));
});

test('buildNav: the Media Room row keeps the source\'s locale Media Room links and another site', () => {
  const d = doc();
  d.querySelector('.lang-links').innerHTML = `<span>cs</span><a href="${LIVE}/en/media-room/">en</a><a href="https://www.skoda-media.de/">de</a>`;
  const [topbar] = sections(buildNav(d, 'cs'));
  const row = topbar[topbar.length - 1];
  assert.deepEqual(links(row).slice(0, 2), [`EN=${LIVE}/en/media-room/`, 'DE=https://www.skoda-media.de/']);
});

test('buildNav: a `#` parent with sub-items is a menu heading, not Subscribe (the German Modelle, 1001 review)', () => {
  const d = doc();
  d.querySelector('nav.topnav > ul').insertAdjacentHTML('afterbegin', `<li><a href="#">Modelle</a><ul class="sub-menu">
    <li><a href="${LIVE}/de/category/modelle-de/">Modelle</a></li>
    <li><a href="${LIVE}/de/tag/model/fabia-de/">Fabia</a></li><li><a href="${LIVE}/de/tag/model/scala-de/">Scala</a></li></ul></li>`);
  const [, , menu] = sections(buildNav(d, 'de'));
  const first = menu[0].children[0];
  assert.equal(first.querySelector(':scope > p').textContent, 'Modelle', 'a text heading');
  assert.equal(first.querySelector(':scope > p a'), null, 'not a link, not #newsletter');
  // its sub-items, the category first (live shows "Modelle" again as the dropdown's first link)
  assert.deepEqual(links(first.querySelector('ul')), [`Modelle=${LIVE}/de/category/modelle-de/`, `Fabia=${LIVE}/de/tag/model/fabia-de/`, `Scala=${LIVE}/de/tag/model/scala-de/`]);
});

test('buildNav: a topbar without Subscribe (DE / SK / SR on the source) authors none', () => {
  const d = doc();
  d.querySelector('.topbar__newsletter').remove();
  const [topbar] = sections(buildNav(d, 'de'));
  assert.equal(topbar.length, 2, 'switcher + locale row');
  assert.equal(topbar[1].querySelector('strong').textContent, 'DE');
  assert.equal(topbar.some((el) => el.querySelector('a[href="#subscribe"]')), false);
});

test('a language menu link stays on the site only when its target is migrated (SKODA-1001)', async () => {
  const { default: linksTransformer } = await import('./transformers/skoda-links.js');
  const { document } = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: `${LIVE}/cs/x/` }).window;
  const nav = document.createElement('div');
  [
    '/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund/', // a published Czech page
    '/cs/category/modely-cs/', // not migrated
    '/en/', // the English home
    '#subscribe',
  ].forEach((href) => nav.append(Object.assign(document.createElement('a'), { href: authoredHref(href) })));
  linksTransformer('afterTransform', nav, { document });
  assert.deepEqual([...nav.querySelectorAll('a')].map((a) => a.getAttribute('href')), [
    '/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund',
    `${LIVE}/cs/category/modely-cs/`,
    '/en',
    '#subscribe',
  ]);
});

// #485 review: the Media Room footer's Subscribe widget keeps its intro, also when the source
// nests it (the Slovak footer: `.widget_text > .textwidget > section.skoda-mailguide > p + form`)
test('buildFooter: the Media Room newsletter intro, beside a direct or a nested form', () => {
  globalThis.WebImporter = {
    DOMUtils: {
      createTable: (cells, d) => {
        const table = d.createElement('table');
        cells.forEach((row) => {
          const tr = d.createElement('tr');
          row.forEach((cell) => {
            const td = d.createElement('td');
            td.append(cell);
            tr.append(td);
          });
          table.append(tr);
        });
        return table;
      },
    },
  };
  const form = '<form class="mailguide-form"><input type="email" placeholder="E-mail"><button>OK</button></form>';
  const shapes = {
    direct: `<section class="widget mailguide"><h3 class="heading">Subscribe</h3><p>Stay informed:</p>${form}</section>`,
    nested: `<section class="widget text-3 widget_text"><div class="textwidget"><section class="widget skoda-mailguide">
      <h3 class="heading">Odber noviniek</h3><p>Ak chcete byť informovaní, zadajte svoj e-mail:</p>${form}</section></div></section>`,
  };
  try {
    Object.entries(shapes).forEach(([shape, widget]) => {
      const d = new JSDOM(`<!DOCTYPE html><html><body><footer>
        <div class="footer-widgets"><section class="app-download"></section></div>
        <div class="footer-widgets">${widget}</div></footer></body></html>`, { url: `${LIVE}/sk/media-room/` }).window.document;
      const [, middle] = sections(buildFooter(d, 'sk'));
      const tags = middle.map((el) => el.tagName);
      const intro = middle[tags.indexOf('TABLE') - 1];
      assert.equal(intro?.tagName, 'P', `${shape}: a paragraph right before the form`);
      assert.match(intro.textContent, shape === 'direct' ? /^Stay informed/ : /^Ak chcete byť informovaní/);
      assert.equal(middle.filter((el) => el.tagName === 'TABLE').length, 1, `${shape}: one form`);
    });
  } finally {
    delete globalThis.WebImporter;
  }
});

// the Sustainable Offices header (SKODA-843): 3 tabs, its own locale links, no menu
const SECTION = `<header class="header">
  <div class="topbar"><ul class="section-nav">
    <li><a href="${LIVE}/en/">Stories</a></li><li><a href="${LIVE}/en/media-room/">Media Room</a></li>
    <li class="active"><a href="${LIVE}/en/?page_id=320705">Sustainability</a></li></ul>
    <div class="right-section"><div class="lang-links"> <span>en</span> <a href="${LIVE}/cs/udrzitelne-kancelare/">CZ</a> </div></div></div>
  <div class="brand"><a class="logo" href="${LIVE}/en/?page_id=320705" title="Sustainability"><svg></svg></a></div>
  <nav class="topnav"><div class="search-bar"><form class="search-form" action="${LIVE}/en/search/"><input type="search" placeholder="Search"></form></div></nav>
</header>`;

// the builder keeps source links absolute; the importer's link rule (skoda-links, run by
// import-sustainability-nav.js as by the locale chrome importers) puts the demo pages on the demo
test('buildSectionNav: topbar (every tab, the source locale links) --- brand --- search; a page_id link is the page', async () => {
  const { default: linksTransformer } = await import('./transformers/skoda-links.js');
  const d = new JSDOM(`<!DOCTYPE html><html><body>${SECTION}</body></html>`, { url: `${LIVE}/en/sustainable-offices/` }).window.document;
  const nav = buildSectionNav(d, '/en/sustainable-offices/');
  const [built, builtBrand] = sections(nav);
  assert.deepEqual(links(built[0]), [`Stories=${LIVE}/en/`, `Media Room=${LIVE}/en/media-room/`, `Sustainability=${LIVE}/en/sustainable-offices/`]);
  assert.deepEqual(links(builtBrand[0]), [`Škoda Storyboard=${LIVE}/en/sustainable-offices/`], 'the page_id logo link is the page');
  linksTransformer('afterTransform', nav, { document: d });
  const s = sections(nav);
  assert.equal(s.length, 3);
  const [topbar, brand, search] = s;
  assert.deepEqual(links(topbar[0]), ['Stories=/en', 'Media Room=/en/media-room', 'Sustainability=/en/sustainable-offices']);
  // the Czech page is not migrated: it stays on the live site
  assert.equal(topbar[1].innerHTML, `<strong>EN</strong> <a href="${LIVE}/cs/udrzitelne-kancelare/">CZ</a>`);
  assert.deepEqual(links(brand[0]), ['Škoda Storyboard=/en/sustainable-offices']);
  assert.equal(brand[0].querySelector('a').title, 'Sustainability');
  assert.deepEqual(links(search[0]), ['Search=/en/search']);
});

test('buildFooter: a footer without a menu has 2 sections (icons, legal)', () => {
  const d = doc();
  d.querySelector('.footer-nav').remove();
  const s = sections(buildFooter(d));
  assert.equal(s.length, 2);
  assert.equal(s[1][1].textContent, '© Škoda Auto a.s. 2026');
});

test('buildSectionNav: without the source current-language marker, the page locale is it', () => {
  const d = new JSDOM(`<!DOCTYPE html><html><body>${SECTION}</body></html>`).window.document;
  d.querySelector('.lang-links span').remove();
  const [topbar] = sections(buildSectionNav(d, '/en/sustainable-offices/'));
  assert.equal(topbar[1].innerHTML, `<strong>EN</strong> <a href="${LIVE}/cs/udrzitelne-kancelare/">CZ</a>`);
});

test('authoredHref: the source analytics fragment goes, other fragments stay', () => {
  assert.equal(authoredHref('https://www.facebook.com/skodaglobal/#s_aid=abc_004_0'), 'https://www.facebook.com/skodaglobal/');
  assert.equal(authoredHref(`${LIVE}/en/contacts/#corporate`), `${LIVE}/en/contacts/#corporate`);
});

test('buildSectionNav: a source topbar without tabs is an error, not a nav the header misreads', () => {
  const d = new JSDOM(`<!DOCTYPE html><html><body>${SECTION}</body></html>`).window.document;
  d.querySelectorAll('.section-nav li').forEach((li) => li.remove());
  assert.throws(() => buildSectionNav(d, '/en/sustainable-offices/'), /no section tabs/);
});
