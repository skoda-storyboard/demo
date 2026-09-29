import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* global globalThis */
let JSDOM;
try {
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* Dependencies are not always installed in importer validation. */ }

const table = (cellsByRow, document) => {
  const t = document.createElement('table');
  cellsByRow.forEach((cells) => {
    const tr = document.createElement('tr');
    cells.forEach((cell) => {
      const td = document.createElement('td');
      for (const node of [cell].flat()) td.append(typeof node === 'string' ? node : node);
      tr.append(td);
    });
    t.append(tr);
  });
  return t;
};
globalThis.WebImporter = {
  DOMUtils: { createTable: table },
  Blocks: {
    createBlock: (doc, { name, cells }) => table([[name], ...Object.entries(cells)], doc),
    getMetadataBlock: (doc, cells) => table([['Metadata'], ...Object.entries(cells)], doc),
  },
  rules: { transformBackgroundImages() {}, adjustImageUrls() {} },
  FileUtils: { sanitizePath: (value) => value },
};

const importer = JSDOM ? (await import('./import-press-kit-default.js')).default : null;
const decorateAccordion = JSDOM ? (await import('../../blocks/accordion/accordion.js')).default : null;
const base = 'https://www.skoda-storyboard.com/en/press-kits/';
const target = `${base}skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/`;
const intro = `${base}skoda-peaq-press-kit-2/the-skoda-peaq-skodas-new-flagship-expands-the-brands-electric-portfolio/`;
const txt = (el) => (el?.textContent || '').trim().replace(/\s+/g, ' ');
const inBodyDownloads = [
  ['PDF download', '/direct-download/2026/03/Skoda_all-electric_family_d82d4b7a.pdf'],
  ['JPG download', '/direct-download/2026/03/Skoda_all-electric_family_80fcb8d2.jpg'],
  ['PDF download', '/direct-download/2026/03/Skoda_Peaq_v_Skoda_Kodiaq_91fd0302.pdf'],
  ['JPG download', '/direct-download/2026/03/Skoda_Peaq_v_Skoda_Kodiaq_a33f7283.jpg'],
  ['PDF download', '/direct-download/2026/03/Skoda_Peaq_battery_powertrain_52694888.pdf'],
  ['JPG download', '/direct-download/2026/03/Skoda_Peaq_battery_powertrain_a8933919.jpg'],
];

// The two first-glimpse pull-quotes (SKODA-220): one sow-editor widget, live markup 2026-09-28.
const RULE = '<hr style="width: 10%; height: 2px; display: block; margin: 0 auto; border: none; background-color: #000000; margin-bottom: 10px;">';
const QUOTES = [['“The confident presence of the Škoda&nbsp;Peaq.”', 'Klaus Zellmer, Škoda Auto CEO'],
  ['“Modern Solid design.”', 'Oliver Stefani, Head of Škoda Design']]
  .map(([q, by]) => `<p style="text-align: center;"><em>${q}</em></p>${RULE}<p style="text-align: center;"><strong>${by}</strong></p>`)
  .join('');

