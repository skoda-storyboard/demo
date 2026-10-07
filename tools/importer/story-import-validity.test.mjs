/* global globalThis */
/*
 * SKODA-830 (import validity audit 2026-10-05, F3 + F4 / SKODA-801a): the story importer
 * (import-story-detail.js) on 5 trimmed source stories.
 *   F4  Media Box band → its own `dark, full-width, media-box` section with a Downloads table
 *   4.3 sb-gallery / colorbox lightbox chrome never lands as content
 *   4.4 gallery captions are the visible item description, never alt / page title
 *   4.6 a body data table → Columns, header row kept (no `version` block)
 *   4.7 quiz: no hidden JSON, no checkbox / button / result UI; questions + images kept
 *   4.9 series-nav teaser grid → Cards (overlay), no "Show more Show less"
 *   4.11 the tag row's "+N" toggle is not a tag
 * Fixtures: test/fixtures/story-detail/<slug>.html (source pages, scripts and site chrome
 * removed; test/* is .hlxignore'd). The pipeline runs on jsdom with a minimal WebImporter
 * stub, and the output is read the way DA reads it (see press-release.test.mjs).
 * Run: node --test tools/importer/story-import-validity.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../test/fixtures/story-detail');
const SRC = 'https://www.skoda-storyboard.com/en';
const PAGES = {
  como: 'lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como',
  cruise: 'skoda-world/making-driving-easier-how-cruise-control-works',
  epiq: 'emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq',
  quiz: 'skoda-world/quiz-can-you-recognise-skoda-models-by-their-details',
  elroq: 'models/skoda-elroq-through-designers-eyes',
};

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
const toRows = (cells) => Object.entries(cells).map(([k, v]) => [k, v]);
globalThis.WebImporter = {
  DOMUtils: {
    remove(el, sels) { sels.forEach((s) => el.querySelectorAll(s).forEach((n) => n.remove())); },
    createTable,
  },
  Blocks: {
    createBlock(doc, { name, cells }) { return createTable([[name], ...toRows(cells)], doc); },
    getMetadataBlock(doc, meta) { return createTable([['Metadata'], ...toRows(meta)], doc); },
  },
  rules: { transformBackgroundImages() {}, adjustImageUrls() {} },
  FileUtils: { sanitizePath: (p) => p },
};

const importer = JSDOM ? (await import('./import-story-detail.js')).default : null;

// What @adobe/helix-importer PageImporter.preProcess does before `transform`: drop every
// <hr> and every empty inline element (unless it holds an img/video/iframe/div/picture).
const KEEP = 'img, video, iframe, div, picture';
function helixPreProcess(doc) {
  doc.querySelectorAll('hr').forEach((n) => n.remove());
  ['b', 'a', 'em', 'i', 'strong', 'small', 'u'].forEach((tag) => {
    [...doc.querySelectorAll(tag)].reverse().forEach((n) => {
      if (n.textContent === '' && !n.querySelector(KEEP)) n.remove();
    });
  });
}

const txt = (n) => (n.textContent || '').replace(/\s+/g, ' ').trim();
const blockName = (table) => txt(table.querySelector('tr td'));
const rowsOf = (table) => [...table.querySelectorAll(':scope > tr')].slice(1);
const stem = (src) => (src || '').split('/').pop().replace(/-\d+x\d+(?=\.\w+$)/, '');

/** Top-level output nodes split at <hr> into sections: [{ nodes, blocks, style }]. */
function sectionsOf(element) {
  const out = [{ nodes: [] }];
  const walk = (parent) => [...parent.children].forEach((n) => {
    if (n.tagName === 'HR') out.push({ nodes: [] });
    else if (n.tagName === 'TABLE' || !n.querySelector('hr')) out[out.length - 1].nodes.push(n);
    else walk(n);
  });
  walk(element);
  return out.map((s) => {
    const tables = s.nodes.flatMap((n) => (n.tagName === 'TABLE' ? [n] : [...n.querySelectorAll('table')]))
      .filter((t) => !t.parentElement.closest('table'));
    const meta = tables.find((t) => blockName(t) === 'Section Metadata');
    const style = meta ? txt(rowsOf(meta)[0].children[1]) : null;
    const blocks = tables.filter((t) => t !== meta);
    return {
      ...s, style, tables: blocks, blocks: blocks.map(blockName),
    };
  });
}

