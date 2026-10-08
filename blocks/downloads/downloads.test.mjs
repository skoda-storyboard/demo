import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

/* eslint-disable import/no-extraneous-dependencies, no-undef */

const setup = (pressRelease = true) => {
  const dom = new JSDOM(`<body>${pressRelease ? '<div class="section media-box">' : ''}<div class="downloads"></div>${pressRelease ? '</div>' : ''}</body>`, {
    url: 'https://example.com/en/press-releases/sample',
  });
  if (pressRelease) dom.window.document.body.className = 'press-release';
  let width = 500;
  const queries = [];
  dom.window.matchMedia = (media) => {
    const min = Number(media.match(/\d+/)[0]);
    const listeners = [];
    const query = {
      matches: width >= min,
      addEventListener(type, listener) { if (type === 'change') listeners.push(listener); },
      resize(nextWidth) {
        const next = nextWidth >= min;
        if (next !== this.matches) {
          this.matches = next;
          listeners.forEach((listener) => listener());
        }
      },
    };
    queries.push(query);
    return query;
  };
  dom.window.setViewport = (nextWidth) => {
    width = nextWidth;
    queries.forEach((query) => query.resize(width));
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  return dom.window.document.querySelector('.downloads');
};

setup();
const { default: decorate } = await import('./downloads.js');

function addRow(block, { src = '', title = '', links = [] }) {
  const row = document.createElement('div');
  const imageCell = document.createElement('div');
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = title;
    imageCell.append(img);
  }
  const titleCell = document.createElement('div');
  titleCell.textContent = title;
  const linksCell = document.createElement('div');
  links.forEach(([label, href]) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    linksCell.append(a);
  });
  row.append(imageCell, titleCell, linksCell);
  block.append(row);
}

function addConfig(block, key, value) {
  const row = document.createElement('div');
  [key, value].forEach((text) => {
    const cell = document.createElement('div');
    cell.textContent = text;
    row.append(cell);
  });
  block.append(row);
}

test('PDF with no picture renders a labelled file tile and a direct download', async () => {
  const block = setup();
  addRow(block, { title: 'Release PDF', links: [['PDF', 'https://example.com/release.pdf?download=1']] });
  await decorate(block);
  assert.equal(block.querySelectorAll('.downloads-item').length, 1);
  assert.equal(block.querySelectorAll('.downloads-file svg').length, 1);
  assert.equal(block.querySelector('.downloads-file-type').textContent, 'PDF');
  assert.equal(block.querySelector('.downloads-title').textContent, 'Release PDF');
  assert.equal(block.querySelector('.downloads-item img'), null);
  const link = block.querySelector('.downloads-download');
  assert.equal(link.getAttribute('href'), 'https://example.com/release.pdf?download=1');
  assert.equal(link.getAttribute('download'), '');
  assert.equal(link.getAttribute('aria-label'), 'Download Release PDF (PDF)');
});

test('MP4 poster has a decorative play badge but the round control downloads the video', async () => {
  const block = setup();
  addRow(block, {
    src: '/poster.jpg', title: 'Launch video', links: [['MP4', 'https://example.com/video.mp4?version=2']],
  });
  await decorate(block);
  assert.equal(block.querySelector('.downloads-thumb').getAttribute('href'), 'https://example.com/poster.jpg');
  assert.equal(block.querySelector('.downloads-thumb').getAttribute('aria-label'), 'View video poster Launch video');
  assert.equal(block.querySelector('.downloads-play').getAttribute('aria-hidden'), 'true');
  assert.equal(block.querySelector('.downloads-download').getAttribute('href'), 'https://example.com/video.mp4?version=2');
  assert.equal(block.querySelector('.downloads-download').getAttribute('aria-label'), 'Download Launch video (MP4)');
});

test('untitled PDF shows a single file-type label and an accessible download', async () => {
  const block = setup();
  addRow(block, { links: [['PDF', '/release.pdf']] });
  await decorate(block);
  assert.equal(block.querySelector('.downloads-file-type').textContent, 'PDF');
  assert.equal(block.querySelector('.downloads-title'), null);
  assert.equal(block.querySelector('.downloads-download').getAttribute('aria-label'), 'Download PDF');
});