function widget(html, klass = 'widget_sow-editor') {
  return `<div class="so-panel ${klass}"><div class="textwidget">${html}</div></div>`;
}
function grid(inner) {
  return `<div class="panel-grid"><div class="panel-grid-cell">${inner}</div></div>`;
}
function toggles(count, withExtras = false) {
  return Array.from({ length: count }, (_, i) => grid(`
    <div class="so-panel widget_ys-row-toggle"><h2 class="row-title"><span>Chapter ${i + 1}</span></h2></div>
    <div class="so-panel widget_siteorigin-panels-builder">
      <div class="panel-layout">${grid(widget(`<p>Answer ${i + 1} <a href="https://example.com/chapter">reference</a>.</p>
        ${(withExtras && (i === 0 || i === 3) ? inBodyDownloads.slice(i === 0 ? 0 : 4, i === 0 ? 4 : 6) : [])
    .map(([label, href]) => `<p><a href="${href}">${label}</a></p>`).join('')}`))}</div>
    </div>`)).join('');
}
function asset(i, pdf = false) {
  const ext = pdf ? 'pdf' : 'jpg';
  const href = `/direct-download/2026/09/asset-${i}.${ext}`;
  return `<div class="search-results-item"><article class="media-cart-item ${pdf ? '' : 'image'}">
    ${pdf ? '' : `<div class="article-teaser-media"><img src="https://cdn.skoda-storyboard.com/img-${i}.jpg" alt="Asset ${i}"></div>`}
    <h3 class="entry-title">Asset ${i}</h3>
    ${pdf ? `<a class="media-cart-action download" href="${href}">Download</a>`
    : `<div class="media-cart-action-multi download"><a href="${href}">Original</a><a href="/direct-download/2026/09/asset-${i}-1920.jpg">1920px</a></div>`}
  </article></div>`;
}
function fixture({
  chapters = false, total = 60, togglesCount = 8, inline = 0, files = 4, mediaBox = true, extra = '', hubTitle = '',
}) {
  const images = Array.from({ length: inline }, (_, i) => grid(widget(
    `<p><img src="https://cdn.skoda-storyboard.com/body-${i}.jpg" alt="Body ${i}"></p>`,
  ))).join('');
  const nav = chapters ? `<div class="chapter-nav">
    <div class="chapter-nav-header"><a class="link-intro" href="${base}skoda-peaq-press-kit-2/"${hubTitle ? ` title="${hubTitle}"` : ''}>Introduction</a><a class="link-chapters" href="#">Chapters</a></div>
    <div class="chapter-nav-body"><ul>${Array.from({ length: 13 }, (_, i) => `<a href="${base}chapter-${i}/"><li>Chapter ${i}</li></a>`).join('')}</ul></div>
  </div>` : '';
  const bannersAndContacts = chapters ? '' : `${grid(widget(
    // Source alts are placeholders (`download-de` / `share-de`, even on English pages).
    '<p><a href="/direct-download/2026/03/Press_Kit_Skoda_Peaq_Covered-Drive_fec49d8b.pdf"><img src="https://cdn.skoda-storyboard.com/2019/02/download-en.png" alt="download-de"></a></p>',
  ))}
    ${grid(widget(
    '<p><a href="mailto:?body=https://www.skoda-storyboard.com/r/skoda-peaq-covered-drive"><img src="https://cdn.skoda-storyboard.com/2019/02/share-en.png" alt="share-de"></a></p>',
  ))}
    ${grid(widget(
    '<p><strong>Vítězslav Kodym</strong><br>Head of Product Communications<br>+420 604 292 131<br><a href="mailto:vitezslav.kodym@skoda-auto.cz">vitezslav.kodym@skoda-auto.cz</a></p>',
  ))}
    ${grid(widget(
    '<p><strong>Zbyněk Straškraba</strong><br>Spokesperson Product Communications<br>+420 605 293 168<br><a href="mailto:zbynek.straskraba@skoda-auto.cz">zbynek.straskraba@skoda-auto.cz</a></p>',
  ))}`;
  const assets = Array.from({ length: total }, (_, i) => asset(i, i >= total - files)).join('');
  return `<!doctype html><html><head>
    <title>Peaq - Škoda Storyboard</title><meta property="og:description" content="Peaq introduction">
    <meta property="og:image" content="https://cdn.skoda-storyboard.com/cover.jpg">
    </head><body class="single-press_kit press_kit-template-default">
    ${nav}<header class="header">Site chrome</header><article class="press_kit" data-publish-date="2026-09-21T08:00:00+02:00">
    <div class="container"><header><span class="entry-published">21. 9. 2026</span><h1>Peaq headline</h1></header>
    <div class="columns"><div class="column-primary">
      <div class="article-teaser-media"><img src="https://cdn.skoda-storyboard.com/lead.jpg" alt="Lead"></div>
      <div class="entry-content"><div class="panel-layout">
      ${grid(widget('<p><strong>Intro copy</strong></p><hr><p>Quote attribution</p>'))}${chapters ? '' : grid(widget(QUOTES))}${images}${toggles(togglesCount, !chapters)}${extra}
      ${grid(widget('<div class="media-cart-item attachment"><div class="video-container"><iframe src="https://player.vimeo.com/video/1234?dnt=1"></iframe></div><div class="media-cart-actions"><a href="#"><i class="icon"></i></a></div></div><p><a href="mailto:press@skoda-auto.cz">Press contact</a></p>'))}
      ${bannersAndContacts}
      </div></div></div><div class="column-secondary">
      <section><h3>Additional info</h3><ul class="menu"><li><a href="https://www.skoda-storyboard.com/en/contacts/">Media contacts</a></li><li><span>Download Media Box</span></li></ul></section>
      <section class="images sa-media-kit-preview"><h3>Images</h3><div class="items"><article class="gallery-item"><img src="https://cdn.skoda-storyboard.com/preview.jpg" alt="Preview"></article></div><a class="more" href="#">+51</a></section>
      <section class="tags"><h3>Tags</h3><ol class="entry-tags"><li><a class="label" href="${base}?filter%5Bmodel%5D%5B%5D=peaq">Peaq</a></li></ol></section>
    </div></div></div>${mediaBox ? `<div class="cover-box dark"><div class="search-results media-box">
      <h2 class="search-results-heading">Media Box</h2><div class="search-results-stats"><div class="stats">${total - files} images, ${files} PDFs</div></div>
      <div class="search-results-container">${assets}</div>
    </div></div>` : ''}</article><footer>Site chrome</footer></body></html>`;
}
function run(html, url, script = importer) {
  const dom = new JSDOM(html, { url });
  const { document } = dom.window;
  globalThis.document = document;
  globalThis.window = dom.window;
  script.preprocess({ document });
  const [{ element }] = script.transform({ document, url, params: { originalURL: url } });
  return element;
}
function blocks(root, name) {
  return [...root.querySelectorAll('table')].filter((t) => txt(t.querySelector('tr > td')) === name);
}
function rows(root, name) {
  return blocks(root, name).flatMap((t) => [...t.querySelectorAll('tr')].slice(1));
}
const fileRows = (root) => rows(root, 'Downloads').filter((row) => !row.querySelector('img, picture'));

