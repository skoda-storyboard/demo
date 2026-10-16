/* global globalThis */
/*
 * SKODA-607: the press-release importer (import-press-release.js) on the 5 M1 releases.
 * Fixtures: test/fixtures/press-release/<slug>.html (source pages, trimmed of scripts and
 * site chrome; test/* is .hlxignore'd). The whole pipeline runs on jsdom with a minimal
 * WebImporter stub, then the output is read the way DA reads it: <hr> = section break,
 * a table = a block (first cell = name), Section Metadata `style` = the section classes.
 * Run: node --test tools/importer/press-release.test.mjs
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

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../test/fixtures/press-release');
const SRC = 'https://www.skoda-storyboard.com/en/press-releases';
const PAGES = {
  zellmer: 'skoda-auto-klaus-zellmer-to-leave-the-company',
  theatre: 'skoda-auto-and-national-theatre-extend-partnership-until-at-least-2029',
  superb: 'skoda-superb-25-years-of-comfort-space-and-technical-excellence',
  board: 'skoda-auto-announces-changes-to-its-board-of-management',
  peaq: '936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs',
};
// Import validity audit fixtures (SKODA-833), kept out of PAGES so the M1 loops stay on the 5.
const AUDIT = {
  fourByFour: 'the-skoda-4x4-model-range-safe-driving-in-all-weather-and-challenging-terrain',
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

const importer = JSDOM ? (await import('./import-press-release.js')).default : null;

// What @adobe/helix-importer PageImporter.preProcess does before `transform` runs: drop
// every <hr> and every empty inline element (unless it holds an img/video/iframe/div/
// picture). Icon-only links vanish here, which is why the importer has a `preprocess`.
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

/** Split the output at <hr> into sections: [{ nodes, blocks, style }]. */
function sectionsOf(element) {
  const article = element.querySelector('article');
  const out = [{ nodes: [] }];
  [...article.children].forEach((n) => {
    if (n.tagName === 'HR') out.push({ nodes: [] });
    else out[out.length - 1].nodes.push(n);
  });
  return out.map((s) => {
    const blocks = s.nodes.filter((n) => n.tagName === 'TABLE');
    const meta = blocks.find((t) => blockName(t) === 'Section Metadata');
    const style = meta ? txt(meta.querySelectorAll('tr')[1].children[1]) : null;
    return {
      ...s,
      style,
      blocks: blocks.filter((t) => t !== meta).map(blockName),
      content: s.nodes.filter((n) => n.tagName !== 'TABLE'),
    };
  });
}
const cache = {};
function importPage(key, edit) {
  if (cache[key] && !edit) return cache[key];
  const slug = PAGES[key] || AUDIT[key];
  const dom = new JSDOM(readFileSync(path.join(FIXTURES, `${slug}.html`), 'utf8'), { url: `${SRC}/${slug}/` });
  if (edit) edit(dom.window.document);
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;
  importer.preprocess({ document: dom.window.document });
  helixPreProcess(dom.window.document);
  const [{ element }] = importer.transform({
    document: dom.window.document,
    url: `${SRC}/${slug}/`,
    params: { originalURL: `${SRC}/${slug}/` },
  });
  const result = { element, sections: sectionsOf(element) };
  if (!edit) cache[key] = result;
  return result;
}

const rowsOf = (table) => [...table.querySelectorAll('tr')].slice(1);
const find = (sections, name) => sections.flatMap((s) => s.nodes).find((n) => n.tagName === 'TABLE' && blockName(n) === name);

test('section model: header, body-column, sidebar, media-box, related (only when present)', { skip }, () => {
  const expect = ['body-column', 'sidebar', 'dark, full-width, media-box', 'dark, full-width, related'];
  ['theatre', 'board', 'peaq'].forEach((k) => {
    assert.deepEqual(importPage(k).sections.map((s) => s.style), [null, ...expect], k);
  });
  // Zellmer's grey FAQ panel closes the body as its own highlight section (SKODA-824)
  assert.deepEqual(importPage('zellmer').sections.map((s) => s.style), [
    null, 'body-column', 'body-column, highlight-grey', ...expect.slice(1)]);
  // Superb has no Related Press Releases band
  assert.deepEqual(importPage('superb').sections.map((s) => s.style), [null, ...expect.slice(0, 3)]);
});