const cache = {};
function importPage(key) {
  if (cache[key]) return cache[key];
  const slug = PAGES[key];
  const url = `${SRC}/${slug}/`;
  const dom = new JSDOM(readFileSync(path.join(FIXTURES, `${slug.split('/').pop()}.html`), 'utf8'), { url });
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;
  importer.preprocess({ document: dom.window.document });
  helixPreProcess(dom.window.document);
  const [{ element }] = importer.transform({
    document: dom.window.document, url, params: { originalURL: url },
  });
  cache[key] = { element, sections: sectionsOf(element), text: txt(element) };
  return cache[key];
}
const allTables = (element, name) => [...element.querySelectorAll('table')].filter((t) => blockName(t) === name);

// ---- F4: Media Box → Downloads (SKODA-801a) -----------------------------------------

test('Media Box → its own dark media-box section: h2, stats line, Downloads; before the related band', { skip }, () => {
  Object.keys(PAGES).forEach((k) => {
    const { sections } = importPage(k);
    const styles = sections.map((s) => s.style);
    const i = styles.indexOf('dark, full-width, media-box');
    assert.ok(i > 0, `${k}: media-box section`);
    assert.equal(styles.filter((s) => s === 'dark, full-width, media-box').length, 1, `${k}: one Media Box`);
    assert.equal(styles[i - 1], 'sidebar', `${k}: after the aside`);
    // the related band follows when the source has one (the Elroq designers story has none)
    if (k !== 'elroq') assert.equal(styles[i + 1], 'dark', `${k}: before the related band`);
    else assert.equal(i, styles.length - 1, 'elroq: last section');
    const box = sections[i];
    assert.deepEqual(box.blocks.filter((b) => b !== 'Metadata'), ['Downloads'], k);
    const heads = box.nodes.filter((n) => n.tagName !== 'TABLE').map((n) => `${n.tagName}:${txt(n)}`);
    assert.equal(heads[0], 'H2:Media Box', k);
    assert.match(heads[1], /^P:\d+ images?$/, k);
  });
});