test('first glimpse: eight paired rich accordions, 60 unique media assets and accessible fallbacks', { skip: !JSDOM }, () => {
  const page = run(fixture({}), target);
  assert.equal(rows(page, 'Accordion').length, 8);
  assert.equal(blocks(page, 'Accordion').length, 1);
  assert.equal(blocks(page, 'Downloads').length, 1, 'one Downloads table in source order');
  assert.equal(rows(page, 'Downloads').length, 60);
  assert.equal(fileRows(page).length, 4);
  fileRows(page).forEach((row) => {
    assert.equal(row.children.length, 3, 'contract downloads: [empty picture, title, links]');
    assert.equal(txt(row.children[0]), '');
    assert.match(txt(row.children[1]), /^Asset \d+$/);
    assert.ok(row.children[2].querySelector('p > a[href$=".pdf"]'));
  });
  assert.equal(page.querySelectorAll('.press-kit-files').length, 0, 'no class-dependent default content');
  assert.equal(new Set(blocks(page, 'Downloads').flatMap((block) => [...block.querySelectorAll('a[href]')])
    .map((a) => a.href)).size, 116, '56 image pairs + 4 PDFs, no duplicate links');
  assert.equal(page.querySelectorAll('iframe, header.header, footer').length, 0);
  assert.equal(page.querySelectorAll('.entry-content hr').length, 0);
  assert.match(page.textContent, /Quote attribution/);
  const quotes = blocks(page, 'Quote');
  assert.deepEqual(quotes.map((q) => [...q.querySelectorAll('tr')[1].children].map(txt)), [
    ['“The confident presence of the Škoda Peaq.”', 'Klaus Zellmer, Škoda Auto CEO'],
    ['“Modern Solid design.”', 'Oliver Stefani, Head of Škoda Design'],
  ], 'Quote [quote, attribution] (SKODA-220)');
  assert.ok(quotes.every((q) => q.parentElement.matches('.entry-content')), 'body default content, not in an accordion');
  assert.equal(page.querySelectorAll('.entry-content p[style], [data-skoda-quote]').length, 0);
  assert.equal(page.querySelectorAll('.entry-content .media-cart-item, .entry-content .video-container').length, 0);
  assert.match(page.textContent, /Answer 8/);
  assert.equal(page.querySelectorAll('.entry-content > p > a[href^="https://player.vimeo.com/video/"]').length, 1);
  assert.ok(page.querySelector('a[href="https://www.skoda-storyboard.com/direct-download/2026/09/asset-59.pdf"]'));
  assert.equal(blocks(page, 'Gallery (preview)').length, 1);
  assert.equal(blocks(page, 'Tags').length, 1);
  assert.equal(page.querySelector('a[href="#media-box"]')?.textContent, 'Download Media Box');
  const meta = Object.fromEntries(rows(page, 'Metadata').map((row) => [txt(row.children[0]), txt(row.children[1])]));
  assert.equal(meta.template, 'press_kit');
  assert.equal(meta.publisheddate, '2026-09-21');
  assert.equal(meta.category, 'press-kits');
  assert.match(meta.tags, /peaq/);
  assert.equal(meta.model, 'peaq');
  assert.ok(!('nav' in meta) && !('footer' in meta));
  assert.ok(!('theme' in meta) && !('presskit' in meta), 'first glimpse is a kit, not a chapter');
  assert.equal(page.querySelectorAll('#chapters-links').length, 0);
  assert.deepEqual(
    rows(page, 'Section Metadata').map((row) => txt(row.children[1])),
    ['body-column', 'sidebar', 'media-box, dark, full-width'],
  );
});

test('first glimpse preserves six inline downloads, two linked banners and both contact cards', {
  skip: !JSDOM,
}, () => {
  const page = run(fixture({}), target);
  const body = page.querySelector('.entry-content');
  const inline = [...body.querySelectorAll('a[href]')].filter((a) => /^(PDF|JPG) download$/.test(txt(a)));
  assert.deepEqual(inline.map((a) => [txt(a), a.getAttribute('href')]), inBodyDownloads.map(([label, href]) => [
    label, `https://www.skoda-storyboard.com${href}`,
  ]));
  const banners = [...body.querySelectorAll('a[href]')].filter((a) => /(?:download|share)-en\.png/
    .test(a.querySelector('img')?.getAttribute('src') || ''));
  assert.deepEqual(banners.map((a) => [a.getAttribute('href'), a.querySelector('img').getAttribute('src')]), [
    [
      'https://www.skoda-storyboard.com/direct-download/2026/03/Press_Kit_Skoda_Peaq_Covered-Drive_fec49d8b.pdf',
      'https://cdn.skoda-storyboard.com/2019/02/download-en.png',
    ],
    [
      'mailto:?body=https://www.skoda-storyboard.com/r/skoda-peaq-covered-drive',
      'https://cdn.skoda-storyboard.com/2019/02/share-en.png',
    ],
  ]);
  // The placeholder alts are replaced; the link carries the name the binary gate reads.
  assert.deepEqual(banners.map((a) => [a.title, a.querySelector('img').alt]), [
    ['Download PDF', 'Download PDF'],
    ['Share by email', 'Share by email'],
  ]);
  for (const [name, role, phone, email] of [
    ['Vítězslav Kodym', 'Head of Product Communications', '+420 604 292 131', 'vitezslav.kodym@skoda-auto.cz'],
    ['Zbyněk Straškraba', 'Spokesperson Product Communications', '+420 605 293 168', 'zbynek.straskraba@skoda-auto.cz'],
  ]) {
    const card = [...body.querySelectorAll('p')].find((p) => p.querySelector('strong')?.textContent === name);
    assert.ok(card, name);
    assert.ok(txt(card).includes(role));
    assert.ok(txt(card).includes(phone));
    assert.equal(card.querySelector('a[href^="mailto:"]')?.getAttribute('href'), `mailto:${email}`);
  }
  const menu = [...page.querySelectorAll('article.press_kit > h3')]
    .find((heading) => txt(heading) === 'Additional info').nextElementSibling;
  assert.deepEqual([...menu.querySelectorAll(':scope > li > a[href]'),
    ...page.querySelectorAll('article.press_kit > p > a[href="#media-box"]')]
    .map((a) => [txt(a), a.getAttribute('href')]), [
    ['Media contacts', 'https://www.skoda-storyboard.com/en/contacts/'],
    ['Download Media Box', '#media-box'],
    ['+51', '#media-box'],
  ]);
});

