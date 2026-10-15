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

test('story hero keeps image, h1, perex and same-row date/category inside Hero Image', { skip }, () => {
  const doc = dom(HERO);
  storyHero(doc.querySelector('.hero'), { document: doc });
  const kids = [...doc.body.children];
  assert.equal(kids.length, 1);
  assert.equal(blockName(kids[0]), 'Hero Image');
  const rows = [...kids[0].querySelectorAll('tr')].slice(1);
  assert.equal(rows.length, 4);
  assert.ok(rows[0].querySelector('img[src="https://cdn.x/h.png"]'), 'image row');
  assert.equal(rows[1].querySelector('h1').textContent, 'Epiq title');
  assert.equal(rows[2].textContent, 'The perex.');
  const meta = rows[3].querySelector('p');
  assert.equal(meta.querySelector('time[datetime="2026-09-15"]').textContent, '15. 9. 2026');
  assert.equal(meta.querySelector('a').getAttribute('href'), 'https://www.skoda-storyboard.com/en/category/emobility/');
  assert.equal(meta.querySelector('a').textContent, 'eMobility');
  assert.equal(doc.querySelectorAll('table').length, 1, 'no separate hero Tags block');
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

test('story hero handles omitted perex, date or category without empty rows', { skip }, () => {
  const noPerex = dom(HERO.replace('<p class="perex">The perex. </p>', ''));
  storyHero(noPerex.querySelector('.hero'), { document: noPerex });
  assert.equal(noPerex.querySelectorAll('tr').length, 4);
  assert.equal(noPerex.querySelector('time').getAttribute('datetime'), '2026-09-15');
  const noDate = dom(HERO.replace('<span class="published">15. 9. 2026</span>', ''));
  storyHero(noDate.querySelector('.hero'), { document: noDate });
  assert.equal(noDate.querySelectorAll('tr').length, 5);
  assert.equal(noDate.querySelector('tr:last-child a').textContent, 'eMobility');
  const noCategory = dom(HERO.replace(/<span class="category">.*?<\/span>/, ''));
  storyHero(noCategory.querySelector('.hero'), { document: noCategory });
  assert.equal(noCategory.querySelectorAll('tr').length, 5);
  assert.equal(noCategory.querySelector('tr:last-child time').textContent, '15. 9. 2026');
});

test('story hero takes the largest srcset copy up to 2560w (SKODA-828 F6)', { skip }, () => {
  const srcset = 'https://cdn.x/h-1920x1281.jpg 1920w, https://cdn.x/h-768x512.jpg 768w, '
    + 'https://cdn.x/h-2560x1708.jpg 2560w, https://cdn.x/h-3840x2562.jpg 3840w';
  const doc = dom(HERO.replace('src="https://cdn.x/h.png"', `src="https://cdn.x/h-768x512.jpg" srcset="${srcset}" sizes="100vw"`));
  storyHero(doc.querySelector('.hero'), { document: doc });
  const img = doc.querySelector('table img');
  assert.equal(img.getAttribute('src'), 'https://cdn.x/h-2560x1708.jpg');
  assert.equal(img.hasAttribute('srcset'), false);
  assert.equal(img.hasAttribute('sizes'), false);
  // no srcset: the authored src stays
  const plain = dom(HERO);
  storyHero(plain.querySelector('.hero'), { document: plain });
  assert.equal(plain.querySelector('table img').getAttribute('src'), 'https://cdn.x/h.png');
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

test('YouTube/Vimeo iframes (src or data-src, in a wrapper) → bare URL; a YouTube iframe keeps its player URL', { skip }, () => {
  const doc = dom(`<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/abcDEF123?rel=0"></iframe></div>
    <div class="embed-controller-wrapper"><iframe data-src="https://player.vimeo.com/video/1221703335?dnt=1"></iframe></div>
    <p><iframe src="https://www.youtube.com/embed/m9RlQw2FGjc?feature=oembed&amp;enablejsapi=1"></iframe></p>
    <div class="embed-controller-wrapper"><iframe data-src="https://www.buzzsprout.com/1/2?iframe=true"></iframe></div>`);
  storyCleanup('beforeTransform', doc.body, {});
  const hrefs = [...doc.querySelectorAll('p > a')].map((a) => a.getAttribute('href'));
  // the source shows YouTube's own player for an iframe, the poster for a lite-youtube (#youtube parity)
  assert.deepEqual(hrefs, ['https://www.youtube-nocookie.com/embed/abcDEF123?rel=0', 'https://vimeo.com/1221703335',
    'https://www.youtube.com/embed/m9RlQw2FGjc?feature=oembed&enablejsapi=1']);
  assert.ok(doc.querySelector('iframe[data-src*="buzzsprout"]'), 'non-video embeds untouched (SKODA-604)');
});

// ---- SKODA-801a WordPress [video] (MediaElement.js) → Embed -----------------

// The DOM the importer sees after MediaElement.js hydrated the shortcode (trimmed).
const WP_VIDEO = `<p>Before</p><div style="width: 1920px;" class="wp-video"><span class="mejs-offscreen">Video Player</span>
  <div class="mejs-container wp-video-shortcode mejs-video"><div class="mejs-inner">
    <div class="mejs-mediaelement"><mediaelementwrapper><video class="wp-video-shortcode" poster="https://cdn.x/2026/02/poster.jpg" preload="metadata">
      <source type="video/mp4" src="https://cdn.x/2026/02/clip_16-9.mp4?_=1"><a href="https://cdn.x/2026/02/clip_16-9.mp4">https://cdn.x/2026/02/clip_16-9.mp4</a></video></mediaelementwrapper></div>
    <div class="mejs-layers"><div class="mejs-poster mejs-layer"><img src="https://cdn.x/2026/02/poster.jpg"></div></div>
    <div class="mejs-controls"><div class="mejs-button mejs-playpause-button"><button type="button">Play</button></div>
      <div class="mejs-time mejs-currenttime-container"><span class="mejs-currenttime">00:00</span></div>
      <div class="mejs-time mejs-duration-container"><span class="mejs-duration">00:53</span></div>
      <div class="mejs-volume-button"><a href="javascript:void(0);" class="mejs-volume-slider"><span class="mejs-offscreen">Use Up/Down Arrow keys to increase or decrease volume.</span></a></div>
    </div></div></div></div><p>After</p>`;

test('WordPress MediaElement video → one Embed table (url without ?_=, poster); no player chrome', { skip }, () => {
  const doc = dom(WP_VIDEO);
  storyCleanup('beforeTransform', doc.body, {});
  const tables = [...doc.querySelectorAll('table')];
  assert.equal(tables.length, 1);
  assert.equal(blockName(tables[0]), 'Embed');
  assert.deepEqual(rowsOf(tables[0])[0], ['url', 'https://cdn.x/2026/02/clip_16-9.mp4']);
  assert.equal(tables[0].querySelector('tr:nth-child(3) img').getAttribute('src'), 'https://cdn.x/2026/02/poster.jpg');
  assert.ok(!doc.querySelector('[class*="mejs"], a[href^="javascript:"], video'), 'player chrome gone');
  assert.doesNotMatch(doc.body.textContent, /00:00|00:53|Arrow keys/);
  assert.match(doc.body.textContent, /Before[\s\S]*After/);
});

test('WordPress video without a poster emits only the url row', { skip }, () => {
  const doc = dom('<div class="wp-video"><video src="https://cdn.x/v.webm"></video></div>');
  storyCleanup('beforeTransform', doc.body, {});
  const table = doc.querySelector('table');
  assert.equal(blockName(table), 'Embed');
  assert.deepEqual(rowsOf(table), [['url', 'https://cdn.x/v.webm']]);
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
  <img src="r${n}.jpg" alt="R${n}"><h3 class="entry-title"><a href="/en/emobility/r${n}/">Related ${n}</a></h3></article></div>`;

test('related band → hr + h3 + subheading + index Story Rail (model AND years, self excluded) + Style dark', { skip }, () => {
  const doc = dom(RELATED);
  storyCleanup('afterTransform', doc.body, PAYLOAD);
  // h3, as the source .search-results-heading (#296)
  assert.equal(doc.querySelector('h2'), null);
  const title = [...doc.querySelectorAll('h3')].find((h) => h.textContent === 'Related Stories');
  assert.ok(title, 'the band title is an h3');
  assert.equal(title.previousElementSibling.tagName, 'HR', 'own section');
  assert.equal(title.nextElementSibling.textContent, 'Based on tags: 2026, Epiq');
  const tables = [...doc.querySelectorAll('table')];
  const rail = tables.find((t) => blockName(t) === 'Story Rail');
  assert.deepEqual(rowsOf(rail), [
    ['template', 'story'],
    ['model', 'epiq'], // one row per facet column: the rail ANDs across keys
    ['years', '2026'],
    ['limit', '10'],
    ['exclude', 'skoda-epiq-will-win-you-over-in-just-a-few-seconds'],
  ]);
  const meta = tables.find((t) => blockName(t) === 'Section Metadata');
  assert.deepEqual(rowsOf(meta), [['Style', 'dark']]);
  assert.ok(!doc.querySelector('.media-box'), 'Media Box band still dropped (SKODA-604)');
  assert.ok(!doc.querySelector('.related-stories, .cover-box'), 'band removed');
});

test('related band never copies the SSR teasers (index-driven only)', { skip }, () => {
  const doc = dom(RELATED.replace(
    '<article><a class="colorbox" href=""><img src="t.jpg"></a></article>',
    bandTeaser(1) + bandTeaser(2),
  ));
  storyCleanup('afterTransform', doc.body, PAYLOAD);
  const rail = [...doc.querySelectorAll('table')].find((t) => blockName(t) === 'Story Rail');
  assert.ok(!rail.querySelector('img, h3'), 'no curated card rows');
  assert.deepEqual(rowsOf(rail).map((r) => r[0]), ['template', 'model', 'years', 'limit', 'exclude']);
});

// the source related-band card (cs Epiq story, 2026-10-13)
const sourceCard = (n, { img = true, date = true, title = true } = {}) => `<article class="article-teaser">
  <div class="article-teaser-media"><div class="entry-thumbnail"><a class="colorbox" href="">${img ? `<img src="https://cdn.skoda-storyboard.com/r${n}-768x432.png" alt="${n === 2 ? 'Jiný text' : `Příběh ${n} celý název`}" srcset="x 768w" sizes="100vw" data-caption="c" loading="eager">` : ''}</a></div></div>
  <div class="article-teaser-overlay"><div class="article-teaser-container">
    ${date ? `<div class="entry-meta"><span class="entry-published">1${n}. 10. 2026</span></div>` : ''}
    <h3 class="entry-title">${title ? `<a href="https://www.skoda-storyboard.com/cs/e-mobilita-cs/r${n}/">Příběh ${n}…</a>` : '<a href="">'}</a></h3>
  </div></div></article>`;
const CS_PAYLOAD = { params: { originalURL: 'https://www.skoda-storyboard.com/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund/' } };

test('translated story: the related band keeps the source cards as a curated Story Rail (#243)', { skip }, () => {
  const doc = dom(RELATED
    .replace('Related Stories <span class="subheading">Based on tags: 2026, Epiq</span>', 'Související články <span class="subheading">Na základě štítků: 2026, Epiq</span>')
    .replace('<article><a class="colorbox" href=""><img src="t.jpg"></a></article>', sourceCard(1) + sourceCard(2, { date: false }) + sourceCard(3, { img: false }) + sourceCard(4, { title: false })));
  storyCleanup('afterTransform', doc.body, CS_PAYLOAD);
  const title = [...doc.querySelectorAll('h3')].find((h) => h.textContent === 'Související články');
  assert.ok(title, 'the source heading, as an h3');
  assert.equal(title.nextElementSibling.textContent, 'Na základě štítků: 2026, Epiq');
  const tables = [...doc.querySelectorAll('table')];
  const rail = tables.find((t) => blockName(t) === 'Story Rail');
  // card rows only: no config rows next to them (block contract `or-curated`)
  const cards = [...rail.querySelectorAll('tr')].slice(1);
  assert.equal(cards.length, 3, 'the untitled card is skipped');
  // card 1: image (source attributes stripped), date, linked title
  const img = cards[0].children[0].querySelector('img');
  assert.equal(img.getAttribute('src'), 'https://cdn.skoda-storyboard.com/r1-768x432.png');
  assert.equal(img.getAttribute('alt'), 'Příběh 1 celý název');
  ['srcset', 'sizes', 'data-caption', 'loading'].forEach((a) => assert.equal(img.hasAttribute(a), false, a));
  assert.equal(cards[0].children[1].querySelector('p').textContent, '11. 10. 2026');
  const link = cards[0].children[1].querySelector('h3 a');
  assert.equal(link.getAttribute('href'), 'https://www.skoda-storyboard.com/cs/e-mobilita-cs/r1/');
  // the browser-clipped title ("Příběh 1…") is restored from the alt, which continues it
  assert.equal(link.textContent, 'Příběh 1 celý název');
  // card 2: no date paragraph, and an alt that doesn't continue the title keeps the title;
  // card 3: body only (no image cell, no alt), the clipped title kept
  assert.equal(cards[1].children[1].querySelector('p'), null);
  assert.equal(cards[1].children[1].querySelector('h3 a').textContent, 'Příběh 2…');
  assert.equal(cards[2].children[0].querySelector('h3 a').textContent, 'Příběh 3…');
  assert.equal(cards[2].children.length, 1);
  assert.ok(cards[2].children[0].querySelector('h3 a'));
  // no index config on a translated story
  assert.ok(!rowsOf(rail).some((r) => ['template', 'model', 'years', 'limit', 'exclude'].includes(r[0])));
  assert.deepEqual(rowsOf(tables.find((t) => blockName(t) === 'Section Metadata')), [['Style', 'dark']]);
  assert.ok(!doc.querySelector('.related-stories, .cover-box'), 'band removed');
});

test('translated story: a clipped title is restored only from an alt that continues it word for word (#348 review)', { skip }, () => {
  const card = (n, title, alt) => `<article class="article-teaser">
    <div class="article-teaser-media"><a class="colorbox" href=""><img src="https://cdn.skoda-storyboard.com/c${n}.png" alt="${alt}"></a></div>
    <h3 class="entry-title"><a href="https://www.skoda-storyboard.com/cs/e-mobilita-cs/c${n}/">${title}</a></h3></article>`;
  const doc = dom(RELATED.replace('<article><a class="colorbox" href=""><img src="t.jpg"></a></article>', [
    card(1, 'Škoda Epiq nově…', 'Škoda Epiq nově&lt;br&gt;obléká efektní soupravu'), // a literal <br> in the source alt
    card(2, 'Škoda…', 'Škoda Epiq at the Milan premiere'), // a one-word clip: the alt may be a caption
    card(3, 'Epiq a design…', 'Epiq a designérský tým v Miláně'), // the alt doesn't continue at a word boundary
    card(4, 'Rekordní rok…', 'Rekordní rok, i díky elektromobilům'), // punctuation is a word boundary
  ].join('')));
  storyCleanup('afterTransform', doc.body, CS_PAYLOAD);
  const rail = [...doc.querySelectorAll('table')].find((t) => blockName(t) === 'Story Rail');
  const cards = [...rail.querySelectorAll('tr')].slice(1);
  assert.deepEqual(cards.map((tr) => tr.querySelector('h3 a').textContent), [
    'Škoda Epiq nově obléká efektní soupravu',
    'Škoda…',
    'Epiq a design…',
    'Rekordní rok, i díky elektromobilům',
  ]);
  assert.equal(cards[0].querySelector('img').getAttribute('alt'), 'Škoda Epiq nově obléká efektní soupravu', 'the moved image alt is plain text too');
});

test('translated story: a related band without source cards is dropped (#243)', { skip }, () => {
  const doc = dom(RELATED.replace('<article><a class="colorbox" href=""><img src="t.jpg"></a></article>', ''));
  storyCleanup('afterTransform', doc.body, CS_PAYLOAD);
  assert.ok(![...doc.querySelectorAll('table')].some((t) => blockName(t) === 'Story Rail'));
  assert.ok(![...doc.querySelectorAll('h3')].some((h) => h.textContent === 'Related Stories'));
  assert.ok(!doc.querySelector('.cover-box'));
});

test('related band: values of one taxonomy share a key; non-facet tags use `tags`', { skip }, () => {
  const doc = dom(RELATED.replace(
    '</ol>',
    '<li><a href="/en/tag/model/peaq/">Peaq</a></li><li><a href="/en/tag/cycling/tour/">Tour</a></li></ol>',
  ));
  storyCleanup('afterTransform', doc.body, PAYLOAD);
  const rail = [...doc.querySelectorAll('table')].find((t) => blockName(t) === 'Story Rail');
  const rows = rowsOf(rail);
  assert.deepEqual(rows.find((r) => r[0] === 'model'), ['model', 'epiq, peaq']);
  assert.deepEqual(rows.find((r) => r[0] === 'tags'), ['tags', 'tour']);
});

test('related band is dropped when the story has no tags', { skip }, () => {
  const doc = dom(RELATED.replace(/<li>.*?<\/li>/gs, ''));
  storyCleanup('afterTransform', doc.body, PAYLOAD);
  assert.ok(![...doc.querySelectorAll('table')].some((t) => blockName(t) === 'Story Rail'));
  assert.ok(!doc.querySelector('.cover-box'));
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
  const cards = [...doc.querySelectorAll('table')].find((t) => blockName(t) === 'Cards (overlay)');
  const rows = [...cards.querySelectorAll('tr')].slice(1);
  assert.equal(rows.length, 3);
  rows.forEach((tr, i) => {
    assert.ok(tr.querySelector('img'), `row ${i + 1} has its image`);
    // the linked title is a heading, so the card reads it as the title (not a toolbar)
    assert.equal(tr.querySelector('h3 > a').textContent, `Story ${i + 1}`);
  });
});

test('aside emits the "Tags" heading before the existing Tags block', { skip }, () => {
  const doc = dom(ASIDE);
  storyAside('afterTransform', doc.body, {});
  // h3, as the source h3.sidebar-heading (#296); the cards' titles are inside the Cards table
  const asideHeadings = [...doc.querySelectorAll('h3')].filter((h) => !h.closest('table'));
  assert.deepEqual(asideHeadings.map((h) => h.textContent), ['Explore more', 'Tags']);
  assert.equal(doc.querySelectorAll('h2').length, 0);
  const tagsTable = [...doc.querySelectorAll('table')].find((t) => blockName(t) === 'Tags');
  assert.equal(asideHeadings[1].nextElementSibling, tagsTable);
});

// --- story drop cap + photo grid (#516 PO: "below that images are not there as per live") -------
const { markDropCap, applyDropCap } = await import('./skoda-drop-cap.js');
const { default: mediaParser } = await import('../parsers/press-kit-media.js');

const meta = (doc, style) => createTable([['Section Metadata'], ['style', style]], doc);
const metaRows = (table) => [...table.querySelectorAll('tr')].slice(1).map((tr) => [...tr.children].map((td) => td.textContent));

test('drop cap: the source letters and inline colours → the opening body section\'s metadata', { skip }, () => {
  const { document } = new JSDOM(`<article><div class="entry-content"><div class="textwidget">
    <p><span class="drop-cap" style="background-color: #df8029; color: #ffffff;margin-bottom:20px">M</span>any years</p></div></div></article>`).window;
  assert.deepEqual(markDropCap(document), {
    text: 'M', color: '#ffffff', background: '#df8029', marginBottom: '20px',
  });
  // the transformed page: the intro section, then the body with its own metadata
  const main = document.body;
  main.innerHTML = '<p>Perex</p><hr><p>Many years</p><p>More</p>';
  const intro = meta(document, 'story-intro');
  const body = meta(document, 'body-column');
  main.prepend(intro);
  main.querySelector('hr').after(body);
  assert.equal(applyDropCap(main), true);
  assert.deepEqual(metaRows(intro), [['style', 'story-intro']], 'the intro is untouched');
  assert.deepEqual(metaRows(body), [['style', 'body-column, drop-cap'], ['drop-cap-text', 'M'],
    ['drop-cap-color', '#ffffff'], ['drop-cap-background', '#df8029'], ['drop-cap-margin-bottom', '20px']]);
  assert.equal(document.documentElement.hasAttribute('data-skoda-drop-cap'), false, 'the mark is cleared');
});

test('drop cap: only colour rows the source sets; none when the body does not open with the letters', { skip }, () => {
  const { document } = new JSDOM('<article><div class="entry-content"><p><span class="drop-cap">I</span>n the snow</p></div></article>').window;
  markDropCap(document);
  const main = document.body;
  main.innerHTML = '<hr><p>In the snow</p>';
  const body = meta(document, 'body-column');
  main.querySelector('hr').after(body);
  applyDropCap(main);
  assert.deepEqual(metaRows(body), [['style', 'body-column, drop-cap'], ['drop-cap-text', 'I']]);

  markDropCap(document);
  main.innerHTML = '<hr><h2>Heading</h2><p>Other text</p>';
  const other = meta(document, 'body-column');
  main.querySelector('hr').after(other);
  assert.equal(applyDropCap(main), false, 'never guess');
  assert.deepEqual(metaRows(other), [['style', 'body-column']]);
  const none = new JSDOM('<article><div class="entry-content"><p>Plain</p></div></article>').window.document;
  assert.equal(markDropCap(none), null);
});

const galleryItem = (name, toggle = '') => `<div class="search-results-item"><article class="article-teaser gallery-item media-cart-item">
  <div class="article-teaser-media"><a class="colorbox" href="https://cdn.example/${name}.jpg"><img src="https://cdn.example/${name}-768x512.jpg" alt="Story title"></a></div>
  <h3 class="entry-title">Story title</h3>
  <div class="media-cart-action-multi download"><a href="https://example/direct-download/${name}.jpg">Original</a><a href="https://example/direct-download/${name}-1920x1280.jpg">1920px</a></div>
</article></div>${toggle}`;

test('story photo grid: Downloads (gallery, story), collapsed only where the source has its togglebox', { skip }, () => {
  const { document } = new JSDOM(`<div class="textwidget"><div class="search-results search-results-gallery"><div class="search-results-container">
    <div class="search-results-items">${galleryItem('a')}${galleryItem('b')}</div></div></div></div>`).window;
  mediaParser(document.querySelector('.search-results-gallery'), { document }, { story: true });
  const table = document.querySelector('table');
  const rows = [...table.querySelectorAll('tr')].map((tr) => [...tr.children].map((td) => td.textContent.trim()));
  assert.deepEqual(rows.slice(0, 3), [['Downloads (gallery, story)'], ['collapse', 'none'], ['columns', '3']], '3 wide, every photo shown');
  assert.equal(rows.length, 5, 'one row per photo');
  assert.equal(table.querySelectorAll('a[href*="direct-download"]').length, 4, 'the lightbox keeps the download sizes');

  const long = new JSDOM(`<div class="textwidget"><div class="search-results search-results-gallery"><div class="search-results-items" data-togglebox="">
    ${galleryItem('a')}${galleryItem('b')}</div></div></div>`).window.document;
  mediaParser(long.querySelector('.search-results-gallery'), { document: long }, { story: true });
  const cfg = [...long.querySelectorAll('table tr')].slice(1, 3).map((tr) => tr.textContent.replace(/\s+/g, ''));
  assert.deepEqual(cfg, ['collapseauto', 'columns4'], 'the source togglebox: the Media Box grid, collapsed');

  const kit = new JSDOM(`<div class="search-results search-results-gallery"><div class="search-results-items">${galleryItem('a')}</div></div>`).window.document;
  mediaParser(kit.querySelector('.search-results-gallery'), { document: kit });
  assert.equal(kit.querySelector('table tr').textContent.trim(), 'Downloads (gallery)', 'press kits unchanged');
});

test('the story cleanup keeps an importer-built block table (data-skoda-block) as it is', { skip }, async () => {
  const { default: storyCleanup } = await import('./skoda-story-cleanup.js');
  const { document } = new JSDOM('<article><div class="entry-content"><table data-skoda-block><tr><td>Downloads (gallery, story)</td></tr></table><table><tr><td>a</td><td>b</td></tr></table></div></article>').window;
  storyCleanup('beforeTransform', document.body, { document });
  const tables = [...document.querySelectorAll('table')];
  assert.equal(tables[0].textContent.trim(), 'Downloads (gallery, story)', 'kept');
  assert.equal(tables[1].querySelector('tr').textContent.trim(), 'Columns', 'a source table still becomes Columns');
});
