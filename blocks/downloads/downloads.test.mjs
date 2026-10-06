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
  const visible = () => [...eight.querySelectorAll('.downloads-item')].filter((tile) => !tile.hidden).length;
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
  const visible = () => [...large.querySelectorAll('.downloads-item')].filter((tile) => !tile.hidden).length;
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
  assert.equal([...variant.querySelectorAll('.downloads-item')].filter((tile) => tile.hidden).length, 1);

  const disabled = setup();
  addConfig(disabled, 'collapse', 'none');
  for (let i = 0; i < 9; i += 1) addRow(disabled, { title: `File ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(disabled);
  assert.equal(disabled.querySelector('.downloads-more'), null);

  const optedIn = setup(false);
  addConfig(optedIn, 'collapse', 'auto');
  for (let i = 0; i < 9; i += 1) addRow(optedIn, { title: `File ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(optedIn);
  assert.equal([...optedIn.querySelectorAll('.downloads-item')].filter((tile) => !tile.hidden).length, 2);
});

test('disclosure disappears when a configured wide grid fits every item', async () => {
  const block = setup();
  addConfig(block, 'columns', '5');
  for (let i = 0; i < 9; i += 1) addRow(block, { title: `File ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(block);
  assert.equal(block.querySelector('.downloads-more').hidden, false);
  window.setViewport(992);
  assert.equal(block.querySelector('.downloads-more').hidden, true);
  assert.equal([...block.querySelectorAll('.downloads-item')].filter((tile) => tile.hidden).length, 0);
  window.setViewport(500);
  assert.equal(block.querySelector('.downloads-more').hidden, false);
  assert.equal([...block.querySelectorAll('.downloads-item')].filter((tile) => tile.hidden).length, 7);
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