// Resource children (Texts, FAQ, Infographics, Technical data, Images, Videos; SKODA-805b) have
// the default template and a body, but no Media Box. Shapes follow the live source (2026-09-28).
function resourcePage(bodyGrids) {
  return `<!doctype html><html><head><title>Peaq resource - Škoda Storyboard</title>
    <meta property="og:description" content="Peaq resource"></head>
    <body class="single-press_kit press_kit-template-default"><article class="press_kit">
    <div class="container"><header><h1>Images</h1></header>
    <div class="columns"><div class="column-primary"><div class="entry-content"><div class="panel-layout">${bodyGrids}</div></div></div>
    <div class="column-secondary"><section class="tags"><h3>Tags</h3><ol class="entry-tags"><li><a class="label" href="${base}?filter%5Bmodel%5D%5B%5D=peaq">Peaq</a></li></ol></section></div>
    </div></div>
    <div class="search-results type-press_release"><h2 class="search-results-heading">Related Press Releases</h2></div>
    </article></body></html>`;
}
const gridItem = (i) => `<div class="search-results-item"><article class="article-teaser gallery-item media-cart-item image">
  <div class="article-teaser-media"><img src="https://cdn.skoda-storyboard.com/2026/08/peaq-${i}-768x512.jpg" alt="Škoda Peaq"></div>
  <div class="media-cart-actions"><div class="media-cart-action-multi download">
    <a href="/direct-download/2026/08/peaq-${i}.jpg">Original</a><a href="/direct-download/2026/08/peaq-${i}-1920x1280.jpg">1920px</a>
  </div></div></article></div>`;
const blockNames = (root) => [...root.querySelectorAll('table')].map((t) => txt(t.querySelector('tr > td')));
const resourceUrl = `${base}skoda-peaq-press-kit-2/images/`;

test('resource Images child: inline asset grids become Downloads tables, no Media Box needed', { skip: !JSDOM }, () => {
  const page = run(resourcePage(
    grid(widget(`<h2>Exterior</h2><div class="search-results-items">${[0, 1, 2].map(gridItem).join('')}</div>`))
    + grid(widget(`<h2>Interior</h2><div class="search-results-items">${[3, 4].map(gridItem).join('')}</div>`)),
  ), resourceUrl);
  assert.equal(blocks(page, 'Downloads').length, 2, 'one Downloads table per source grid');
  assert.equal(rows(page, 'Downloads').length, 5);
  rows(page, 'Downloads').forEach((row) => {
    assert.ok(row.children[0].querySelector('img'), 'image cell');
    assert.equal(row.children[2].querySelectorAll('a[href]').length, 2, 'Original + 1920px');
  });
  assert.equal(page.querySelectorAll('.search-results-items, .media-cart-actions').length, 0);
  assert.ok(!rows(page, 'Section Metadata').some((row) => /media-box/.test(txt(row.children[1]))), 'no Media Box section');
  assert.ok(!/Related Press Releases/.test(page.textContent), 'related band dropped, as on chapter pages');
});

test('resource Videos child: each video keeps its MP4 download as a labelled link after the embed', { skip: !JSDOM }, () => {
  const video = (id, file) => `<h2>Škoda Peaq | Footage</h2><div class="media-cart-item attachment"><div class="video-container">
    <iframe src="https://player.vimeo.com/video/${id}?dnt=1"></iframe></div><div class="media-cart-actions">
    <a class="media-cart-action add" href="#" data-action="add"><i class="icon"></i></a>
    <a class="media-cart-action download" href="/direct-download/2026/08/${file}" data-action="download"><i class="icon"></i></a></div></div>`;
  const page = run(resourcePage(grid(widget(video(111, 'peaq-footage-1440p.mp4') + video(222, 'peaq-sportline-1440p.mp4')))), `${base}skoda-peaq-press-kit-2/videos/`);
  const downloads = [...page.querySelectorAll('a[href$=".mp4"]')];
  assert.deepEqual(downloads.map((a) => [txt(a), a.getAttribute('href')]), [
    ['Download video', 'https://www.skoda-storyboard.com/direct-download/2026/08/peaq-footage-1440p.mp4'],
    ['Download video', 'https://www.skoda-storyboard.com/direct-download/2026/08/peaq-sportline-1440p.mp4'],
  ]);
  assert.equal(page.querySelectorAll('a[href^="https://player.vimeo.com/video/"]').length, 2, 'embed URLs kept');
  assert.equal(page.querySelectorAll('iframe, .media-cart-item').length, 0);
});

test('resource Texts/FAQ: source tables resolve to default content, never to unknown blocks', { skip: !JSDOM }, () => {
  const texts = '<table><tbody><tr><td>Chapters</td></tr>'
    + '<tr><td><a href="https://cdn.skoda-storyboard.com/2026/08/Introduction.pdf">Introduction</a></td></tr>'
    + '<tr><td><a href="https://cdn.skoda-storyboard.com/2026/08/Exterior.pdf">Exterior</a></td></tr></tbody></table>';
  const faqTable = '<table><tbody><tr><td>Model</td><td>Peaq 60</td><td>Peaq 90</td></tr>'
    + '<tr><td>Range</td><td>Over 450 km</td><td>Over 640 km</td></tr></tbody></table>';
  const page = run(
    resourcePage(grid(widget(texts)) + grid(`
    <div class="so-panel widget_ys-row-toggle"><h2 class="row-title"><span>What is the electric range?</span></h2></div>
    <div class="so-panel widget_siteorigin-panels-builder"><div class="panel-layout">${grid(widget(`<p>It depends on the battery.</p>${faqTable}`))}</div></div>`)),
    `${base}skoda-peaq-press-kit-2/texts/`,
  );
  assert.ok(!blockNames(page).some((name) => /^(Chapters|Model|Range)$/.test(name)), `no unknown blocks: ${blockNames(page)}`);
  const heading = [...page.querySelectorAll('h3')].find((h) => txt(h) === 'Chapters');
  assert.ok(heading, 'one-column layout table header becomes a heading');
  assert.deepEqual([...heading.nextElementSibling.querySelectorAll('li > a')].map((a) => txt(a)), ['Introduction', 'Exterior']);
  const answer = rows(page, 'Accordion')[0].children[1];
  assert.equal(txt(answer.querySelector('li')), 'Range: Peaq 60: Over 450 km · Peaq 90: Over 640 km');
});

