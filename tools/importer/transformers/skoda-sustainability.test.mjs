/* global globalThis */
// SKODA-843: skoda-sustainability.js on a trimmed copy of the source's SiteOrigin rows.
// node --test tools/importer/transformers/skoda-sustainability.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import transform from './skoda-sustainability.js';

const { JSDOM } = createRequire(import.meta.url)('jsdom');

const row = (id, cls, cells) => `<div id="pg-1-${id}" class="panel-grid panel-has-style"><div class="${cls} panel-row-style">${
  cells.map((c, i) => `<div id="pgc-1-${id}-${i}" class="panel-grid-cell"><div class="panel-cell-style"><div class="so-panel widget"><div class="panel-widget-style"${c.id ? ` id="${c.id}"` : ''}><div class="siteorigin-widget-tinymce textwidget">${c.html}</div></div></div></div></div>`).join('')
}</div></div>`;

const SOURCE = [
  row(0, '', [{ html: '<h1 style="text-align: center;">Offices</h1>' }]),
  row(1, 'hide-mobile', [{ html: '<p><img src="https://cdn.example/header.jpg" alt="h"></p>' }]),
  row(2, 'hide-desktop hide-tablet', [{ html: '<p><img src="https://cdn.example/header_phone.jpg" alt="p"></p>' }]),
  row(3, '', [{ html: '<p style="text-align: center;">Intro <sup>th</sup> text.</p>' }]),
  row(4, '', [{ html: '<h2>Design</h2>' }]),
  row(5, 'image-card category-1', [
    { html: '<p><a href="https://cdn.example/full.jpg#s_aid=abc"><img src="https://cdn.example/a.png" alt="a"></a></p>' },
    { html: '<div class="image-card_text-inner"> &nbsp;<br> <strong>Lead.</strong> Text.<br> &nbsp; </div>' },
  ]),
  row(6, 'image-card hide-tablet hide-desktop', [
    { html: '<p><img src="https://cdn.example/a.png" alt="a"></p>' },
    { html: '<p>Phone copy</p>' },
  ]),
  row(7, 'info-blocks', [
    { html: '<h3><span style="color: #ffffff;">One</span></h3><p><span style="color: #ffffff;">First.</span><br> &nbsp;</p>' },
    { html: '<h3>Two</h3><p>Second.</p>' },
  ]),
  row(8, '', [{ html: '<p>Hire? <strong><span><a href="#hiring">Find out more.</a></span></strong><br> &nbsp;<br> <iframe src="https://player.vimeo.com/video/1"></iframe> <a class="media-cart-action add" href="#"></a></p>' }]),
  row(9, '', [{ id: 'hiring', html: '<h2 style="text-align: center;">Event space rental</h2><p>&nbsp;<br> <img src="https://cdn.example/e.jpg" alt="e"></p>' }]),
  row(10, '', [{ html: '<p>Host.<br> &nbsp;</p><p>&nbsp;<br> Contact <a href="mailto:x@y.z">x@y.z</a>.</p>' }]),
  row(11, '', [{ html: '' }]),
].join('');

function run(html, bodyClass = 'page-template-template-sustainability') {
  const dom = new JSDOM(`<body class="${bodyClass}"><main class="main"><div class="container"><div id="pl-1" class="panel-layout">${html}</div></div></main></body>`);
  const { document } = dom.window;
  globalThis.WebImporter = {
    DOMUtils: {
      createTable: (rows, doc) => {
        const t = doc.createElement('table');
        rows.forEach((cells) => {
          const tr = t.insertRow();
          cells.forEach((c) => {
            const td = tr.insertCell();
            [c].flat().forEach((n) => td.append(typeof n === 'string' ? doc.createTextNode(n) : n));
          });
        });
        return t;
      },
    },
    Blocks: {
      createBlock: (doc, { name, cells }) => {
        const t = doc.createElement('table');
        t.insertRow().insertCell().textContent = name;
        Object.entries(cells).forEach(([k, v]) => {
          const tr = t.insertRow();
          tr.insertCell().textContent = k;
          tr.insertCell().textContent = v;
        });
        return t;
      },
    },
  };
  transform('beforeTransform', document.body, { document });
  return document.querySelector('main');
}

test('rows become the header, intro, theme and event sections', () => {
  const main = run(SOURCE);
  const kinds = [...main.children].map((n) => (n.matches('table') ? n.rows[0].cells[0].textContent : n.tagName.toLowerCase()));
  assert.deepEqual(kinds, [
    'h1', 'p', 'p', 'Section Metadata', 'hr', 'p',
    'hr', 'h2', 'Columns (image-card, text-small)', 'Columns (info-blocks)', 'p', 'p',
    'hr', 'h2', 'p', 'p', 'p',
  ]);
});

test('the phone copy of a zig-zag row is dropped, the header phone image kept', () => {
  const main = run(SOURCE);
  assert.equal(main.textContent.includes('Phone copy'), false);
  assert.ok(main.querySelector('img[src$="header_phone.jpg"]'));
});

