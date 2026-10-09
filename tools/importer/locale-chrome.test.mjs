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
  localeOfUrl, authoredHref, buildNav, buildNewsletter, buildFooter,
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

test('localeOfUrl / authoredHref: the locale segment; live links become site paths, #… and others stay', () => {
  assert.equal(localeOfUrl(`${LIVE}/cs/e-mobilita-cs/x/`), 'cs');
  assert.equal(authoredHref(`${LIVE}/cs/category/modely-cs/`), '/cs/category/modely-cs/');
  assert.equal(authoredHref('#subscribe'), '#subscribe');
  assert.equal(authoredHref('https://www.facebook.com/skoda.cz/'), 'https://www.facebook.com/skoda.cz/');
  assert.equal(authoredHref(''), '');
});

test('buildNav: the 4 sections of /nav (topbar, brand, menu, search), in the locale', () => {
  const s = sections(buildNav(doc(), 'cs'));
  assert.equal(s.length, 4);
  const [topbar, brand, menu, search] = s;
  assert.deepEqual(links(topbar[0]), ['Stories=/cs/', 'Media Room=/cs/media-room/']);
  assert.deepEqual(links(topbar[1]), ['Odebírat články=#subscribe']);
  assert.equal(topbar[2].innerHTML, '<a href="/en/">EN</a> <strong>CZ</strong> <a href="/de/">DE</a> <a href="/sk/">SK</a> <a href="/sr/">SR</a> <a href="/sl/">SL</a>');
  assert.deepEqual(links(brand[0]), ['Škoda Storyboard=/cs/']);
  const items = [...menu[0].children];
  assert.deepEqual(links(items[0]), ['Modely=/cs/category/modely-cs/', 'Modely=/cs/category/modely-cs/', 'Fabia=/cs/tag/model/fabia-cs/'], 'the heading kept once, as /nav');
  assert.deepEqual(links(items[1]), ['eMobilita=/cs/category/e-mobilita-cs/'], 'a lone heading is no sub-list');
  assert.deepEqual(links(items[2]), ['Newsletter=#newsletter']);
  assert.deepEqual(links(search[0]), ['Vyhledat=/cs/hledat/']);
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
      ['consent', '<div>Tímto uděluji <a href="/cs/souhlas/">souhlas se zpracováním</a> svých údajů.</div>'],
      ['manage', '<a href="/cs/sprava-newsletteru/">Správa newsletteru</a>'],
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
  assert.deepEqual(links(menu[0]), ['Modely=/cs/category/modely-cs/', 'Fabia=/cs/tag/model/fabia-cs/']);
  assert.equal(legal[0].innerHTML, 'Více na <a href="https://www.skoda-auto.cz/ochrana/">Ochrana&nbsp;údajů</a>, <a href="/cs/copyright/">Copyright</a>.');
  assert.equal(legal[1].textContent, '© Škoda Auto a.s. 2026');
  assert.deepEqual(links(legal[2]), ['RSS=/cs/feed/']);
});

test('a page without the chrome: empty fragments, no throw', () => {
  const bare = new JSDOM('<!DOCTYPE html><html><body><p>x</p></body></html>', { url: `${LIVE}/cs/x/` }).window.document;
  assert.equal(buildFooter(bare).children.length, 0);
  assert.equal(buildNewsletter(bare, 'cs').children.length, 0);
  assert.equal(sections(buildNav(bare, 'cs')).length, 4, 'the nav keeps its 4 sections');
});

test('buildNav: a topbar without Subscribe (DE / SK / SR on the source) authors none', () => {
  const d = doc();
  d.querySelector('.topbar__newsletter').remove();
  const [topbar] = sections(buildNav(d, 'de'));
  assert.equal(topbar.length, 2, 'switcher + locale row');
  assert.equal(topbar[1].querySelector('strong').textContent, 'DE');
  assert.equal(topbar.some((el) => el.querySelector('a[href="#subscribe"]')), false);
});