test('an image-only PDF link is named by its real alt, else by what it does', { skip: !JSDOM }, () => {
  const link = (alt) => run(resourcePage(grid(widget(
    `<p><a href="/direct-download/2026/08/TD-Peaq.pdf"><img src="https://cdn.skoda-storyboard.com/td.png" alt="${alt}"></a></p>`,
  ))), `${base}skoda-peaq-press-kit-2/technical-data/`).querySelector('a[href$="TD-Peaq.pdf"]');
  assert.equal(link('Technical data Peaq').title, 'Technical data Peaq');
  assert.equal(link('').title, 'Download PDF');
  assert.equal(link('').querySelector('img').alt, 'Download PDF');
});

test('chapter introduction: 15 Chapters links coexist with six independent rich Accordion rows', {
  skip: !JSDOM,
}, () => {
  const page = run(fixture({
    chapters: true, total: 26, togglesCount: 6, inline: 11, files: 1,
  }), intro);
  const accordion = blocks(page, 'Accordion');
  assert.equal(accordion.length, 1);
  assert.equal(rows(page, 'Accordion').length, 6);
  const summaries = rows(page, 'Accordion').map((row) => txt(row.children[0]));
  assert.deepEqual(summaries, Array.from({ length: 6 }, (_, i) => `Chapter ${i + 1}`));
  rows(page, 'Accordion').forEach((row, i) => {
    assert.equal(row.children[0].querySelectorAll('h2.row-title').length, 1);
    assert.match(txt(row.children[1]), new RegExp(`Answer ${i + 1}`));
  });
  assert.equal(page.querySelectorAll('.entry-content > h2.row-title').length, 0);
  assert.equal(page.querySelectorAll('ul#chapters-links > li > a[href]').length, 15);
  assert.equal(page.querySelectorAll('nav').length, 0);
  assert.equal(page.querySelectorAll('.entry-content img').length, 11);
  assert.equal(rows(page, 'Downloads').length, 26);
  assert.equal(fileRows(page).length, 1);
  assert.match(page.textContent, /Answer 6/);
  assert.equal(page.querySelectorAll('h1').length, 1);
  assert.deepEqual(
    rows(page, 'Section Metadata').map((row) => txt(row.children[1])),
    ['press-kit-chapters', 'body-column', 'sidebar', 'media-box, dark, full-width'],
  );
  const article = page.querySelector('article.press_kit');
  assert.equal(article.getAttribute('data-publish-date'), '2026-09-21T08:00:00+02:00');
  const keys = rows(page, 'Metadata').map((row) => txt(row.children[0]).toLowerCase());
  assert.ok(!keys.includes('nav') && !keys.includes('footer'));
  const meta = Object.fromEntries(rows(page, 'Metadata').map((row) => [txt(row.children[0]), txt(row.children[1])]));
  assert.equal(meta.template, 'press_kit_chapter', 'children stay out of the template=press_kit rails');
  assert.equal(meta.presskit, '/en/press-kits/skoda-peaq-press-kit-2');
  assert.equal(meta.theme, 'press-kit', 'scripts.js loads the press-kit layout from the theme');
  assert.equal(meta.model, 'peaq');

  const block = page.ownerDocument.createElement('div');
  block.className = 'accordion';
  rows(page, 'Accordion').forEach((row) => {
    const authored = page.ownerDocument.createElement('div');
    [...row.children].forEach((td) => {
      const cell = page.ownerDocument.createElement('div');
      cell.append(...td.childNodes);
      authored.append(cell);
    });
    block.append(authored);
  });
  accordion[0].replaceWith(block);
  decorateAccordion(block);
  const triggers = [...block.querySelectorAll('button[aria-expanded]')];
  assert.equal(triggers.length, 6);
  assert.equal(block.querySelectorAll('h2 > button').length, 6);
  assert.ok([...block.querySelectorAll('[role="region"]')].every((panel) => panel.hidden));
  triggers[0].click();
  triggers[1].click();
  assert.equal(triggers[0].getAttribute('aria-expanded'), 'true');
  assert.equal(triggers[1].getAttribute('aria-expanded'), 'true');
  assert.equal(page.querySelectorAll('ul#chapters-links > li > a[href]').length, 15);
});

function galleryGroup(title, from, count) {
  const items = Array.from({ length: count }, (_, i) => asset(from + i)).join('');
  return grid(`<div class="so-panel widget_sow-editor"><div class="so-widget-sow-editor">
    <h3 class="widget-title">${title}</h3><div class="textwidget"><div class="search-results search-results-gallery">
    <div class="search-results-container"><div class="search-results-items">${items}</div></div></div></div></div></div>`);
}