test('a card image loses its link to its own file; blank lines and colour spans go', () => {
  const main = run(SOURCE);
  const card = [...main.querySelectorAll('table')].find((t) => t.rows[0].cells[0].textContent.startsWith('Columns (image-card'));
  const [image, txt] = card.rows[1].cells;
  assert.equal(image.querySelector('a'), null);
  assert.ok(image.querySelector('img[src$="a.png"]'));
  assert.equal(txt.innerHTML.trim(), '<p><strong>Lead.</strong> Text.</p>');
  const band = [...main.querySelectorAll('table')].find((t) => t.rows[0].cells[0].textContent === 'Columns (info-blocks)');
  assert.equal(band.querySelector('span'), null);
  assert.equal(band.rows[1].cells[0].querySelector('p').innerHTML, 'First.');
});

test('the film becomes a link paragraph after its line, the anchor points at the h2 id', () => {
  const main = run(SOURCE);
  const film = main.querySelector('a[href^="https://player.vimeo.com"]');
  assert.ok(film);
  assert.equal(film.closest('p').textContent, 'Offices');
  assert.equal(main.querySelector('.media-cart-action, iframe'), null);
  assert.equal(main.querySelector('a[href^="#"]').getAttribute('href'), '#event-space-rental');
  assert.equal(main.textContent.includes(' '), false);
});

test('another page, or a page without rows, is left as it is', () => {
  const other = run(SOURCE, 'page-template-default');
  assert.ok(other.querySelector('.panel-layout'));
  const empty = run('', 'page-template-template-sustainability');
  assert.ok(empty.querySelector('.panel-layout'));
});

test('a film the page script moved into a cart attachment is a link paragraph, its toolbar gone', () => {
  const main = run([
    row(0, '', [{ html: '<h1>Offices</h1>' }]),
    row(1, '', [{ html: '<p>Intro.</p>' }]),
    row(2, '', [{ html: '<p>Hire? <strong><a href="#x">More.</a></strong><br> &nbsp;<br> </p><div class="media-cart-item attachment"><div class="video-container"><iframe src="https://player.vimeo.com/video/2"></iframe></div> <div class="media-cart-actions"><a class="media-cart-action add" href="#"><i class="icon"></i></a></div></div><p></p>' }]),
  ].join(''));
  const paragraphs = [...main.querySelectorAll('p')].map((p) => p.textContent.trim());
  assert.deepEqual(paragraphs, ['Intro.', 'Hire? More.', 'Offices']);
  assert.equal(main.querySelector('iframe, .media-cart-action'), null);
});

test('a card whose text is in a paragraph keeps the default size', () => {
  const main = run([
    row(0, '', [{ html: '<h1>Offices</h1>' }]),
    row(1, '', [{ html: '<p>Intro.</p>' }]),
    row(2, 'image-card', [
      { html: '<p><img src="https://cdn.example/a.png" alt="a"></p>' },
      { html: '<div class="image-card_text-inner"> <p>Text.</p> </div>' },
    ]),
  ].join(''));
  assert.equal(main.querySelector('table:last-of-type').rows[0].cells[0].textContent, 'Columns (image-card)');
});

test('a film with its MP4 master in the cart toolbar is Embed (vimeo) with url, file and title', () => {
  const main = run([
    row(0, '', [{ html: '<h1>Offices</h1>' }]),
    row(1, '', [{ html: '<p>Intro.</p>' }]),
    row(2, '', [{ html: '<p>Hire?</p><div class="media-cart-item attachment"><div class="video-container"><iframe src="https://player.vimeo.com/video/3"></iframe></div> <div class="media-cart-actions"><a class="media-cart-action download" href="/direct-download/2026/05/film.mp4"><i class="icon"></i></a></div></div>' }]),
  ].join(''));
  const embed = [...main.querySelectorAll('table')].find((t) => t.rows[0].cells[0].textContent === 'Embed (vimeo)');
  assert.ok(embed);
  const rows = [...embed.rows].slice(1).map((r) => [r.cells[0].textContent, r.cells[1].querySelector('a')?.getAttribute('href') || r.cells[1].textContent]);
  assert.deepEqual(rows, [['url', 'https://player.vimeo.com/video/3'], ['file', '/direct-download/2026/05/film.mp4'], ['title', 'Offices']]);
  assert.equal(embed.rows[1].cells[1].textContent, 'Offices');
  assert.equal(main.querySelector('iframe, .media-cart-actions'), null);
});

test('an in-page link targets the h2 id EDS gives it: punctuation dropped, spaces as hyphens', () => {
  const main = run([
    row(0, '', [{ html: '<h1>Offices</h1>' }]),
    row(1, '', [{ html: '<p>Intro <a href="#rental">More.</a></p>' }]),
    row(2, '', [{ id: 'rental', html: '<h2>ŠKODA AUTO’s Event-space rental!</h2><p>Text.</p>' }]),
  ].join(''));
  assert.equal(main.querySelector('a[href^="#"]').getAttribute('href'), '#škoda-autos-event-space-rental');
});