test('image sizes remain an accessible two-link menu, and incomplete files do not make empty tiles', async () => {
  const block = setup();
  addRow(block, {
    src: '/image.jpg',
    title: 'Front view',
    links: [['Original', '/full.jpg'], ['1920px', '/scaled.jpg']],
  });
  addRow(block, { title: 'No link' });
  await decorate(block);
  assert.equal(block.querySelectorAll('.downloads-item').length, 1);
  assert.equal(block.querySelector('.downloads-play'), null);
  const toggle = block.querySelector('.downloads-download');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(block.querySelectorAll('.downloads-size').length, 2);
  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(block.querySelectorAll('.downloads-size[aria-label^="Download Front view"]').length, 2);
});

test('media-box collapses whenever the items need more than two rows (source togglebox, SKODA-830 D2)', async () => {
  // 8 assets: two rows of four at 992+, so nothing to collapse there; 1 / 2 / 3 columns below
  const eight = setup();
  for (let i = 0; i < 8; i += 1) addRow(eight, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(eight);
  const toggle = eight.querySelector('.downloads-more');
  const visible = () => [...eight.querySelectorAll('.downloads-item')].filter((tile) => !tile.hasAttribute('inert')).length;
  assert.equal(toggle.hidden, false, '375: one column');
  assert.equal(visible(), 2);
  window.setViewport(520);
  assert.equal(visible(), 4);
  window.setViewport(768);
  assert.equal(visible(), 6);
  window.setViewport(992);
  assert.equal(toggle.hidden, true, '992: two rows of four fit');
  assert.equal(visible(), 8);
  window.setViewport(500);

  // two assets never need a third row: no toggle at all
  const two = setup();
  for (let i = 0; i < 2; i += 1) addRow(two, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(two);
  assert.equal(two.querySelector('.downloads-more'), null);
});

test('the toggle stays a labelled button: Show less once open, focus kept in view on collapse', async () => {
  const block = setup();
  for (let i = 0; i < 5; i += 1) addRow(block, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(block);
  const toggle = block.querySelector('.downloads-more');
  assert.equal(toggle.tagName, 'BUTTON');
  assert.equal(toggle.type, 'button');
  let scrolled = 0;
  toggle.scrollIntoView = () => { scrolled += 1; };
  toggle.focus();
  toggle.click();
  assert.equal(toggle.textContent, 'Show less');
  assert.equal(toggle.hidden, false);
  assert.equal(scrolled, 0, 'expanding leaves the scroll position alone');
  toggle.click();
  assert.equal(toggle.textContent, 'Show more');
  assert.equal(scrolled, 1, 'collapsing keeps the button in view');
  assert.equal(document.activeElement, toggle);
});

test('large media-box variant discloses two rows across widths and authored columns', async () => {

  const large = setup();
  addConfig(large, 'columns', '3');
  for (let i = 0; i < 11; i += 1) addRow(large, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(large);
  assert.equal(large.classList.contains('downloads-media-box'), true);
  const toggle = large.querySelector('.downloads-more');
  assert.equal(toggle.textContent, 'Show more');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.getAttribute('aria-controls'), large.querySelector('.downloads-items').id);
  const visible = () => [...large.querySelectorAll('.downloads-item')].filter((tile) => !tile.hasAttribute('inert')).length;
  assert.equal(visible(), 2);
  window.setViewport(520);
  assert.equal(visible(), 4);
  window.setViewport(768);
  assert.equal(visible(), 6);
  window.setViewport(992);
  assert.equal(visible(), 6);
  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.textContent, 'Show less');
  assert.equal(visible(), 11);
  window.setViewport(500);
  assert.equal(visible(), 11);
  toggle.click();
  assert.equal(large.classList.contains('downloads-expanded'), false);
  assert.equal(visible(), 2);

  const story = setup(false);
  for (let i = 0; i < 9; i += 1) addRow(story, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(story);
  assert.equal(story.querySelector('.downloads-more'), null);
  assert.equal(story.querySelectorAll('.downloads-file').length, 9);
});

test('explicit variant and collapse setting let authors opt in or out without a page template', async () => {
  const variant = setup(false);
  variant.classList.add('media-box');
  for (let i = 0; i < 9; i += 1) addRow(variant, { title: `File ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(variant);
  assert.equal(variant.querySelector('.downloads-more').hidden, false);
  window.setViewport(992);
  assert.equal([...variant.querySelectorAll('.downloads-item')].filter((tile) => tile.hasAttribute('inert')).length, 1);

  const disabled = setup();
  addConfig(disabled, 'collapse', 'none');
  for (let i = 0; i < 9; i += 1) addRow(disabled, { title: `File ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(disabled);
  assert.equal(disabled.querySelector('.downloads-more'), null);

  const optedIn = setup(false);
  addConfig(optedIn, 'collapse', 'auto');
  for (let i = 0; i < 9; i += 1) addRow(optedIn, { title: `File ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(optedIn);
  assert.equal([...optedIn.querySelectorAll('.downloads-item')].filter((tile) => !tile.hasAttribute('inert')).length, 2);
});

test('disclosure disappears when a configured wide grid fits every item', async () => {
  const block = setup();
  addConfig(block, 'columns', '5');
  for (let i = 0; i < 9; i += 1) addRow(block, { title: `File ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(block);
  assert.equal(block.querySelector('.downloads-more').hidden, false);
  window.setViewport(992);
  assert.equal(block.querySelector('.downloads-more').hidden, true);
  assert.equal([...block.querySelectorAll('.downloads-item')].filter((tile) => tile.hasAttribute('inert')).length, 0);
  window.setViewport(500);
  assert.equal(block.querySelector('.downloads-more').hidden, false);
  assert.equal([...block.querySelectorAll('.downloads-item')].filter((tile) => tile.hasAttribute('inert')).length, 7);
});

test('collapsed: the list is clipped to the measured two rows (row 3 peeks), clipped tiles are inert', async () => {
  const block = setup();
  window.setViewport(1440); // four columns
  const observed = [];
  let onResize;
  window.ResizeObserver = class {
    constructor(callback) { onResize = callback; }

    observe(el) { observed.push(el); }
  };
  for (let i = 0; i < 13; i += 1) addRow(block, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(block);
  delete window.ResizeObserver;
  const list = block.querySelector('.downloads-items');
  const tiles = [...list.children];
  const toggle = block.querySelector('.downloads-more');
  const inert = () => tiles.map((tile, i) => (tile.hasAttribute('inert') ? i : null)).filter((i) => i !== null);
  assert.equal(observed.length, 13, 'every tile is observed');
  assert.ok(block.classList.contains('downloads-collapsed'));
  assert.deepEqual(inert(), [8, 9, 10, 11, 12], 'rows 3+ are inert');
  assert.equal(tiles.filter((tile) => tile.hidden).length, 0, 'nothing is display:none (row 3 peeks)');
  assert.equal(list.style.getPropertyValue('--dl-rows-height'), '', 'not laid out yet: unclipped');

  // the section shows: 305.13px tiles in 20px-gap rows from y=100, so two rows end at 630.25
  const rect = (top, bottom) => ({ top, bottom });
  list.getBoundingClientRect = () => rect(100, 1400);
  tiles.forEach((tile, i) => {
    const top = 100 + Math.floor(i / 4) * 325.125;
    tile.getBoundingClientRect = () => rect(top, top + 305.125);
  });
  onResize([]);
  assert.equal(list.style.getPropertyValue('--dl-rows-height'), '630.25px');

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(block.classList.contains('downloads-collapsed'), false);
  assert.deepEqual(inert(), [], 'expanded: every tile is reachable');
  assert.equal(list.style.getPropertyValue('--dl-rows-height'), '', 'expanded: no clip');
  onResize([]);
  assert.deepEqual(inert(), [], 'a resize keeps it open');

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.deepEqual(inert(), [8, 9, 10, 11, 12]);
  assert.equal(list.style.getPropertyValue('--dl-rows-height'), '630.25px');
  window.setViewport(992); // still four columns: same clip
  window.setViewport(768); // three columns: rows 3+ start at tile 6
  assert.deepEqual(inert(), [6, 7, 8, 9, 10, 11, 12]);
  window.setViewport(500);
});

test('without native inert (Safari < 15.5) clipped tiles leave the tab order and the AT tree', async () => {
  const block = setup();
  window.setViewport(1440); // four columns
  for (let i = 0; i < 10; i += 1) addRow(block, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  assert.equal('inert' in window.HTMLElement.prototype, false, 'jsdom has no native inert');
  await decorate(block);
  const tiles = [...block.querySelectorAll('.downloads-item')];
  const toggle = block.querySelector('.downloads-more');
  const controls = (tile) => [...tile.querySelectorAll('a[href], button')];
  const reachable = (tile) => controls(tile).filter((c) => c.getAttribute('tabindex') !== '-1').length;
  assert.ok(controls(tiles[9]).length > 0, 'a clipped tile has controls');
  tiles.slice(8).forEach((tile) => {
    assert.equal(tile.getAttribute('aria-hidden'), 'true', 'clipped tile hidden from AT');
    assert.equal(reachable(tile), 0, 'clipped controls are out of the tab order');
  });
  tiles.slice(0, 8).forEach((tile) => {
    assert.equal(tile.hasAttribute('aria-hidden'), false);
    assert.equal(reachable(tile), controls(tile).length, 'rows 1–2 stay reachable');
  });

  // an author tabindex survives the round trip
  const authored = controls(tiles[9])[0];
  toggle.click(); // expand
  authored.setAttribute('tabindex', '0');
  toggle.click(); // collapse
  assert.equal(authored.getAttribute('tabindex'), '-1');
  toggle.click(); // expand
  assert.equal(authored.getAttribute('tabindex'), '0', 'author tabindex restored');
  tiles.forEach((tile) => {
    assert.equal(tile.hasAttribute('aria-hidden'), false, 'expanded: back in the AT tree');
    assert.equal(tile.hasAttribute('inert'), false);
  });
  assert.equal(controls(tiles[8]).every((c) => !c.hasAttribute('tabindex') && !('dlTabindex' in c.dataset)), true, 'no tabindex left behind');
  window.setViewport(500);
});

test('with native inert the clipped tiles only get the attribute', async () => {
  const block = setup();
  window.setViewport(1440);
  Object.defineProperty(window.HTMLElement.prototype, 'inert', {
    configurable: true,
    get() { return this.hasAttribute('inert'); },
    set(value) { this.toggleAttribute('inert', Boolean(value)); },
  });
  try {
    for (let i = 0; i < 10; i += 1) addRow(block, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
    await decorate(block);
    const tiles = [...block.querySelectorAll('.downloads-item')];
    assert.deepEqual(tiles.map((t) => t.hasAttribute('inert')), [...Array(10)].map((_, i) => i >= 8));
    assert.equal(block.querySelectorAll('[aria-hidden="true"].downloads-item, .downloads-item [tabindex="-1"]').length, 0, 'native inert does the rest');
  } finally {
    delete window.HTMLElement.prototype.inert;
    window.setViewport(500);
  }
});

test('invalid collapse or column settings report errors rather than silently hiding content', async () => {
  const block = setup();
  addConfig(block, 'collapse', 'sometimes');
  await assert.rejects(decorate(block), /collapse must be auto or none/);
  const columns = setup();
  addConfig(columns, 'columns', '0');
  await assert.rejects(decorate(columns), /columns must be a positive whole number/);
});

test('mediabox API mode still renders configured images without a file tile', async () => {
  const block = setup();
  const originalFetch = globalThis.fetch;
  const config = [['source', 'mediabox'], ['postid', '123']];
  config.forEach(([key, value]) => addConfig(block, key, value));
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ images: [{ imageUrl: '/api-image.jpg', link: '/download.jpg', title: 'API image' }] }),
  });
  try {
    await decorate(block);
    assert.equal(block.querySelectorAll('.downloads-item').length, 1);
    assert.equal(block.querySelector('.downloads-file'), null);
    assert.equal(block.querySelectorAll('.downloads-size').length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* --- media cart (SKODA-505b) ------------------------------------------------------------- */
const { cartSize, cartThumb, bindCart } = await import('./downloads.js');

test('cartSize picks the original, else the first size; cartThumb keeps this site root-relative', () => {
  setup();
  const original = { label: 'Original', href: '/o.jpg' };
  assert.equal(cartSize([{ label: '1920px', href: '/g.jpg' }, original]), original);
  assert.equal(cartSize([{ label: 'MP4', href: '/v.mp4' }]).href, '/v.mp4');
  assert.equal(cartSize([]), null);
  assert.equal(cartThumb('https://example.com/en/press/media_1.jpg?width=750'), '/en/press/media_1.jpg?width=750');
  assert.equal(cartThumb('https://cdn.example/x.jpg'), 'https://cdn.example/x.jpg');
  assert.equal(cartThumb(''), '');
});

test('each tile gets an inert add toggle for its original next to its download control', async () => {
  const block = setup();
  addRow(block, {
    src: '/media_1.jpg',
    title: 'Front view',
    links: [['1920px', 'https://www.skoda-storyboard.com/direct-download/a-1920x1080.jpg'], ['Original', 'https://www.skoda-storyboard.com/direct-download/a.jpg']],
  });
  await decorate(block);
  const actions = block.querySelector('.downloads-actions');
  const add = actions.querySelector('.downloads-add');
  assert.equal(actions.firstElementChild, add);
  assert.ok(actions.querySelector('.downloads-action'));
  assert.deepEqual([add.type, add.getAttribute('aria-label')], ['button', 'Add to media cart: Front view']);
  assert.equal(add.dataset.href, 'https://www.skoda-storyboard.com/direct-download/a.jpg');
  assert.equal(add.dataset.title, 'Front view');
  assert.match(add.dataset.thumb, /^\/media_1\.jpg/);
});

test('Media Box: the group toggle sits on the section stats line', async () => {
  setup();
  document.body.innerHTML = '<div class="section media-box"><div class="default-content-wrapper"><h2>Media Box</h2><p>2 images</p></div><div class="downloads"></div></div>';
  document.body.className = 'press-release';
  const block = document.querySelector('.downloads');
  addRow(block, { src: '/a.jpg', title: 'A', links: [['Original', 'https://www.skoda-storyboard.com/direct-download/a.jpg']] });
  await decorate(block);
  const stats = document.querySelector('.default-content-wrapper p');
  assert.ok(stats.classList.contains('downloads-stats'));
  const all = stats.querySelector('.downloads-add-all');
  assert.deepEqual([all.type, all.getAttribute('aria-label'), all.getAttribute('aria-disabled')], ['button', 'Add all files to the media cart', 'true']);
});

test('Media Box: intro copy, a linked line or a second block never takes the stats line', async () => {
  setup();
  document.body.innerHTML = '<div class="section media-box">'
    + '<div class="default-content-wrapper"><h2>Media Box</h2><p>Press photos of the new model.</p></div>'
    + '<div class="downloads-wrapper"><div class="downloads" id="d1"></div></div>'
    + '<div class="default-content-wrapper"><p>2 images</p></div>'
    + '<div class="downloads-wrapper"><div class="downloads" id="d2"></div></div>'
    + '<div class="downloads-wrapper"><div class="downloads" id="d3"></div></div>'
    + '<div class="default-content-wrapper"><p>See <a href="/en/x">all files</a></p></div>'
    + '<div class="downloads-wrapper"><div class="downloads" id="d4"></div></div>'
    + '</div>';
  document.body.className = 'press-release';
  const blocks = ['d1', 'd2', 'd3', 'd4'].map((id) => document.getElementById(id));
  blocks.forEach((b, i) => addRow(b, { src: `/${i}.jpg`, title: `T${i}`, links: [['Original', `https://www.skoda-storyboard.com/direct-download/${i}.jpg`]] }));
  // position decides: a line counts only when it is the paragraph right before its block
  const { statsLine } = await import('./downloads.js');
  assert.equal(statsLine(blocks[2]), null, 'd3 follows another block, not default content');
  assert.equal(statsLine(blocks[3]), null, 'a line with a link is copy, not stats');
  await Promise.all(blocks.map((b) => decorate(b)));
  const stats = document.querySelector('#d2').closest('.section').querySelectorAll('.downloads-stats');
  assert.equal([...stats].filter((p) => p.textContent.startsWith('2 images')).length, 1);
  assert.equal(document.querySelectorAll('.downloads-stats .downloads-add-all').length,
    [...stats].length, 'one group toggle per taken line');
  assert.ok(blocks[2].querySelector('.downloads-toolbar .downloads-add-all'), 'd3 gets its toolbar');
  assert.ok(blocks[3].querySelector('.downloads-toolbar .downloads-add-all'), 'd4 gets its toolbar');
  assert.equal(document.querySelector('a[href="/en/x"]').parentElement.querySelector('.downloads-add-all'), null);
});

function fakeDownloadsCart(refuse = {}, initial = []) {
  const inCart = new Set(initial);
  let listener = () => {};
  const cart = {
    calls: [],
    bindCartControl(el) {
      el.setAttribute('data-cart-control', '');
      if (el.dataset.href.includes('gone')) el.setAttribute('aria-disabled', 'true');
      else el.removeAttribute('aria-disabled');
    },
    has: (href) => inCart.has(href),
    remove(href) {
      inCart.delete(href);
      listener();
    },
    async addMany(entries) {
      cart.calls.push(entries);
      const added = [];
      const skipped = [];
      entries.forEach((e) => {
        if (refuse[e.href]) {
          skipped.push({ href: e.href, reason: refuse[e.href] });
          // the store disables the controls of links that don't resolve
          if (refuse[e.href] === 'unresolved') {
            document.querySelectorAll(`[data-href="${e.href}"]`)
              .forEach((el) => el.setAttribute('aria-disabled', 'true'));
          }
        } else {
          inCart.add(e.href);
          added.push(e);
        }
      });
      listener();
      return { added, skipped };
    },
    onChange(cb) { listener = cb; },
  };
  return cart;
}

function groupBlock(hrefs) {
  setup();
  const block = document.querySelector('.downloads');
  block.innerHTML = hrefs.map((h) => `<button class="downloads-add" data-href="${h}" data-title="T ${h}" data-thumb="/t/${h}.jpg" aria-disabled="true"></button>`).join('');
  const all = document.createElement('button');
  all.className = 'downloads-add downloads-add-all';
  all.setAttribute('aria-disabled', 'true');
  block.before(all);
  return { block, all };
}

const settle = () => new Promise((r) => { setTimeout(r, 0); });

test('group toggle: adds the missing originals in one go, then removes them all', async () => {
  const { block, all } = groupBlock(['a', 'b', 'gone']);
  const cart = fakeDownloadsCart({}, ['a']);
  const ui = await import('../../scripts/media-cart-ui.js');
  await bindCart(block, all, async () => [cart, ui, { fetchPlaceholders: async () => ({}) }]);
  assert.equal(all.hasAttribute('aria-disabled'), false);
  assert.equal(all.getAttribute('aria-pressed'), 'false');
  assert.ok(all.hasAttribute('data-wired'));

  all.click();
  await settle();
  assert.deepEqual(cart.calls[0], [{ href: 'b', title: 'T b', thumb: '/t/b.jpg' }], 'only what is missing, never the unavailable tile');
  assert.equal(all.getAttribute('aria-pressed'), 'true');
  assert.ok(all.hasAttribute('data-in-cart'));
  assert.equal(all.getAttribute('aria-label'), 'Add all files to the media cart', 'a toggle keeps its name');

  all.click();
  await settle();
  assert.deepEqual([cart.has('a'), cart.has('b')], [false, false]);
  assert.equal(all.getAttribute('aria-pressed'), 'false');
  assert.equal(all.getAttribute('aria-label'), 'Add all files to the media cart');
});

test('group toggle: pressed once everything is in; a refused add names the reason', async () => {
  const { block, all } = groupBlock(['a', 'b']);
  const cart = fakeDownloadsCart({ b: 'limit-items' });
  const ui = await import('../../scripts/media-cart-ui.js');
  await bindCart(block, all, async () => [cart, ui, { fetchPlaceholders: async () => ({}) }]);
  all.click();
  await settle();
  const notice = document.querySelector('.media-cart-notice');
  assert.ok(notice && !notice.hidden);
  assert.match(notice.textContent, /^Added 1 of 2 files to the media cart\. Your download package is full/);
  assert.equal(all.getAttribute('aria-pressed'), 'false', 'not everything is in');
  assert.equal(all.hasAttribute('aria-busy'), false);
});

test('group toggle: counts the files that can\'t be added, then counts as complete', async () => {
  const { block, all } = groupBlock(['a', 'x', 'y']);
  const cart = fakeDownloadsCart({ x: 'unresolved', y: 'unresolved' });
  const ui = await import('../../scripts/media-cart-ui.js');
  await bindCart(block, all, async () => [cart, ui, { fetchPlaceholders: async () => ({}) }]);
  all.click();
  await settle();
  const notice = document.querySelector('.media-cart-notice');
  assert.equal(notice.querySelector('[role="alert"]').textContent, 'Added 1 of 3 files to the media cart. 2 files can\'t be added to the media cart.');
  assert.equal(all.getAttribute('aria-pressed'), 'true', 'everything that can be added is in');
  assert.equal(all.getAttribute('aria-label'), 'Add all files to the media cart', 'a toggle keeps its name');
});

// --- gallery variant (SKODA-806): a press-kit Images-chapter group -------------------------
const galleryBlock = (count, config = []) => {
  const block = setup(false);
  block.classList.add('gallery');
  // a group heading before the block: it must not be taken as a stats line
  const intro = document.createElement('div');
  intro.className = 'default-content-wrapper';
  intro.innerHTML = '<p>Plain copy before the group</p>';
  block.before(intro);
  config.forEach(([k, v]) => addConfig(block, k, v));
  for (let i = 0; i < count; i += 1) {
    addRow(block, {
      src: `/img${i}.jpg`,
      title: `Image ${i}`,
      links: [['Original', `https://www.skoda-storyboard.com/direct-download/img${i}.jpg`], ['1920px', `https://www.skoda-storyboard.com/direct-download/img${i}-1920x1080.jpg`]],
    });
  }
  return block;
};

test('gallery: the group pills sit above the grid; "Original" is the group toggle, "1920px" is inert', async () => {
  const block = galleryBlock(3);
  await decorate(block);
  const bar = block.querySelector(':scope > .downloads-toolbar.downloads-group');
  assert.ok(bar, 'a toolbar above the grid, not on the copy before the block');
  assert.equal(document.querySelector('.downloads-stats'), null);
  const [original, giant] = [...bar.querySelectorAll('button')];
  assert.equal(original.textContent, 'Original');
  assert.ok(original.classList.contains('downloads-add-all'));
  assert.equal(original.getAttribute('aria-label'), 'Add all Original versions to the media cart');
  assert.equal(giant.textContent, '1920px');
  assert.equal(giant.getAttribute('aria-disabled'), 'true');
  assert.equal(giant.getAttribute('aria-label'), '1920px versions can\'t be added to the media cart');
  assert.ok(!giant.classList.contains('downloads-add'), 'never bound as a tile toggle');
  // each tile keeps its add + download controls and both sizes in the menu
  const tiles = [...block.querySelectorAll('.downloads-item')];
  assert.equal(tiles.length, 3);
  tiles.forEach((tile) => {
    assert.equal(tile.querySelectorAll('.downloads-actions > .downloads-add, .downloads-actions .downloads-download').length, 2);
    assert.deepEqual([...tile.querySelectorAll('.downloads-size')].map((a) => a.textContent), ['Original', '1920px']);
  });
  assert.equal(block.classList.contains('downloads-media-box'), false);
});

test('gallery: collapses to two rows by default on the Media Box ladder (1 / 2 / 3 / 4); collapse none opts out', async () => {
  const block = galleryBlock(9);
  await decorate(block);
  const toggle = block.querySelector('.downloads-more');
  assert.ok(toggle, 'collapses without a collapse row');
  const visible = () => [...block.querySelectorAll('.downloads-item')].filter((tile) => !tile.hasAttribute('inert')).length;
  assert.equal(visible(), 2, '1 column at 500');
  window.setViewport(520);
  assert.equal(visible(), 4, '2 columns from 520');
  window.setViewport(768);
  assert.equal(visible(), 6, '3 columns from 768');
  window.setViewport(992);
  assert.equal(visible(), 8, '4 columns from 992');
  toggle.click();
  assert.equal(visible(), 9);
  assert.equal(toggle.textContent, 'Show less');

  const open = galleryBlock(9, [['collapse', 'none']]);
  await decorate(open);
  assert.equal(open.querySelector('.downloads-more'), null);
  assert.ok(open.querySelector('.downloads-toolbar.downloads-group'), 'the pills stay');
});

test('gallery: the "Original" pill adds the group\'s originals and keeps its own name', async () => {
  const block = galleryBlock(2);
  await decorate(block);
  // decorate() binds the real cart in the background: rebind a fresh pill to the fake one
  const built = block.querySelector('.downloads-add-all');
  const original = built.cloneNode(true);
  built.replaceWith(original);
  const giant = block.querySelector('.downloads-group-size:not(.downloads-add-all)');
  const cart = fakeDownloadsCart();
  const ui = await import('../../scripts/media-cart-ui.js');
  const { bindCart } = await import('./downloads.js');
  await bindCart(block, original, async () => [cart, ui, { fetchPlaceholders: async () => ({}) }]);
  original.click();
  await settle();
  assert.deepEqual(cart.calls[0].map((e) => e.href), [
    'https://www.skoda-storyboard.com/direct-download/img0.jpg',
    'https://www.skoda-storyboard.com/direct-download/img1.jpg',
  ], 'originals only');
  assert.equal(original.getAttribute('aria-pressed'), 'true');
  assert.equal(original.getAttribute('aria-label'), 'Add all Original versions to the media cart', 'label in name kept');
  original.click();
  await settle();
  assert.equal(original.getAttribute('aria-pressed'), 'false');
  assert.equal(giant.getAttribute('aria-disabled'), 'true', 'the 1920px pill is never wired');
  assert.equal(giant.hasAttribute('data-cart-control'), false);
});

test('gallery inside a Media Box section is the Media Box', async () => {
  const block = setup(true);
  block.classList.add('gallery');
  addRow(block, { src: '/a.jpg', title: 'A', links: [['Original', '/a.jpg']] });
  await decorate(block);
  assert.ok(block.classList.contains('downloads-media-box'));
  assert.equal(block.querySelector('.downloads-group'), null);
});

test('gallery CSS: Media Box ladder, overlay controls, source opener bar', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('./downloads.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(width >= 520px\) \{\s+\.downloads:is\(\.downloads-media-box, \.gallery\) \.downloads-items \{\s+--dl-cols: 2;/);
  assert.match(css, /\.downloads:is\(\.downloads-media-box, \.gallery\) \.downloads-items \{\s+--dl-cols: 3;/);
  assert.match(css, /\.downloads\.gallery \.downloads-actions \{\s+position: absolute;\s+inset-block-end: var\(--dl-overlay-inset\);\s+inset-inline-start: var\(--dl-overlay-inset\);/);
  assert.match(css, /\.downloads\.gallery\.downloads-collapsed \.downloads-more \{\s+margin-block-start: calc\(-1 \* var\(--dl-gallery-bar\)\);/);
});