test('resource child without a Media Box: grouped galleries in source order, no Media Box section', {
  skip: !JSDOM,
}, () => {
  const page = run(fixture({
    chapters: true,
    mediaBox: false,
    togglesCount: 0,
    extra: `${galleryGroup('Exterior', 0, 3)}${galleryGroup('Interior', 3, 2)}`,
    hubTitle: 'Škoda Peaq – Press Kit',
  }), `${base}skoda-peaq-press-kit-2/images/`);
  const groups = blocks(page, 'Downloads');
  // Header + `collapse | auto` config row, then one row per asset.
  assert.deepEqual(groups.map((block) => block.querySelectorAll('tr').length - 2), [3, 2]);
  groups.forEach((block) => assert.deepEqual(
    [...block.querySelectorAll('tr')[1].children].map(txt),
    ['collapse', 'auto'],
    'gallery groups use the Downloads block disclosure',
  ));
  assert.deepEqual(groups.map((block) => txt(block.previousElementSibling)), ['Exterior', 'Interior']);
  groups.forEach((block) => assert.equal(block.previousElementSibling.tagName, 'H2'));
  const hrefs = groups.flatMap((block) => [...block.querySelectorAll('a[href]')]).map((a) => a.href);
  assert.equal(new Set(hrefs).size, 10, 'Original + 1920px per image, no duplicates');
  assert.equal(page.querySelectorAll('.search-results-gallery, .widget-title').length, 0);
  assert.equal(page.querySelectorAll('a[href="#media-box"]').length, 0, 'no dangling Media Box links');
  assert.deepEqual(
    rows(page, 'Section Metadata').map((row) => txt(row.children[1])),
    ['press-kit-chapters', 'body-column', 'sidebar'],
  );
  const hub = [...page.querySelectorAll('ul#chapters-links > li > a[href]')]
    .find((a) => /\/skoda-peaq-press-kit-2\/?$/.test(a.getAttribute('href')));
  assert.equal(txt(hub), 'Škoda Peaq – Press Kit', 'the hub link is not a second "Introduction"');
  const meta = Object.fromEntries(rows(page, 'Metadata').map((row) => [txt(row.children[0]), txt(row.children[1])]));
  assert.equal(meta.template, 'press_kit_chapter');
  assert.equal(meta.presskit, '/en/press-kits/skoda-peaq-press-kit-2');
});

test('in-body Storyboard gallery keeps its lead image and caption and links the rest to the Media Box', {
  skip: !JSDOM,
}, () => {
  const thumb = (i) => `<div class="sb-gallery-image"><a class="sb-gallery-link" href="#"><div class="image-holder ratio-container">
    <img src="https://cdn.skoda-storyboard.com/sb-${i}.jpg" alt="Rally ${i}" data-caption="Caption ${i}" srcset="x 1w"></div></a></div>`;
  const sbGallery = `<div class="sb-gallery">${thumb(0).replace('sb-gallery-image"', 'sb-gallery-image sb-gallery-image-main"')
    .replace('</a>', '<div class="sb-gallery-show-more"><svg></svg><span>22</span></div></a>')}
    <div class="sb-gallery-bottom"><div class="sb-gallery-thumbnails">${[1, 2, 3, 4].map(thumb).join('')}</div></div></div>`;
  const page = run(fixture({
    chapters: true, togglesCount: 0, extra: grid(widget(sbGallery)),
  }), `${base}skoda-peaq-press-kit-2/rally/`);
  const body = page.querySelector('.entry-content');
  assert.equal(body.querySelectorAll('[class*="sb-"], .image-holder, svg').length, 0);
  assert.deepEqual([...body.querySelectorAll('img[src*="/sb-"]')].map((img) => img.getAttribute('alt')), ['Rally 0']);
  assert.ok([...body.querySelectorAll('p')].some((p) => txt(p) === 'Caption 0'));
  assert.equal(body.querySelector('a[href="#media-box"]')?.textContent, '+22');
});

test('SiteOrigin layout tables flatten to default content, never an unnamed block', { skip: !JSDOM }, () => {
  const layoutTable = `<table width="629"><tbody>
    <tr><td><strong>Find out more:</strong> <a href="https://www.skoda-storyboard.com/en/images/?q=FC">all photos</a></td><td> </td></tr>
    <tr><td><a href="https://www.example.com/channel"><img src="https://cdn.skoda-storyboard.com/whatsapp-banner.png" alt=""></a></td></tr>
    <tr><td><p><a href="/direct-download/2026/03/chapter.pdf">Chapter PDF</a></p></td></tr>
  </tbody></table>`;
  const page = run(fixture({
    chapters: true, mediaBox: false, togglesCount: 0, extra: grid(widget(layoutTable)),
  }), `${base}skoda-peaq-press-kit-2/texts/`);
  const named = new Set(['Accordion', 'Downloads', 'Gallery (preview)', 'Tags', 'Section Metadata', 'Metadata']);
  [...page.querySelectorAll('table')].forEach((t) => assert.ok(named.has(txt(t.querySelector('tr > td'))), txt(t)));
  const body = page.querySelector('.entry-content');
  assert.match(txt([...body.querySelectorAll('p')].find((p) => /Find out more/.test(txt(p)))), /all photos/);
  assert.equal(body.querySelectorAll('img[src*="whatsapp"], a[href="https://www.example.com/channel"]').length, 0, 'decorative icon dropped');
  assert.ok(body.querySelector('p > a[href$="/chapter.pdf"]'));
  assert.equal([...body.querySelectorAll('p')].filter((p) => !txt(p) && !p.querySelector('img, a')).length, 0);
});

test('a data table (2+ labelled rows) becomes one text line per row, every value kept', { skip: !JSDOM }, () => {
  // #189's table engine (skoda-press-kit-default-layout sourceTables) wins over PR #202's
  // per-column lists: the published FAQ pages already use this shape (SKODA-805b merge).
  const specs = `<table><tbody>
    <tr><td>Model</td><td><strong>Peaq 60</strong></td><td><strong>Peaq 90</strong></td></tr>
    <tr><td>Range</td><td>Over 450 km</td><td>Over 640 km</td></tr>
    <tr><td>Power</td><td>150 kW</td><td>210 kW</td></tr>
  </tbody></table>`;
  const page = run(fixture({
    chapters: true, mediaBox: false, togglesCount: 0, extra: grid(widget(specs)),
  }), `${base}skoda-peaq-press-kit-2/frequently-asked-questions/`);
  const body = page.querySelector('.entry-content');
  const lines = [...body.querySelectorAll('li')].map(txt).filter((t) => t.startsWith('Range') || t.startsWith('Power'));
  assert.deepEqual(lines, [
    'Range: Peaq 60: Over 450 km · Peaq 90: Over 640 km',
    'Power: Peaq 60: 150 kW · Peaq 90: 210 kW',
  ]);
  assert.equal(body.querySelectorAll('table').length, 0);
});