test('header: date paragraph + a single plain-text h1 that keeps the authored <br>', { skip }, () => {
  const [head] = importPage('peaq').sections;
  assert.deepEqual(head.content.map((n) => n.tagName), ['P', 'H1']);
  assert.equal(txt(head.content[0]), '2. 9. 2026');
  // the source breaks the Peaq title after "record" at every width (SKODA-607a)
  assert.equal(head.content[1].innerHTML, '936 km without recharging: Škoda Peaq sets range record\u{F00A0}<br>for seven-seater electric SUVs');
  // the word gap survives as skoda-nbsp's placeholder (wrapPage restores U+00A0), so the
  // heading's text, which the gallery lightbox title reads, isn't "recordfor"
  assert.equal(head.content[1].textContent.replace(/\u{F00A0}/gu, ' '), '936 km without recharging: Škoda Peaq sets range record for seven-seater electric SUVs');
  assert.equal(importPage('superb').sections[0].content[1].querySelector('br'), null, 'no <br> invented');
  Object.keys(PAGES).forEach((k) => assert.equal(importPage(k).element.querySelectorAll('h1').length, 1, k));
});

test('body: lead image, bullets list (optional), bold perex, Buzzsprout first in the body', { skip }, () => {
  const body = importPage('superb').sections[1].content;
  assert.ok(body[0].querySelector('img'), 'lead image first');
  assert.equal(body[1].tagName, 'UL');
  assert.equal(body[1].children.length, 4);
  assert.ok(!/›/.test(txt(body[1])), 'bullet marker stripped');
  assert.equal(body[2].children[0].tagName, 'STRONG');
  assert.match(txt(body[2]), /^Mladá Boleslav/);
  assert.match(body[3].querySelector('a').getAttribute('href'), /^https:\/\/www\.buzzsprout\.com\/1730804\/episodes\//);

  // Zellmer has no bullets: the perex follows the lead image
  const z = importPage('zellmer').sections[1].content;
  assert.equal(z[1].children[0].tagName, 'STRONG');
  assert.equal(importPage('zellmer').sections[1].nodes.filter((n) => n.tagName === 'UL').length, 0);
});

test('body: every release keeps its Buzzsprout player; Peaq keeps the inline Vimeo', { skip }, () => {
  Object.keys(PAGES).forEach((k) => {
    const links = [...importPage(k).sections[1].nodes.flatMap((n) => [...n.querySelectorAll('a')])];
    assert.equal(links.filter((a) => /buzzsprout\.com/.test(a.href)).length, 1, k);
  });
  const peaq = importPage('peaq').sections[1].nodes.flatMap((n) => [...n.querySelectorAll('a')]);
  const vimeo = peaq.filter((a) => /player\.vimeo\.com\/video\/1223262231/.test(a.href));
  assert.equal(vimeo.length, 1);
  assert.equal(txt(vimeo[0].closest('p')), vimeo[0].getAttribute('href'), 'bare URL on its own line');
  assert.ok(!peaq.some((a) => /direct-download|attachment_id/.test(a.href)), 'video cart/download toolbar dropped');
});

test('body: no decorative <hr>, no empty paragraphs', { skip }, () => {
  const z = importPage('zellmer').sections[1].content;
  assert.ok(!z.some((n) => n.tagName === 'P' && !txt(n) && !n.querySelector('img, a')), 'no empty <p>');
});

test('highlight (SKODA-824): the grey FAQ panel is its own body-column section, paragraphs kept', { skip }, () => {
  const { sections } = importPage('zellmer');
  const panel = sections.find((s) => s.style === 'body-column, highlight-grey');
  assert.ok(panel, 'highlight section');
  assert.deepEqual(panel.blocks, [], 'only default content');
  assert.deepEqual(panel.content.map((n) => txt(n).slice(0, 25)), [
    'Frequently Asked Question',
    'When did Klaus Zellmer ta',
    'What has Klaus Zellmer st',
  ]);
  assert.ok(!sections[1].content.some((n) => /Frequently Asked Questions/.test(txt(n))), 'moved out of the body');
  assert.equal(sections.filter((s) => s.style === 'body-column').length, 1, 'no empty resumed body (the panel is last)');
  ['theatre', 'superb', 'board', 'peaq'].forEach((k) => {
    assert.ok(!importPage(k).sections.some((s) => /highlight/.test(s.style || '')), `${k}: no panel`);
  });
});

test('highlight (SKODA-824): a panel that opens the body leaves no empty body section', { skip }, () => {
  const { sections } = importPage('zellmer', (doc) => {
    // Only the grey FAQ panel is left in the body: no lead image, bullets, perex or text.
    doc.querySelectorAll('.column-primary .article-teaser img, .entry-summary, .bullet-points').forEach((n) => n.remove());
    const content = doc.querySelector('.entry-content');
    [...content.children].filter((n) => !/background/i.test(n.getAttribute('style') || '')).forEach((n) => n.remove());
  });
  const styles = sections.map((s) => s.style);
  assert.equal(styles[1], 'body-column, highlight-grey', 'the panel follows the header directly');
  assert.ok(!styles.includes('body-column'), 'no metadata-only body section');
});

test('quotes (SKODA-220): centred pull-quotes become Quote [quote, attribution] in the body column', { skip }, () => {
  const counts = {
    zellmer: 2, theatre: 2, superb: 1, board: 1, peaq: 0,
  };
  Object.entries(counts).forEach(([k, n]) => {
    const { element, sections } = importPage(k);
    const quotes = sections.flatMap((s) => s.nodes
      .filter((node) => node.tagName === 'TABLE' && blockName(node) === 'Quote')
      .map((table) => ({ table, style: s.style })));
    assert.equal(quotes.length, n, k);
    quotes.forEach(({ table, style }) => {
      assert.equal(style, 'body-column', `${k}: no extra section break`);
      const rows = rowsOf(table);
      assert.equal(rows.length, 1, k);
      const [quote, by] = rows[0].children;
      assert.match(txt(quote), /^“.+”$/, k);
      assert.equal(quote.querySelectorAll('em, br').length, 0, `${k}: italics are the block's`);
      assert.ok(by.querySelector('strong'), `${k}: bold attribution`);
    });
    assert.equal(element.querySelectorAll('[data-skoda-quote], [data-skoda-quote-by], p[style*="center"]').length, 0, k);
  });
  const [first] = importPage('zellmer').sections[1].nodes.filter((node) => node.tagName === 'TABLE');
  assert.equal(
    txt(rowsOf(first)[0].children[1]),
    'Thomas Schäfer, Chairman of the Supervisory Board of Škoda Auto and Head of the Brand Group Core',
  );
});

test('sidebar: Additional info list, Images + Gallery (preview), Tags heading + Tags', { skip }, () => {
  const side = importPage('peaq').sections[2];
  assert.deepEqual(side.content.filter((n) => n.tagName === 'H3').map(txt), ['Additional info', 'Images', 'Tags']);
  assert.deepEqual(side.blocks, ['Gallery (preview)', 'Tags']);
  const info = side.content.find((n) => n.tagName === 'UL');
  assert.deepEqual([...info.querySelectorAll('a')].map((a) => [txt(a), a.getAttribute('href')]), [
    ['Media contacts', 'https://www.skoda-storyboard.com/en/contacts/'],
    ['Download Media Box', '#media-box'],
  ]);
  const counts = {
    zellmer: 1, theatre: 3, superb: 4, board: 2, peaq: 3,
  };
  Object.entries(counts).forEach(([k, n]) => {
    assert.equal(rowsOf(find(importPage(k).sections, 'Gallery (preview)')).length, n, k);
  });
});

test('tags: chips link to demo tag pages when one exists, else stay on the source', { skip }, () => {
  const hrefs = [...find(importPage('peaq').sections, 'Tags').querySelectorAll('a')].map((a) => a.getAttribute('href'));
  assert.ok(hrefs.includes('/en/tag/years/2026'));
  assert.ok(hrefs.includes('/en/tag/model/peaq'));
  assert.ok(hrefs.includes('/en/tag/crew/electromobility'));
});

test('media box: heading + stats, image rows carry Original + 1920px, PDF and video rows', { skip }, () => {
  const band = importPage('peaq').sections[3];
  assert.equal(txt(band.content[0]), 'Media Box');
  assert.equal(txt(band.content[1]), '1 video, 3 images, 1 PDF');
  const rows = rowsOf(find(importPage('peaq').sections, 'Downloads'));
  assert.equal(rows.length, 5);
  const labels = rows.map((r) => [...r.lastElementChild.querySelectorAll('a')].map(txt).join('+'));
  assert.deepEqual(labels, ['MP4', 'Original+1920px', 'Original+1920px', 'Original+1920px', 'PDF']);
  // [image, date, title, links]: every source item carries its date line (#274)
  rows.forEach((r) => assert.equal(r.children.length, 4, 'four cells per row'));
  rows.forEach((r) => assert.match(txt(r.children[1]), /^\d{1,2}\. \d{1,2}\. \d{4}$/));
  assert.ok(!rows[4].querySelector('img'), 'PDF row has no image');
  // the Vimeo poster in its ingestible .jpg form (the source src has no extension)
  assert.match(rows[0].querySelector('img').getAttribute('src'), /^https:\/\/i\.vimeocdn\.com\/video\/.+-d_1280x720\.jpg$/);
  assert.ok(rows[0].querySelector('img').getAttribute('alt'), 'poster alt from its title');
  rows.flatMap((r) => [...r.querySelectorAll('a')]).forEach((a) => {
    assert.match(a.getAttribute('href'), /^https:\/\/www\.skoda-storyboard\.com\/direct-download\//);
  });
  const sizes = {
    zellmer: 2, theatre: 4, superb: 5, board: 3,
  };
  Object.entries(sizes).forEach(([k, n]) => assert.equal(rowsOf(find(importPage(k).sections, 'Downloads')).length, n, k));
});

test('related band: curated Story Rail (press) rows, heading, subheading, All link', { skip }, () => {
  const band = importPage('peaq').sections[4];
  assert.equal(txt(band.content[0]), 'Related Press Releases');
  assert.match(txt(band.content[1]), /^Based on tags:/);
  assert.equal(txt(band.content[2]), 'All');
  assert.deepEqual(band.blocks, ['Story Rail (press)']);
  const rows = rowsOf(find(importPage('peaq').sections, 'Story Rail (press)'));
  assert.equal(rows.length, 6);
  rows.forEach((r) => {
    assert.ok(r.children[0].querySelector('img'));
    assert.ok(r.children[1].querySelector('p'), 'date');
    assert.ok(r.children[1].querySelector('h3 a[href]'), 'title link');
  });
  const cards = { zellmer: 10, theatre: 5, board: 1 };
  Object.entries(cards).forEach(([k, n]) => assert.equal(rowsOf(find(importPage(k).sections, 'Story Rail (press)')).length, n, k));
});

test('no empty href and no leftover source widgets anywhere', { skip }, () => {
  Object.keys(PAGES).forEach((k) => {
    const { element } = importPage(k);
    assert.equal(element.querySelectorAll('a[href=""], a:not([href])').length, 0, k);
    assert.equal(element.querySelectorAll('iframe, .newsletter-subscribe-widget, .side-banner, .sa-bnr, form').length, 0, k);
  });
});

test('metadata: template press_release, publish date and tags survive the rebuild', { skip }, () => {
  const meta = find([{ nodes: [...importPage('superb').element.children] }], 'Metadata');
  const rows = Object.fromEntries(rowsOf(meta)
    .map((r) => [txt(r.children[0]), txt(r.children[1])]));
  assert.equal(rows.template, 'press_release');
  assert.equal(rows.publisheddate, '2026-09-11');
  assert.match(rows.tags, /superb/);
});

test('an image-only PDF link is named by its image alt (binary gate label), prose links untouched', { skip }, () => {
  const pdf = 'https://cdn.skoda-storyboard.com/2026/08/Infographics-Peaq_EN_cadc8744.pdf';
  const { element } = importPage('peaq', (doc) => {
    doc.querySelector('.column-primary .entry-content').insertAdjacentHTML('beforeend', `<p><a href="${pdf}">
      <img src="https://cdn.skoda-storyboard.com/2026/08/gfhgfhsfhdgdgd_a3212940.jpg" alt="Infographics | Production of the Škoda Peaq"></a></p>`);
  });
  const link = element.querySelector(`a[href="${pdf}"]`);
  assert.equal(link.title, 'Infographics | Production of the Škoda Peaq');
  const imageLinks = [...element.querySelectorAll('a[href][title]')]
    .filter((a) => !/\.(?:pdf|mp4)(?:$|[?#])/i.test(a.getAttribute('href')) && a.querySelector('img') && !txt(a));
  assert.equal(imageLinks.length, 0, 'only PDF/MP4 image links gain a title');
});

test('data tables become one line per row, never an unknown block named after the first cell', { skip }, () => {
  const specs = `<table><tbody>
    <tr><td><strong>Škoda Elroq</strong></td><td>&nbsp;</td><td><strong>Elroq 60</strong></td><td><b>Elroq RS</b></td></tr>
    <tr><td>Battery capacity (brutto/netto)</td><td>[kWh]</td><td>61/58</td><td>82/77</td></tr>
    <tr><td>Max. charging power<sup>3</sup></td><td>[kW]</td><td>105</td><td>165</td></tr></tbody></table>`;
  const results = `<table><tbody>
    <tr><td>&nbsp;</td><td>&nbsp;</td><td><strong>H1 2026</strong></td><td><strong>Change (%)</strong></td></tr>
    <tr><td>Deliveries to Customers</td><td>cars</td><td>555,700</td><td>+9.1</td></tr>
    <tr><td><strong>Western Europe</strong></td><td>&nbsp;</td><td>329,600</td><td>+12.4</td></tr></tbody></table>`;
  const { element } = importPage('peaq', (doc) => {
    doc.querySelector('.column-primary .entry-content').insertAdjacentHTML('beforeend', specs + results);
  });
  const names = [...element.querySelectorAll('table')].map(blockName);
  const known = ['Quote', 'Gallery (preview)', 'Tags', 'Downloads', 'Section Metadata', 'Metadata', 'Story Rail (press)'];
  assert.deepEqual(names.filter((n) => !known.includes(n)), [], 'no data-table block');
  const lines = [...element.querySelectorAll('li')].map(txt);
  assert.ok(lines.includes('Battery capacity (brutto/netto): [kWh] · Elroq 60: 61/58 · Elroq RS: 82/77'), lines.join('\n'));
  assert.ok(lines.includes('Deliveries to Customers: cars · H1 2026: 555,700 · Change (%): +9.1'));
  assert.ok(lines.includes('Western Europe: H1 2026: 329,600 · Change (%): +12.4'));
  const power = [...element.querySelectorAll('li > strong')].find((s) => txt(s).startsWith('Max. charging power'));
  assert.equal(power.querySelector('sup')?.textContent, '3', 'the footnote marker stays a superscript');
  assert.ok([...element.querySelectorAll('p')].some((p) => txt(p) === 'Škoda Elroq'), 'the header label leads the list');
});

test('a self-hosted [video] player becomes an Embed of its MP4, without the player chrome', { skip }, () => {
  // as the importer sees it in the browser: MediaElement.js has wrapped the <video> in its chrome
  const MP4 = 'https://cdn.skoda-storyboard.com/2026/10/Skoda-Epiq-Sportline-colour-animation_b059a4d0.mp4';
  const player = `<div style="width: 1920px;" class="wp-video"><span class="mejs-offscreen">Video Player</span>
    <div class="mejs-container wp-video-shortcode mejs-video" role="application"><div class="mejs-inner">
      <div class="mejs-mediaelement"><video class="wp-video-shortcode" width="1920" height="1080" preload="metadata" controls>
        <source type="video/mp4" src="${MP4}?_=1"><a href="${MP4}">${MP4}</a></video></div>
      <div class="mejs-layers"><div class="mejs-overlay-play"><img src="https://www.skoda-storyboard.com/wp/wp-includes/js/mediaelement/mejs-controls.svg" alt=""></div></div>
      <div class="mejs-controls"><span class="mejs-currenttime">00:00</span><span class="mejs-duration">00:18</span>
        <a class="mejs-volume-slider" href="javascript:void(0);">Use Up/Down Arrow keys to increase or decrease volume.</a></div>
    </div></div></div>`;
  const { element } = importPage('peaq', (doc) => {
    doc.querySelector('.column-primary .entry-content').insertAdjacentHTML('beforeend', player);
  });
  const embed = [...element.querySelectorAll('table')].find((t) => blockName(t) === 'Embed'
    && t.textContent.includes('colour-animation'));
  assert.ok(embed, 'an Embed block for the MP4');
  assert.equal(embed.querySelector('a').getAttribute('href'), MP4, 'no ?_= cache-buster');
  const text = element.textContent;
  ['Video Player', '00:18', 'Use Up/Down Arrow keys'].forEach((s) => assert.equal(text.includes(s), false, s));
  assert.equal(element.querySelector('img[src*="mejs-controls"], a[href^="javascript:"]'), null, 'no player sprite or script link');
});

test('collapsed row toggles become one Accordion; a video inside an answer stays a link', { skip }, () => {
  const MP4 = 'https://cdn.skoda-storyboard.com/2026/10/Skoda-Epiq-Sportline-colour-animation_b059a4d0.mp4';
  const row = (title, answer) => `<div class="panel-grid"><div class="panel-grid-cell">
    <div class="so-panel widget widget_ys-row-toggle"><div class="so-widget-ys-row-toggle"><h2 class="row-title">${title}</h2></div></div>
    <div class="so-panel widget widget_siteorigin-panels-builder"><div class="panel-layout"><div class="panel-grid"><div class="panel-grid-cell">
      <div class="so-panel widget widget_sow-editor"><div class="textwidget">${answer}</div></div></div></div></div></div></div></div>`;
  const toggles = row('Sharply sculpted exterior', `<p>Glossy black accents.</p>
      <div class="wp-video"><video><source type="video/mp4" src="${MP4}?_=1"></video></div>`)
    + row('Advanced lighting as standard', '<p>The Light Band.</p><p><img src="https://cdn.skoda-storyboard.com/l.jpg" alt="Light"></p>');
  const { element } = importPage('peaq', (doc) => {
    doc.querySelector('.column-primary .entry-content').insertAdjacentHTML('beforeend', `<div class="panel-layout">${toggles}</div>`);
  });
  const accordions = [...element.querySelectorAll('table')].filter((t) => blockName(t) === 'Accordion');
  assert.equal(accordions.length, 1, 'consecutive toggles form one Accordion');
  const items = rowsOf(accordions[0]);
  assert.deepEqual(items.map((r) => txt(r.children[0])), ['Sharply sculpted exterior', 'Advanced lighting as standard']);
  const first = items[0].children[1];
  assert.equal(first.querySelector('a').getAttribute('href'), MP4, 'the video is a link to its MP4');
  assert.equal(txt(first.querySelector('a')), 'Video: Skoda Epiq Sportline colour animation', 'named by its file');
  assert.equal(first.querySelector('table, video'), null, 'no nested block or player');
  assert.ok(items[1].children[1].querySelector('img[alt="Light"]'), 'answer images are kept');
  assert.equal([...element.querySelectorAll('h2')].some((h) => txt(h) === 'Advanced lighting as standard'
    && !h.closest('table')), false, 'no loose heading left behind');
});

// SKODA-833 (import validity audit, F5)

test('4x4 Media Box: all 15 items in one Downloads block, MP4 hrefs URL-serialised', { skip }, () => {
  const { element, sections } = importPage('fourByFour');
  const band = sections.find((s) => s.style === 'dark, full-width, media-box');
  assert.deepEqual(band.blocks, ['Downloads'], 'one block in the band');
  assert.equal(txt(band.content[1]), '9 videos, 3 images, 3 PDFs');
  const rows = rowsOf(find(sections, 'Downloads'));
  assert.equal(rows.length, 15);
  const titles = rows.map((r) => txt(r.children[r.children.length - 2]));
  assert.ok(titles.includes('Video | Škoda Elroq'), titles.join('\n'));
  const links = rows.flatMap((r) => [...r.lastElementChild.querySelectorAll('a')]);
  const mp4 = links.filter((a) => a.getAttribute('href').endsWith('.mp4'));
  assert.equal(mp4.length, 9);
  // helix-importer rewrites .mp4 links in the markdown to `new URL(href).href` after the grid
  // table is laid out; a raw `×` would make that row 5 characters wider and break the table.
  mp4.forEach((a) => assert.equal(a.getAttribute('href'), new URL(a.getAttribute('href')).href));
  assert.ok(mp4.some((a) => a.getAttribute('href').includes('the_Skoda_4%C3%974_range')));
  // only MP4s are re-encoded; the PDF keeps its source href
  assert.ok(links.some((a) => a.getAttribute('href').endsWith('/260224_The-Skoda-4×4-model-range-Safe-driving-in-all-weather-and-challenging-terrain_dd892767.pdf')));
  assert.ok([...element.querySelectorAll('table')].every((t) => blockName(t)), 'no nameless block');
});

test('lite-youtube: the hydrated player becomes a bare YouTube watch URL (SKODA-818 parity)', { skip }, () => {
  const embed = 'https://www.youtube-nocookie.com/embed/d1xYSMyyWWA?enablejsapi=1&autoplay=1&playsinline=1';
  const { sections } = importPage('superb', (doc) => {
    doc.querySelector('.column-primary .entry-content').insertAdjacentHTML('beforeend', `
      <div class="page-embed yt-embed-cookie hidden"><div class="page-embed_cookie"><span>This content is hosted by a third party (www.youtube.com).</span><button class="yt-cookie-consent-button">I acknowledge and confirm</button></div></div>
      <lite-youtube videoid="d1xYSMyyWWA" params="enablejsapi=1" js-api><img src="https://i.ytimg.com/vi/d1xYSMyyWWA/maxresdefault.jpg" alt="">Play<a class="lyt-playbtn" href="${embed}"><span class="lyt-visually-hidden">Play</span></a><a href="${embed}">Play</a></lite-youtube>
      <p><lite-youtube videoid="abcdef12345"></lite-youtube></p>`);
  });
  const body = sections[1].nodes;
  const urls = body
    .filter((n) => n.tagName === 'P' && n.querySelectorAll('a').length === 1 && txt(n) === n.querySelector('a').getAttribute('href'))
    .map((n) => n.querySelector('a').getAttribute('href'));
  assert.ok(urls.includes('https://www.youtube.com/watch?v=d1xYSMyyWWA'), urls.join('\n'));
  assert.ok(urls.includes('https://www.youtube.com/watch?v=abcdef12345'), 'an unhydrated player too');
  assert.ok(!body.some((n) => /\bPlay\b|third party/.test(txt(n))), 'no Play links or consent text');
  assert.ok(!body.some((n) => n.querySelector('img[src*="ytimg.com"], lite-youtube, a[href*="youtube-nocookie"]')), 'no poster or player chrome');
});

test('a full-width fixed-height YouTube iframe keeps its box as Embed url + height; a sized one stays a bare URL', { skip }, () => {
  const playDoh = 'https://www.youtube.com/embed/T9iRrU7EjD8?si=s0PTkkFFmASxwRNQ';
  const { sections } = importPage('superb', (doc) => {
    doc.querySelector('.column-primary .entry-content').insertAdjacentHTML('beforeend', `
      <div class="embed-controller-wrapper"><iframe width="100%" height="448px" data-src="${playDoh}" title="YouTube video player" frameborder="0" allowfullscreen></iframe></div>
      <p><iframe width="500" height="281" src="https://www.youtube.com/embed/m9RlQw2FGjc?feature=oembed&amp;enablejsapi=1"></iframe></p>`);
  });
  const body = sections[1].nodes;
  const embed = body.find((n) => n.tagName === 'TABLE' && blockName(n) === 'Embed');
  assert.ok(embed, 'an Embed table, not flattened as a source data table');
  const rows = [...embed.querySelectorAll('tr')].slice(1).map((tr) => [...tr.children].map((td) => txt(td)));
  assert.deepEqual(rows, [['url', playDoh], ['height', '448']]);
  assert.equal(embed.querySelector('a').getAttribute('href'), playDoh);
  assert.equal(embed.hasAttribute('data-skoda-embed'), false, 'no import marker reaches DA');
  assert.ok(body.some((n) => n.tagName === 'P' && n.querySelector('a')?.getAttribute('href') === 'https://www.youtube.com/embed/m9RlQw2FGjc?feature=oembed&enablejsapi=1'),
    'a 500×281 iframe is the ratio player, a bare URL');
});

test('tags: the "+N" show-more toggle is skipped and the tags it reveals are kept', { skip }, () => {
  const before = rowsOf(find(importPage('peaq').sections, 'Tags'))[0].querySelectorAll('a').length;
  const { sections } = importPage('peaq', (doc) => {
    doc.querySelector('ol.entry-tags').insertAdjacentHTML('beforeend', `
      <li><a class="label show-hidden-terms" href="#" title="All tags">+1</a></li>
      <li><a class="label hidden-term" href="https://www.skoda-storyboard.com/en/news/?filter%5Bbodywork%5D%5B%5D=suv" title="SUV">SUV</a></li>`);
  });
  const chips = [...find(sections, 'Tags').querySelectorAll('a')];
  assert.ok(!chips.some((a) => /^\+\d+$/.test(txt(a)) || a.getAttribute('href') === '#'), 'no toggle chip');
  assert.ok(chips.some((a) => txt(a) === 'SUV'), 'hidden tag kept');
  assert.equal(chips.length, before + 1);
});

test('bullets: a <br> inside one "›" bullet is a soft wrap, not a new bullet', { skip }, () => {
  const { sections } = importPage('superb', (doc) => {
    doc.querySelector('.bullet-points').innerHTML = `<p>›\tMilestone vehicle is a&nbsp;Karoq 1.5 TSI 110 kW in&nbsp;Graphite Grey<br />
›\tLaunched in 2017, the compact SUV is now sold in around 60 markets and remains <br />
a&nbsp;key model in Škoda’s SUV line-up<br />
› Today, Hall M13 is a prime example, producing both ICE and </br> all-electric vehicles<br /></p>`;
  });
  const ul = sections[1].content.find((n) => n.tagName === 'UL');
  // glued non-breaking spaces stay skoda-nbsp's placeholder until the push
  assert.deepEqual([...ul.children].map((li) => txt(li).replace(/[\u00a0\u{F00A0}]/gu, ' ')), [
    'Milestone vehicle is a Karoq 1.5 TSI 110 kW in Graphite Grey',
    'Launched in 2017, the compact SUV is now sold in around 60 markets and remains a key model in Škoda’s SUV line-up',
    'Today, Hall M13 is a prime example, producing both ICE and all-electric vehicles',
  ]);
  // an unmarked line that starts a new sentence stays its own bullet (Solberg Octavia RS)
  const solberg = importPage('superb', (doc) => {
    doc.querySelector('.bullet-points').innerHTML = `<p>› Oliver Solberg recorded his driving impressions in a <a href="https://www.youtube.com/watch?v=d1xYSMyyWWA">video</a><br />
The new Škoda Octavia RS offers a 195 kW (265 PS) petrol engine<br />
› New to the latest Škoda Octavia RS, an electronically controlled differential</p>`;
  }).sections[1].content.find((n) => n.tagName === 'UL');
  assert.deepEqual([...solberg.children].map((li) => txt(li)), [
    'Oliver Solberg recorded his driving impressions in a video',
    'The new Škoda Octavia RS offers a 195 kW (265 PS) petrol engine',
    'New to the latest Škoda Octavia RS, an electronically controlled differential',
  ]);
  // without any "›" marker every <br> still starts a new bullet
  const plain = importPage('superb', (doc) => {
    doc.querySelector('.bullet-points').innerHTML = '<p>First line<br>Second line</p>';
  }).sections[1].content.find((n) => n.tagName === 'UL');
  assert.equal(plain.children.length, 2);
});

// --- #274: press-release QA -------------------------------------------------------------------

test('#274: the Media Box and Related Press Releases headings are h3, as the source band headings', { skip }, () => {
  const { sections } = importPage('zellmer');
  const box = sections.find((s) => s.style === 'dark, full-width, media-box');
  const related = sections.find((s) => /related/.test(s.style || ''));
  assert.equal(box.content[0].tagName, 'H3');
  assert.equal(txt(box.content[0]), 'Media Box');
  assert.equal(related.content[0].tagName, 'H3');
  assert.equal(txt(related.content[0]), 'Related Press Releases');
});

test('#274: every Media Box card carries its source date (Zellmer: image 30. 8. 2022, PDF 21. 9. 2026)', { skip }, () => {
  const zellmer = rowsOf(find(importPage('zellmer').sections, 'Downloads'));
  assert.deepEqual(zellmer.map((r) => txt(r.children[1])), ['30. 8. 2022', '21. 9. 2026']);
  const superb = rowsOf(find(importPage('superb').sections, 'Downloads'));
  assert.deepEqual(superb.map((r) => txt(r.children[1])), ['11. 9. 2026', '11. 9. 2026', '11. 9. 2026', '11. 9. 2026', '10. 9. 2026']);
});

test('#274: the FAQ keeps the blank line after its bold opener (a <br> closing the <strong>)', { skip }, () => {
  const { sections } = importPage('zellmer');
  const faq = sections.find((s) => /highlight-grey/.test(s.style || ''));
  const first = faq.content.find((n) => n.tagName === 'P');
  const strong = first.querySelector('strong');
  assert.equal(txt(strong), 'Frequently Asked Questions:');
  assert.equal(strong.querySelector('br'), null, 'no break left inside the bold run');
  // the moved break and the source's own: a blank line before the first question
  assert.equal(strong.nextSibling?.nodeName, 'BR');
  assert.equal(strong.nextSibling?.nextSibling?.nodeName, 'BR');
});