test('Media Box rows: one per asset, [image, title, Original + 1920px links], images unique to the box kept', { skip }, () => {
  const { sections, element } = importPage('como');
  const box = sections.find((s) => s.style === 'dark, full-width, media-box');
  const rows = rowsOf(box.tables[0]);
  assert.equal(rows.length, 13, 'the stats line says 13 images');
  rows.forEach((tr) => {
    const [img, title, links] = [...tr.children];
    assert.ok(img.querySelector('img[src^="https://cdn.skoda-storyboard.com/"]'), 'preview image');
    assert.equal(txt(title), 'La dolce vita! Explore the surroundings of Lake Como');
    const labels = [...links.querySelectorAll('a')].map((a) => txt(a));
    assert.equal(labels[0], 'Original');
    links.querySelectorAll('a').forEach((a) => assert.match(a.getAttribute('href'), /^https:\/\/www\.skoda-storyboard\.com\/direct-download\//));
  });
  // DSC_6514 / 6566 / 6544 / 6504 are only in the Media Box on the source (audit 4.1)
  const stems = [...element.querySelectorAll('img')].map((i) => stem(i.getAttribute('src')));
  ['DSC_6514_7975ff6b', 'DSC_6504_df9e4ddb', 'DSC_6544_c1413c4b'].forEach((s) => {
    assert.ok(stems.some((x) => x.startsWith(s)), `${s} on the page`);
  });
  assert.ok(!element.querySelector('.cover-box, .media-box, .search-results'), 'no source band markup left');
});

test('a Media Box with no downloadable asset leaves no empty section', { skip }, () => {
  const slug = PAGES.como;
  const url = `${SRC}/${slug}/`;
  const dom = new JSDOM(readFileSync(path.join(FIXTURES, `${slug.split('/').pop()}.html`), 'utf8'), { url });
  dom.window.document.querySelectorAll('.media-box .media-cart-action-multi.download').forEach((n) => n.remove());
  dom.window.document.querySelectorAll('.media-box a[href*="direct-download"]').forEach((n) => n.remove());
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;
  importer.preprocess({ document: dom.window.document });
  helixPreProcess(dom.window.document);
  const [{ element }] = importer.transform({
    document: dom.window.document, url, params: { originalURL: url },
  });
  const styles = sectionsOf(element).map((s) => s.style);
  assert.ok(!styles.includes('dark, full-width, media-box'));
  assert.ok(!/Media Box/.test(txt(element)));
});

// ---- 4.3 lightbox chrome --------------------------------------------------------------

test('sb-gallery lightbox chrome and share links never land as content', { skip }, () => {
  const { element, text } = importPage('elroq');
  assert.ok(!/Gallery overview|Share gallery|View \d+ photos/.test(text));
  const share = /facebook\.com\/dialog\/share|pinterest\.com\/pin|x\.com\/intent/;
  assert.ok(![...element.querySelectorAll('a[href]')].some((a) => share.test(a.getAttribute('href'))));
});

// ---- 4.4 captions ---------------------------------------------------------------------

test('carousel captions are the visible item descriptions; none where the source shows none', { skip }, () => {
  const { element } = importPage('como');
  const galleries = allTables(element, 'Gallery (slider)');
  assert.equal(galleries.length, 2);
  const caps = galleries.flatMap((g) => rowsOf(g).map((tr) => txt(tr.children[1] || tr)));
  assert.equal(caps.length, 8);
  assert.match(caps[0], /^Villa d.Este is one of the most luxurious destinations/);
  assert.match(caps[7], /^Seaplanes are also an inseparable part/);
  assert.ok(!caps.includes('La dolce vita! Explore the surroundings of Lake Como'), 'no page-title caption');
});

// ---- 4.6 spec table ---------------------------------------------------------------------

test('Epiq spec table → Columns with the Version / Epiq 35 / 40 / 55 header row, no `version` block', { skip }, () => {
  const { element } = importPage('epiq');
  assert.equal(allTables(element, 'Version').length, 0, 'no block named after the first cell');
  const cols = allTables(element, 'Columns').find((t) => /Maximum power/.test(txt(t)));
  assert.ok(cols, 'Columns block');
  const rows = rowsOf(cols).map((tr) => [...tr.children].map(txt));
  assert.deepEqual(rows[0], ['Version', 'Epiq 35', 'Epiq 40', 'Epiq 55']);
  assert.equal(rows.length, 14);
  rows.forEach((r) => assert.equal(r.length, 4));
  // a colspan=3 value applies to every version
  assert.deepEqual(rows.find((r) => /^Boot capacity/.test(r[0])).slice(1), ['475 / 1344', '475 / 1344', '475 / 1344']);
});

// ---- 4.7 quiz --------------------------------------------------------------------------

test('quiz: questions, images and answer options kept; hidden JSON and widget UI dropped', { skip }, () => {
  const { element, text } = importPage('quiz');
  assert.ok(!/ajaxUrl|resultPageVariants/.test(text), 'no jsonStruct');
  assert.ok(!/Go to next question|Finish quiz|correct answers/.test(text), 'no quiz controls');
  assert.ok(!/\d+ \/ 14/.test(text), 'no pager');
  assert.equal(element.querySelectorAll('input, button').length, 0);
  const questions = [...element.querySelectorAll('h2')].filter((h) => /\?\s*$/.test(txt(h)));
  assert.equal(questions.length, 14);
  assert.match(txt(questions[0]), /^This electric car has only recently made its world debut/);
  const list = questions[0].parentElement.querySelector('ul');
  assert.ok(list && /Elroq/.test(txt(list)), 'answer options as a list');
  assert.ok(element.querySelector('img[src*="001-Skoda_Storyboard_QUIZ_Elroq"]'), 'question image');
});

// ---- 4.8 inline images -----------------------------------------------------------------

test('inline body image with a file-name alt is kept (enq_ng_064, cruise control)', { skip }, () => {
  const { element } = importPage('cruise');
  assert.ok(element.querySelector('img[src$="/enq_ng_064_86f6f294.jpg"]'));
});

// ---- 4.9 series nav --------------------------------------------------------------------

test('series nav → heading + Cards (overlay) with image, date and full title; no toggle text', { skip }, () => {
  const { element, text } = importPage('cruise');
  assert.ok(!/Show more|Show less/.test(text));
  const h = [...element.querySelectorAll('h3')].find((n) => /^Next up in/.test(txt(n)));
  assert.ok(h && h.querySelector('a[href]'), 'series heading with its hub link');
  const cards = allTables(element, 'Cards (overlay)').find((t) => /How airbags work/.test(txt(t)));
  assert.ok(cards, 'Cards (overlay)');
  const rows = rowsOf(cards);
  assert.equal(rows.length, 12);
  rows.forEach((tr) => {
    assert.ok(tr.children[0].querySelector('img'), 'teaser image kept');
    assert.ok(tr.children[1].querySelector('h3 > a[href]'), 'linked title');
  });
});

// ---- 4.11 tag toggle ---------------------------------------------------------------------

test('tag row: the "+N" toggle is dropped, the tags it reveals are kept', { skip }, () => {
  const { element } = importPage('elroq');
  const tags = allTables(element, 'Tags')[0];
  const labels = [...tags.querySelectorAll('a')].map(txt);
  assert.ok(!labels.some((l) => /^\+\d+$/.test(l)), 'no +N pill');
  assert.ok(!tags.querySelector('a[href="#"]'));
  assert.ok(labels.includes('Stefani') && labels.includes('Sustainability'), 'hidden terms kept');
});

// ---- 4.4 sow-slider (default Gallery): data-caption is kept, alt never becomes a caption ----

test('sow-slider Gallery: data-caption kept, alt (file name / page title) never a caption', { skip }, async () => {
  const { default: flatten } = await import('./parsers/story-flatten.js');
  const dom = new JSDOM(`<body><div class="entry-content"><div class="panel-layout">
    <div class="panel-grid"><div class="panel-grid-cell">
      <div class="so-panel widget widget_sow-slider"><div class="so-widget-sow-slider">
        <img src="s1.jpg" alt="Page title" data-caption="Real caption"><img src="s2.jpg" alt="s2_file_name">
      </div></div>
    </div></div></div></div></body>`);
  const doc = dom.window.document;
  globalThis.document = doc;
  flatten(doc.querySelector('.entry-content'), { document: doc });
  const gallery = allTables(doc.body, 'Gallery')[0];
  assert.deepEqual(rowsOf(gallery).map((tr) => txt(tr.children[1])), ['Real caption', '']);
});

// ---- SKODA-823: sidebar newsletter widget → Newsletter Stub (card) ----------------------

const NEWSLETTER = 'Newsletter Stub (card)';
const kvRows = (table) => Object.fromEntries(
  rowsOf(table).map((tr) => [txt(tr.children[0]), tr.children[1]]),
);

test('sidebar newsletter widget → Newsletter Stub (card), first in the aside, above "Explore more"', { skip }, () => {
  Object.keys(PAGES).forEach((k) => {
    const { sections, element } = importPage(k);
    const aside = sections.find((s) => s.style === 'sidebar');
    assert.ok(aside, `${k}: sidebar section`);
    assert.equal(aside.blocks[0], NEWSLETTER, `${k}: card first`);
    assert.equal(allTables(element, NEWSLETTER).length, 1, `${k}: one card`);
    const card = aside.tables[0];
    // the card precedes the "Explore more" heading
    const asideEl = card.parentElement;
    const kids = [...asideEl.children];
    const h = kids.find((n) => n.tagName === 'H2');
    if (h) assert.ok(kids.indexOf(card) < kids.indexOf(h), `${k}: card above ${txt(h)}`);
    assert.ok(!element.querySelector('.newsletter-subscribe-widget, form, input, button'), `${k}: no source form`);
    assert.ok(!element.querySelector('.side-banner, .sa-bnr'), `${k}: side banner still dropped (SKODA-903)`);
  });
});

test('Newsletter Stub (card) rows: source heading + image, form strings, origin consent/manage links', { skip }, () => {
  const { element } = importPage('epiq');
  const cfg = kvRows(allTables(element, NEWSLETTER)[0]);
  assert.deepEqual(Object.keys(cfg), [
    'image', 'heading', 'label', 'placeholder', 'button', 'consent', 'manage',
    'message', 'error', 'consent-error', 'list', 'language',
  ]);
  const img = cfg.image.querySelector('img');
  assert.match(img.getAttribute('src'), /^https:\/\/cdn\.skoda-storyboard\.com\/.*\/newsletter_subscribe\.webp$/);
  assert.equal(img.getAttribute('alt'), '', 'decorative background');
  // the authored line break is kept; the source's glued &nbsp; survive as placeholders
  assert.equal(cfg.heading.querySelectorAll('br').length, 1);
  assert.equal(txt(cfg.heading).replace(/\u{F00A0}/gu, ' '), 'Be the firstto get the latest stories');
  assert.equal(txt(cfg.placeholder), 'Enter your e-mail');
  assert.equal(txt(cfg.button), 'Subscribe now!');
  assert.equal(txt(cfg.message), 'Newsletter signup is not available yet', 'never a success message');
  assert.equal(txt(cfg['consent-error']), 'Please accept the terms before continuing.');
  assert.equal(txt(cfg.list), '389');
  assert.equal(txt(cfg.language), 'en_GB');
  // consent: label text only (manage link moved to its own row), link to the live origin page
  assert.match(cfg.consent.textContent, /^Hereby I give my consent to the processing of my personal data .* Škoda Auto\.$/);
  const consent = cfg.consent.querySelector('a');
  assert.equal(consent.getAttribute('href'), 'https://www.skoda-storyboard.com/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing/');
  assert.equal(consent.attributes.length, 1, 'href only, no target');
  assert.ok(!/Manage subscription/.test(cfg.consent.textContent));
  const manage = cfg.manage.querySelector('a');
  assert.equal(txt(manage), 'Manage subscription');
  assert.equal(manage.getAttribute('href'), 'https://www.skoda-storyboard.com/en/newsletter-settings/');
});

test('a story without the newsletter widget gets no card; a widget-only sidebar keeps its section', { skip }, () => {
  const slug = PAGES.cruise;
  const url = `${SRC}/${slug}/`;
  const run = (mutate) => {
    const dom = new JSDOM(readFileSync(path.join(FIXTURES, `${slug.split('/').pop()}.html`), 'utf8'), { url });
    mutate(dom.window.document);
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    importer.preprocess({ document: dom.window.document });
    helixPreProcess(dom.window.document);
    const [{ element }] = importer.transform({
      document: dom.window.document, url, params: { originalURL: url },
    });
    return element;
  };
  const none = run((doc) => doc.querySelectorAll('.newsletter-subscribe-widget').forEach((n) => n.remove()));
  assert.equal(allTables(none, NEWSLETTER).length, 0);
  assert.equal(sectionsOf(none).find((s) => s.style === 'sidebar').blocks[0], 'Cards (overlay)');
  const only = run((doc) => doc.querySelectorAll('.sidebar .related, .sidebar section.tags').forEach((n) => n.remove()));
  const aside = sectionsOf(only).find((s) => s.style === 'sidebar');
  assert.deepEqual(aside.blocks, [NEWSLETTER]);
});

// ---- D5 (user decision 2026-10-06): regulatory lightbox captions stay visible ----------

const WLTP_EPIQ = 'Škoda Epiq: Power consumption combined: 13,7-14,1 kWh/100 km, CO₂ emissions combined: 0 g/km. Information on consumption and CO₂ emissions, shown in ranges, depends on the selected vehicle equipment.';

test('isRegulatoryCaption: consumption + emissions disclaimers only, conservatively', { skip }, async () => {
  const { isRegulatoryCaption } = await import('./parsers/story-flatten.js');
  [
    WLTP_EPIQ,
    'Škoda Octavia: Power consumption combined: 4.3 – 7.2 l/100 km, CO₂ emissions combined: 110 – 163 g/km.',
    'Combined WLTP energy consumption: 13.0–13.1 kWh/100 km',
    'Fuel consumption 5.1 l/100 km, CO2 emissions 117 g/km',
  ].forEach((t) => assert.ok(isRegulatoryCaption(t), t));
  [
    '',
    'Aerodynamics have a major impact on energy consumption and, therefore, on the driving range.',
    'Without recharging the traction battery, the seven-seater Škoda Peaq covered 936 km at an average energy consumption of just 9.2 kWh/100 km.',
    'Villa d’Este is one of the most luxurious destinations on the lake.',
    'Škoda Epiq',
  ].forEach((t) => assert.ok(!isRegulatoryCaption(t), t));
});

test('Gallery (slider): a regulatory data-caption becomes a visible note, other lightbox captions stay dropped', { skip }, async () => {
  const { default: flatten } = await import('./parsers/story-flatten.js');
  const dom = new JSDOM(`<body><div class="entry-content"><div class="panel-layout">
    <div class="panel-grid"><div class="panel-grid-cell">
      <div class="so-panel widget widget_skoda-carousel-widget"><div class="search-results carousel-widget">
        <div class="search-results-items">
          <div class="search-results-item"><div class="image-holder"><img src="a.jpg" alt="Škoda Epiq" data-caption="${WLTP_EPIQ}"></div></div>
          <div class="search-results-item"><div class="image-holder"><img src="b.jpg" alt="Škoda Epiq" data-caption="The Epiq at the lake"></div></div>
          <div class="search-results-item"><div class="image-holder"><img src="c.jpg" alt="c" data-caption="${WLTP_EPIQ}"></div>
            <div class="search-results-item-description"><p>The boot holds 475 l.</p></div></div>
          <div class="search-results-item"><div class="image-holder"><img src="d.jpg" alt="d" data-caption="${WLTP_EPIQ}"></div>
            <div class="search-results-item-description"><p>${WLTP_EPIQ}</p></div></div>
        </div>
      </div></div>
    </div></div></div></div></body>`);
  const doc = dom.window.document;
  globalThis.document = doc;
  flatten(doc.querySelector('.entry-content'), { document: doc });
  const gallery = allTables(doc.body, 'Gallery (slider)')[0];
  const caps = rowsOf(gallery).map((tr) => [...tr.children[1].querySelectorAll('p')].map(txt));
  assert.deepEqual(caps, [
    [WLTP_EPIQ], // lightbox-only regulatory text → visible
    [], // lightbox-only narrative caption → dropped (no visible caption on the source)
    ['The boot holds 475 l.', WLTP_EPIQ], // a note under the visible description
    [WLTP_EPIQ], // already visible → not repeated
  ]);
});