test('a PDF thumbnail link with a real alt keeps the alt, which is also the title the binary gate reads', { skip: !JSDOM }, () => {
  const thumb = '<p><a href="https://cdn.skoda-storyboard.com/2026/08/TD_Skoda_Peaq_en.pdf"><img src="https://cdn.skoda-storyboard.com/2026/08/005_Skoda_Peaq-384x256.jpg" alt="Škoda Peaq"></a></p>';
  const page = run(fixture({
    chapters: true, mediaBox: false, togglesCount: 0, extra: grid(widget(thumb)),
  }), `${base}skoda-peaq-press-kit-2/technical-data/`);
  const link = page.querySelector('a[href$="TD_Skoda_Peaq_en.pdf"]');
  assert.equal(link.title, 'Škoda Peaq', 'a real alt names the link (#189); a placeholder alt gets "Download PDF"');
  assert.equal(link.querySelector('img').alt, 'Škoda Peaq');
});

test('Videos chapter keeps each embed and its icon-only master download as a named link', { skip: !JSDOM }, () => {
  // The add-to-cart action comes first and some clips give it a `download` class too: the MP4
  // master is picked by its file type, never by position (#189; PR #202 took the first action).
  const clip = (id) => `<h2>Clip ${id}</h2><div class="media-cart-item attachment"><div class="video-container"><iframe src="https://player.vimeo.com/video/${id}?dnt=1"></iframe></div><div class="media-cart-actions">
    <a class="media-cart-action add download" href="#" data-action="add"><i class="icon"></i></a>
    <a class="media-cart-action download" href="/direct-download/2026/06/clip-${id}.mp4" data-action="download"><i class="icon"></i></a>
    <a class="media-cart-action link" href="https://www.skoda-storyboard.com/?attachment_id=${id}"><i class="icon icon-link"></i></a></div></div>`;
  const page = run(fixture({
    chapters: true, mediaBox: false, togglesCount: 0, extra: grid(widget(`${clip(11)}${clip(22)}`)),
  }), `${base}skoda-peaq-press-kit-2/videos/`);
  const body = page.querySelector('.entry-content');
  [11, 22].forEach((id) => {
    const embed = body.querySelector(`p > a[href^="https://player.vimeo.com/video/${id}"]`);
    assert.ok(embed, `embed ${id}`);
    const download = embed.parentElement.nextElementSibling?.querySelector('a');
    assert.match(download?.getAttribute('href') || '', new RegExp(`/direct-download/2026/06/clip-${id}\\.mp4$`));
    assert.equal(txt(download), 'Download video');
  });
  assert.equal(body.querySelectorAll('a[href*="attachment_id"], .media-cart-actions').length, 0);
});

test('malformed mandatory article, toggle and asset fail rather than silently losing content', { skip: !JSDOM }, () => {
  assert.throws(() => run(fixture({}).replace('press_kit-template-default', ''), target), /body class/);
  // A missing body still fails; a missing Media Box no longer does (resource children, SKODA-805b).
  assert.throws(() => run(fixture({}).replace('class="panel-layout"', 'class="missing-layout"'), target), /title and body/);
  assert.throws(() => run(fixture({}).replace('widget_siteorigin-panels-builder', 'widget_broken'), target), /paired answer/);
  assert.throws(() => run(fixture({}).replace('/direct-download/2026/09/asset-59.pdf', '#'), target), /no download URL/);
  assert.throws(
    () => run(fixture({}).replace('56 images, 4 PDFs', '56 images, 5 PDFs'), target),
    /expected 61 assets, found 60/,
  );
});

test('generated standalone bundle matches the source importer', { skip: !JSDOM }, () => {
  const code = readFileSync(new URL('./import-press-kit-default.bundle.js', import.meta.url), 'utf8');
  const bundled = vm.runInNewContext(`${code}\nCustomImportScript.default`, {
    WebImporter: globalThis.WebImporter, console, URL,
  });
  for (const [url, html] of [
    [intro, fixture({
      chapters: true, total: 26, togglesCount: 6, inline: 11, files: 1,
    })],
    [target, fixture({})],
    [`${base}skoda-peaq-press-kit-2/images/`, fixture({
      chapters: true, mediaBox: false, togglesCount: 0, extra: galleryGroup('Exterior', 0, 2),
    })],
  ]) {
    assert.equal(run(html, url, bundled).outerHTML, run(html, url).outerHTML);
  }
});

