/* global globalThis */
/*
 * Unit tests for the story-import fixes from the Epiq side-by-side QA (2026-09-24):
 *   SKODA-816 story-hero parser, SKODA-817 aside teaser de-dup + Tags heading,
 *   SKODA-818 lite-youtube/iframe → bare URL, SKODA-820 related band → Story Rail.
 * Run: node --test tools/importer/transformers/skoda-story-importer.test.mjs
 *
 * jsdom is resolved from the import-validator toolchain (repo has no DOM lib); tests skip
 * cleanly if it is unavailable. WebImporter is stubbed with the three helpers these
 * modules use (DOMUtils.remove / DOMUtils.createTable / Blocks.createBlock).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

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

// Minimal WebImporter: a table's first row is the block name, the rest are cells.
function createTable(rows, doc) {
  const table = doc.createElement('table');
  rows.forEach((cells) => {
    const tr = doc.createElement('tr');
    cells.forEach((c) => {
      const td = doc.createElement('td');
      (Array.isArray(c) ? c : [c]).forEach((n) => {
        if (n === '' || n == null) return;
        td.append(typeof n === 'string' ? doc.createTextNode(n) : n);
      });
      tr.append(td);
    });
    table.append(tr);
  });
  return table;
}
globalThis.WebImporter = {
  DOMUtils: {
    remove(el, sels) { sels.forEach((s) => el.querySelectorAll(s).forEach((n) => n.remove())); },
    createTable,
  },
  Blocks: {
    createBlock(doc, { name, cells }) {
      return createTable([[name], ...Object.entries(cells)], doc);
    },
  },
};

const { default: storyHero } = await import('../parsers/story-hero.js');
const { default: storyCleanup } = await import('./skoda-story-cleanup.js');
const { default: storyAside } = await import('./skoda-story-aside.js');

function dom(html) {
  const d = new JSDOM(`<body>${html}</body>`);
  globalThis.document = d.window.document;
  return d.window.document;
}
const blockName = (table) => table.querySelector('tr td').textContent.trim();
const rowsOf = (table) => [...table.querySelectorAll('tr')].slice(1)
  .map((tr) => [...tr.children].map((td) => td.textContent.trim()));

// ---- SKODA-816 story hero ---------------------------------------------------

const HERO = `<div class="hero">
  <div class="hero-heading"><div class="container"><h1 class="heading">Epiq title</h1></div></div>
  <div class="hero-wrapper"><div class="container"><div class="hero-image"><img src="https://cdn.x/h.png" alt="Epiq"></div></div></div>
  <div class="hero-caption"><div class="container">
    <p class="perex">The perex. </p>
    <span class="published">15. 9. 2026</span>
    <span class="category"><a href="https://www.skoda-storyboard.com/en/category/emobility/" class="label">eMobility</a></span>
  </div></div></div>`;

test('story hero → Hero Image (image + h1), then perex, date, Tags(category)', { skip }, () => {
  const doc = dom(HERO);
  storyHero(doc.querySelector('.hero'), { document: doc });
  const kids = [...doc.body.children];
  assert.equal(blockName(kids[0]), 'Hero Image');
  assert.ok(kids[0].querySelector('img[src="https://cdn.x/h.png"]'), 'image row');
  assert.equal(kids[0].querySelector('h1').textContent, 'Epiq title');
  assert.equal(kids[1].tagName, 'P');
  assert.equal(kids[1].textContent, 'The perex.');
  assert.equal(kids[2].textContent, '15. 9. 2026');
  assert.equal(blockName(kids[3]), 'Tags');
  assert.equal(kids[3].querySelector('a').getAttribute('href'), 'https://www.skoda-storyboard.com/en/category/emobility/');
  assert.equal(kids.length, 4);
});

test('story hero tolerates a missing caption (authors omit cells)', { skip }, () => {
  const doc = dom('<div class="hero"><h1>Only title</h1></div>');
  storyHero(doc.querySelector('.hero'), { document: doc });
  const kids = [...doc.body.children];
  assert.equal(kids.length, 1);
  assert.equal(blockName(kids[0]), 'Hero Image');
});

test('story hero with no image and no heading unwraps', { skip }, () => {
  const doc = dom('<div class="hero"><p>stray</p></div>');
  storyHero(doc.querySelector('.hero'), { document: doc });
  assert.equal(doc.body.innerHTML, '<p>stray</p>');
});

// ---- SKODA-818 videos → bare URL --------------------------------------------

test('lite-youtube + consent shell → one bare watch-URL paragraph', { skip }, () => {
  const doc = dom(`<div class="textwidget"><p>Intro</p>
    <div class="page-embed yt-embed-cookie hidden"><div class="page-embed_cookie">consent</div></div>
    <lite-youtube videoid="1Y3QHmZeLxk"><picture><img src="p.jpg"></picture>Play<a href="https://www.youtube-nocookie.com/embed/1Y3QHmZeLxk">Play</a></lite-youtube></div>`);
  storyCleanup('beforeTransform', doc.body, {});
  const links = [...doc.querySelectorAll('a')];
  assert.equal(links.length, 1);
  assert.equal(links[0].getAttribute('href'), 'https://www.youtube.com/watch?v=1Y3QHmZeLxk');
  assert.equal(links[0].parentElement.tagName, 'P');
  assert.equal(links[0].parentElement.textContent, 'https://www.youtube.com/watch?v=1Y3QHmZeLxk');
  assert.ok(!doc.querySelector('.page-embed, lite-youtube, img'), 'shell + poster gone');
});

test('YouTube/Vimeo iframes (src or data-src, in a wrapper) → bare URL', { skip }, () => {
  const doc = dom(`<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/abcDEF123?rel=0"></iframe></div>
    <div class="embed-controller-wrapper"><iframe data-src="https://player.vimeo.com/video/1221703335?dnt=1"></iframe></div>
    <div class="embed-controller-wrapper"><iframe data-src="https://www.buzzsprout.com/1/2?iframe=true"></iframe></div>`);
  storyCleanup('beforeTransform', doc.body, {});
  const hrefs = [...doc.querySelectorAll('p > a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(hrefs, ['https://www.youtube.com/watch?v=abcDEF123', 'https://vimeo.com/1221703335']);
  assert.ok(doc.querySelector('iframe[data-src*="buzzsprout"]'), 'non-video embeds untouched (SKODA-604)');
});

// ---- SKODA-820 related band → Story Rail ------------------------------------

const RELATED = `<div class="container"><div class="columns"><div class="content"><p>Body</p></div>
  <div class="sidebar"><section class="tags"><h3 class="heading">Tags</h3><ol class="entry-tags">
    <li><a class="label" href="https://www.skoda-storyboard.com/en/tag/years/2026/">2026</a></li>
    <li><a class="label" href="https://www.skoda-storyboard.com/en/tag/model/epiq/">Epiq</a></li></ol></section></div></div></div>
  <div class="cover-box dark"><div class="search-results media-box">media</div></div>
  <div class="cover-box dark"><div class="search-results related-stories"><header>
    <h3 class="search-results-heading">Related Stories <span class="subheading">Based on tags: 2026, Epiq</span></h3></header>
    <div class="search-results-items"><article><a class="colorbox" href=""><img src="t.jpg"></a></article></div></div></div>`;
const PAYLOAD = { params: { originalURL: 'https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/' } };

const bandTeaser = (n) => `<div class="search-results-item"><article class="article-teaser">
  <div class="article-teaser-media"><a class="colorbox" href=""><img src="r${n}.jpg" alt="R${n}"></a>
  <div class="article-teaser-overlay"><div class="entry-meta"><span class="entry-published">${n}. 8. 2026</span></div>
  <h3 class="entry-title"><a href="https://www.skoda-storyboard.com/en/emobility/r${n}/">Related ${n}</a></h3></div></div>
  <a class="link-more" href="https://www.skoda-storyboard.com/en/emobility/r${n}/"></a></article></div>`;

test('related band with SSR teasers → curated Story Rail (image + date + linked title per row, source order)', { skip }, () => {
  const doc = dom(RELATED.replace(
    /<div class="search-results-items">[\s\S]*?<\/div><\/div><\/div>$/,
    `<div class="search-results-items">${bandTeaser(1)}${bandTeaser(2)}${bandTeaser(3)}</div></div></div>`,
  ));
  storyCleanup('afterTransform', doc.body, PAYLOAD);
  const rail = [...doc.querySelectorAll('table')].find((t) => blockName(t) === 'Story Rail');
  const rows = [...rail.querySelectorAll('tr')].slice(1);
  assert.equal(rows.length, 3, 'one row per teaser (outermost match only)');
  rows.forEach((tr, i) => {
    const [media, body] = tr.children;
    assert.equal(media.querySelector('img').getAttribute('src'), `r${i + 1}.jpg`);
    assert.equal(body.querySelector('p').textContent, `${i + 1}. 8. 2026`);
    const a = body.querySelector('h3 > a');
    assert.equal(a.textContent, `Related ${i + 1}`);
    assert.equal(a.getAttribute('href'), `https://www.skoda-storyboard.com/en/emobility/r${i + 1}/`);
  });
  assert.equal(doc.querySelector('h2').textContent, 'Related Stories');
});

test('related band restores a client-truncated teaser title from the image alt', { skip }, () => {
  const t = bandTeaser(1)
    .replace('alt="R1"', 'alt="Practical, fun, stylish. 5 reasons to choose the Epiq"')
    .replace('>Related 1<', '>Practical, fun, stylish. 5 reasons to…<');
  const doc = dom(RELATED.replace(
    /<div class="search-results-items">[\s\S]*?<\/div><\/div><\/div>$/,
    `<div class="search-results-items">${t}</div></div></div>`,
  ));
  storyCleanup('afterTransform', doc.body, PAYLOAD);
  assert.equal(doc.querySelector('table h3 a').textContent, 'Practical, fun, stylish. 5 reasons to choose the Epiq');
});

test('related band without teasers → index-driven Story Rail (specific tags, self excluded) + Style dark', { skip }, () => {
  const doc = dom(RELATED);
  storyCleanup('afterTransform', doc.body, PAYLOAD);
  const h2 = doc.querySelector('h2');
  assert.equal(h2.textContent, 'Related Stories');
  assert.equal(h2.previousElementSibling.tagName, 'HR', 'own section');
  assert.equal(h2.nextElementSibling.textContent, 'Based on tags: 2026, Epiq');
  const tables = [...doc.querySelectorAll('table')];
  const rail = tables.find((t) => blockName(t) === 'Story Rail');
  assert.deepEqual(rowsOf(rail), [
    ['template', 'story'],
    ['tags', 'epiq'], // year tag dropped: the rail ORs tag values
    ['limit', '10'],
    ['exclude', 'skoda-epiq-will-win-you-over-in-just-a-few-seconds'],
  ]);
  const meta = tables.find((t) => blockName(t) === 'Section Metadata');
  assert.deepEqual(rowsOf(meta), [['Style', 'dark']]);
  assert.ok(!doc.querySelector('.media-box'), 'Media Box band still dropped (SKODA-604)');
  assert.ok(!doc.querySelector('.related-stories, .cover-box'), 'SSR teasers not copied');
});

test('related band keeps year tags when they are the only tags', { skip }, () => {
  const doc = dom(RELATED.replace(/<li><a class="label" href="[^"]*model\/epiq\/">Epiq<\/a><\/li>/, ''));
  storyCleanup('afterTransform', doc.body, PAYLOAD);
  const rail = [...doc.querySelectorAll('table')].find((t) => blockName(t) === 'Story Rail');
  assert.deepEqual(rowsOf(rail)[1], ['tags', '2026']);
});

// ---- SKODA-817 aside teaser de-dup + Tags heading ----------------------------

const teaser = (n) => `<div class="widget"><div class="article-teaser"><article>
  <a href="https://www.skoda-storyboard.com/en/s${n}/"><img src="i${n}.jpg" alt="A${n}"></a>
  <h2 class="title">Story ${n}</h2></article></div></div>`;
const ASIDE = `<div class="columns"><div class="content"></div><div class="sidebar">
  <section class="related"><h3 class="heading sidebar-heading">Explore more</h3>${teaser(1)}${teaser(2)}${teaser(3)}</section>
  <section class="tags"><h3 class="heading sidebar-heading">Tags</h3><ol class="entry-tags">
    <li><a class="label" href="/en/tag/model/epiq/">Epiq</a></li></ol></section></div></div>`;

test('nested div.article-teaser > article yields ONE card per teaser, each with image + title', { skip }, () => {
  const doc = dom(ASIDE);
  storyAside('afterTransform', doc.body, {});
  const cards = [...doc.querySelectorAll('table')].find((t) => blockName(t) === 'Cards');
  const rows = [...cards.querySelectorAll('tr')].slice(1);
  assert.equal(rows.length, 3);
  rows.forEach((tr, i) => {
    assert.ok(tr.querySelector('img'), `row ${i + 1} has its image`);
    assert.equal(tr.querySelector('a').textContent, `Story ${i + 1}`);
  });
});

test('aside emits the "Tags" heading before the existing Tags block', { skip }, () => {
  const doc = dom(ASIDE);
  storyAside('afterTransform', doc.body, {});
  const headings = [...doc.querySelectorAll('h2')].map((h) => h.textContent);
  assert.deepEqual(headings, ['Explore more', 'Tags']);
  const tagsTable = [...doc.querySelectorAll('table')].find((t) => blockName(t) === 'Tags');
  assert.equal(doc.querySelectorAll('h2')[1].nextElementSibling, tagsTable);
});