test('public SSR samples keep all real article and Media Box assets', {
  skip: !JSDOM || !process.env.SKODA_PRESS_KIT_LIVE,
}, async () => {
  for (const [url, expected, accordions, inline, chapters] of [
    [intro, 26, 6, 11, 15],
    [target, 60, 8, 19, 0],
  ]) {
    const response = await fetch(url);
    assert.equal(response.status, 200, url);
    const html = await response.text();
    const page = run(html, url);
    assert.equal(blocks(page, 'Downloads').length, 1, url);
    assert.equal(rows(page, 'Downloads').length, expected, url);
    assert.equal(rows(page, 'Accordion').length, accordions, url);
    const source = new JSDOM(html, { url }).window.document;
    const sourceToggles = [...source.querySelectorAll('article.press_kit .entry-content .widget_ys-row-toggle')];
    const outputRows = rows(page, 'Accordion');
    const sourceSummaries = sourceToggles.map((node) => txt(node.querySelector('.row-title')));
    const sourceImages = sourceToggles.map((node) => node.nextElementSibling.querySelectorAll('img').length);
    assert.deepEqual(outputRows.map((row) => txt(row.children[0])), sourceSummaries, url);
    assert.deepEqual(outputRows.map((row) => row.children[1].querySelectorAll('img').length), sourceImages, url);
    assert.equal(page.querySelectorAll('.entry-content img').length, inline, url);
    assert.equal(page.querySelectorAll('ul#chapters-links > li > a[href]').length, chapters, url);
    assert.ok(page.querySelector('article.press_kit[data-publish-date]'), url);
    assert.equal(fileRows(page).length, expected === 26 ? 1 : 5);
    assert.ok(fileRows(page).every((r) => r.children.length === 3 && r.querySelector('a[href]')));
    assert.ok(rows(page, 'Downloads').every((r) => r.querySelector('a[href]')));
    const mediaLinks = blocks(page, 'Downloads').flatMap((block) => [...block.querySelectorAll('a[href]')])
      .map((a) => a.getAttribute('href'));
    assert.equal(mediaLinks.length, expected === 26 ? 51 : 115, url);
    assert.equal(new Set(mediaLinks).size, mediaLinks.length, 'no repeated Media Box URLs');
    assert.equal(page.querySelectorAll('iframe, .panel-grid, .so-panel, .sa-bnr').length, 0, url);
    assert.equal(blocks(page, 'Gallery (preview)').length, 1, url);
    assert.equal(blocks(page, 'Tags').length, 1, url);
    assert.equal(rows(page, 'Metadata').filter((r) => txt(r.children[0]) === 'template').length, 1);
    const meta = Object.fromEntries(rows(page, 'Metadata')
      .map((row) => [txt(row.children[0]), txt(row.children[1])]));
    assert.equal(meta.template, 'press_kit');
    assert.equal(meta.publisheddate, expected === 26 ? '2026-09-21' : '2026-03-30');
    assert.equal(meta.category, 'press-kits');
    assert.match(meta.tags, /peaq/);
    assert.ok(page.querySelector('a[href^="mailto:"]'), url);
    if (url === target) {
      const sourceArticle = source.querySelector('article.press_kit');
      const sourceBody = sourceArticle.querySelector('.entry-content');
      const outputBody = page.querySelector('.entry-content');
      const fullHref = (a) => new URL(a.getAttribute('href'), url).href;
      const downloadLinks = (root) => [...root.querySelectorAll('a[href]')]
        .filter((a) => /^(PDF|JPG) download$/.test(txt(a)))
        .map((a) => [txt(a), fullHref(a)]);
      const sourceDownloads = downloadLinks(sourceBody);
      assert.equal(sourceDownloads.length, 6);
      assert.deepEqual(
        downloadLinks(outputBody),
        sourceDownloads,
        'all six in-article PDF/JPG links keep their labels, targets and order',
      );
      const banners = (root) => [...root.querySelectorAll('a[href]')]
        .filter((a) => /(?:download|share)-en\.png/.test(a.querySelector('img')?.getAttribute('src') || ''))
        .map((a) => [fullHref(a), a.querySelector('img').getAttribute('src')]);
      const sourceBanners = banners(sourceBody);
      assert.equal(sourceBanners.length, 2);
      assert.deepEqual(
        banners(outputBody),
        sourceBanners,
        'the PDF and share image banners retain their linked images and destinations',
      );
      const contacts = (root) => [...root.querySelectorAll('a[href^="mailto:"]')]
        .filter((a) => a.getAttribute('href') !== 'mailto:?body=https://www.skoda-storyboard.com/r/skoda-peaq-covered-drive')
        .map((a) => [a.getAttribute('href'), txt(a.closest('p'))]);
      const sourceContacts = contacts(sourceBody);
      assert.equal(sourceContacts.length, 2);
      assert.deepEqual(
        contacts(outputBody),
        sourceContacts,
        'both named contact cards retain phone, role and email',
      );
      const additionalInfo = [...page.querySelectorAll('article.press_kit > h3')]
        .find((heading) => txt(heading) === 'Additional info');
      assert.deepEqual([
        ...additionalInfo.nextElementSibling.querySelectorAll(':scope > li > a[href]'),
        ...page.querySelectorAll('article.press_kit > p > a[href="#media-box"]'),
      ].map((a) => txt(a)), ['Media contacts', 'Download Media Box', '+51']);
      assert.equal(page.querySelectorAll('a[href^="https://player.vimeo.com/video/"]').length, 1);
      assert.equal(page.querySelectorAll('.entry-content > p > a[href^="https://player.vimeo.com/video/"]').length, 1);
      assert.equal(page.querySelectorAll('a[href*="buzzsprout.com"]').length, 0);
      assert.ok([...page.querySelectorAll('p a[href="#media-box"]')].some((a) => txt(a) === '+51'));
      assert.equal(page.querySelectorAll('.entry-content a[href^="mailto:"]').length, 3);
      assert.equal(page.querySelectorAll('.entry-content hr').length, 0, 'quote rules must not split EDS sections');
      assert.equal([...page.querySelectorAll('.entry-content a')]
        .filter((a) => /^(PDF|JPG) download$/.test(txt(a))).length, 6);
      assert.ok(page.querySelector('a[href$=".mp4"]'), 'video download remains readable');
    }
    assert.equal(page.querySelectorAll('a[href=""], a:not([href])').length, 0, url);
  }
});
