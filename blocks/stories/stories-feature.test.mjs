/*
 * Unit tests for the Stories feed's featured model card (SKODA-222, contract `stories-feature`):
 * reading the `feature` row, the card's markup and disclosure, its first-cell placement, the
 * first page shrinking by FEATURE_SLOTS, Load more, and feeds without the row staying as before.
 * jsdom lives here, apart from stories.test.mjs and its hand-rolled DOM shim.
 * Run: node --test blocks/stories/stories-feature.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/tag/model/epiq', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
window.hlx = { codeBasePath: '' };
window.matchMedia = () => ({ matches: false, addEventListener() {} });

const story = (n) => ({
  path: `/en/story-${n}`,
  title: `Story ${n}`,
  template: 'story',
  date: `2026-09-${String(n).padStart(2, '0')}`,
  tags: 'epiq',
});
const feeds = {};
globalThis.fetch = async (url) => {
  const u = new URL(String(url), window.location.href);
  const rows = feeds[u.pathname] || [];
  const body = u.pathname.includes('placeholders') ? { data: [] } : {
    total: rows.length, offset: 0, limit: rows.length, data: rows,
  };
  return { ok: true, status: 200, json: async () => body };
};

const {
  default: decorate, readFeature, buildFeature, FEATURE_SLOTS,
} = await import('./stories.js');

const FEATURE_CELL = `
  <p><picture><img src="./media_epiq.jpg?width=750&format=jpg" alt="" width="3840" height="1920"></picture></p>
  <h3 id="explore-the-epiq">Explore the Epiq</h3>
  <p><strong><a href="/en/skoda-model/epiq">Discover the highlights</a></strong></p>
  <p><a href="/en/images?filter%5Bmodel%5D%5B0%5D=epiq">Images</a></p>
  <p><a href="/en/videos?filter%5Bmodel%5D%5B0%5D=epiq">Videos</a></p>`;

function storiesBlock(index, { feature = FEATURE_CELL, rows = {} } = {}) {
  const block = document.createElement('div');
  block.className = 'stories block';
  const config = {
    index, template: 'story', tag: 'epiq', columns: '3', initial: '6', perpage: '6', excludefeatured: 'false', ...rows,
  };
  block.innerHTML = Object.entries(config).map(([k, v]) => `<div><div>${k}</div><div>${v}</div></div>`).join('')
    + (feature === null ? '' : `<div><div>feature</div><div>${feature}</div></div>`);
  document.querySelector('main').replaceChildren(block);
  return block;
}

async function decorated(index, count, opts) {
  feeds[index] = Array.from({ length: count }, (_, i) => story(i + 1));
  const block = storiesBlock(index, opts);
  window.history.replaceState(null, '', '/en/tag/model/epiq');
  await decorate(block);
  return block;
}

const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

test('readFeature: title, image, CTAs with the <strong> one primary', () => {
  const feature = readFeature(storiesBlock('/x.json'));
  assert.equal(feature.title, 'Explore the Epiq');
  assert.match(feature.image.src, /media_epiq\.jpg/);
  assert.equal(feature.image.alt, '');
  assert.deepEqual(feature.links.map((l) => [l.text, l.href, l.primary]), [
    ['Discover the highlights', '/en/skoda-model/epiq', true],
    ['Images', '/en/images?filter%5Bmodel%5D%5B0%5D=epiq', false],
    ['Videos', '/en/videos?filter%5Bmodel%5D%5B0%5D=epiq', false],
  ]);
});

test('readFeature: reads the primary CTA from decorateButtons output (a.button.primary), not the order', () => {
  // what the page holds by the time blocks run: scripts.js decorateButtons swapped <strong><a> for a.button.primary
  const feature = readFeature(storiesBlock('/x.json', {
    feature: `<h3>Explore the Epiq</h3>
      <p class="button-wrapper"><a href="/en/images" class="button secondary">Images</a></p>
      <p class="button-wrapper"><a href="/en/skoda-model/epiq" class="button primary">Discover the highlights</a></p>
      <p><a href="/en/videos">Videos</a></p>`,
  }));
  assert.deepEqual(feature.links.map((l) => [l.text, l.primary]), [
    ['Images', false], ['Discover the highlights', true], ['Videos', false],
  ]);
});

test('readFeature: a link inside the title is not a CTA; the authored image size is kept', () => {
  const feature = readFeature(storiesBlock('/x.json', {
    feature: `<p><picture><img src="./m.jpg" alt="Epiq" width="3840" height="1920"></picture></p>
      <h3><a href="/en/skoda-model/epiq">Explore the Epiq</a></h3><p><a href="/en/images">Images</a></p>`,
  }));
  assert.equal(feature.title, 'Explore the Epiq');
  assert.deepEqual(feature.links.map((l) => l.text), ['Images']);
  assert.deepEqual([feature.image.width, feature.image.height, feature.image.alt], ['3840', '1920', 'Epiq']);
  const img = buildFeature(feature).querySelector('.stories-feature-image img');
  assert.deepEqual([img.getAttribute('width'), img.getAttribute('height')], ['3840', '1920']);
});

test('readFeature: no row, or a row without links, means no card; an unmarked first link is primary', () => {
  assert.equal(readFeature(storiesBlock('/x.json', { feature: null })), null);
  assert.equal(readFeature(storiesBlock('/x.json', { feature: '<h3>Explore</h3>' })), null);
  const plain = readFeature(storiesBlock('/x.json', { feature: '<p><a href="/en/a">A</a></p><p><a href="/en/b">B</a></p>' }));
  assert.deepEqual(plain.links.map((l) => l.primary), [true, false]);
  assert.equal(plain.title, '');
  assert.equal(plain.image, null);
});

test('buildFeature: an h2 with the disclosure button and the plain title, then image + CTA list', () => {
  const card = buildFeature(readFeature(storiesBlock('/x.json')));
  assert.equal(card.tagName, 'LI');
  assert.equal(card.className, 'stories-feature');
  const h2 = card.querySelector('h2.stories-feature-title');
  const toggle = h2.querySelector('button.stories-feature-toggle');
  assert.equal(toggle.type, 'button');
  assert.equal(toggle.textContent, 'Explore the Epiq');
  assert.equal(h2.querySelector('.stories-feature-text').textContent, 'Explore the Epiq');
  const panel = card.querySelector('.stories-feature-panel');
  assert.equal(toggle.getAttribute('aria-controls'), panel.id);
  assert.ok(panel.id);
  const img = panel.querySelector('picture.stories-feature-image img');
  assert.match(img.getAttribute('src'), /media_epiq\.jpg\?width=480/);
  assert.equal(img.getAttribute('loading'), 'lazy');
  const ctas = [...panel.querySelectorAll('ul.stories-feature-ctas > li > a.stories-feature-cta')];
  assert.deepEqual(ctas.map((a) => [a.textContent, a.getAttribute('href'), a.classList.contains('primary')]), [
    ['Discover the highlights', '/en/skoda-model/epiq', true],
    ['Images', '/en/images?filter%5Bmodel%5D%5B0%5D=epiq', false],
    ['Videos', '/en/videos?filter%5Bmodel%5D%5B0%5D=epiq', false],
  ]);
  assert.ok(ctas.slice(1).every((a) => a.classList.contains('secondary')));
});

test('buildFeature: the external configurator CTA opens in a new tab; site links stay in place', () => {
  const card = buildFeature(readFeature(storiesBlock('/x.json', {
    feature: `<h3>Explore the Elroq</h3><p><strong><a href="/en/skoda-model/elroq">Discover the highlights</a></strong></p>
      <p><a href="https://cc.skoda-auto.com/gbr/en-GB/">Configure your Elroq</a></p>`,
  })));
  const [site, external] = card.querySelectorAll('.stories-feature-cta');
  assert.equal(site.target, '');
  assert.equal(external.target, '_blank');
  assert.equal(external.rel, 'noopener noreferrer');
  assert.ok(external.classList.contains('secondary'));
  const mail = buildFeature(readFeature(storiesBlock('/x.json', { feature: '<p><a href="mailto:press@skoda-auto.cz">Mail</a></p>' })));
  assert.equal(mail.querySelector('a').target, '', 'mailto/tel stay in place');
});

test('buildFeature: the title is an h4 under an authored feed heading', () => {
  const card = buildFeature(readFeature(storiesBlock('/x.json')), { titleLevel: 4 });
  assert.equal(card.querySelector('.stories-feature-title').tagName, 'H4');
});

test('buildFeature: the toggle opens and closes the card (aria-expanded + is-expanded)', () => {
  const card = buildFeature(readFeature(storiesBlock('/x.json')));
  const toggle = card.querySelector('.stories-feature-toggle');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(card.classList.contains('is-expanded'), false);
  click(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(card.classList.contains('is-expanded'), true);
  click(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(card.classList.contains('is-expanded'), false);
});

test('buildFeature: without a title there is no toggle and the CTAs stay open', () => {
  const card = buildFeature(readFeature(storiesBlock('/x.json', { feature: '<p><a href="/en/a">A</a></p>' })));
  assert.equal(card.querySelector('.stories-feature-title'), null);
  assert.equal(card.classList.contains('is-expanded'), true);
  assert.equal(card.querySelectorAll('.stories-feature-cta').length, 1);
});

test('buildFeature: each card gets its own panel id', () => {
  const a = buildFeature(readFeature(storiesBlock('/x.json')));
  const b = buildFeature(readFeature(storiesBlock('/x.json')));
  assert.notEqual(a.querySelector('.stories-feature-panel').id, b.querySelector('.stories-feature-panel').id);
});

test('decorate: the card is the first cell and the first page shows initial - 2 stories (source offset 4)', async () => {
  const block = await decorated('/en/feature-a.json', 20);
  assert.equal(FEATURE_SLOTS, 2);
  assert.ok(block.classList.contains('has-feature'));
  assert.ok(block.classList.contains('stories-cols-3'));
  const cells = [...block.querySelectorAll('.stories-items > li')];
  assert.equal(cells[0].className, 'stories-feature');
  assert.equal(block.querySelectorAll('.stories-item').length, 4);
  assert.equal(block.querySelectorAll('.stories-feature').length, 1);
  // the config rows are gone, the card's content now lives only in the card
  assert.equal(block.querySelector(':scope > div > div'), null);
});

test('decorate: Load more appends perpage stories, keeps the card first and open, and moves focus', async () => {
  const block = await decorated('/en/feature-b.json', 20);
  const card = block.querySelector('.stories-feature');
  click(card.querySelector('.stories-feature-toggle'));
  click(block.querySelector('.stories-loadmore-btn'));
  const cells = [...block.querySelectorAll('.stories-items > li')];
  assert.equal(cells[0], card, 'the same card element, so its open state survives');
  assert.ok(card.classList.contains('is-expanded'));
  assert.equal(block.querySelectorAll('.stories-item').length, 10);
  assert.equal(document.activeElement, cells[5].querySelector('a'), 'focus on the first new story');
  assert.equal(new URL(window.location.href).searchParams.get('offset'), '10');
});

test('decorate: a deep link restores the count against the smaller first page', async () => {
  feeds['/en/feature-c.json'] = Array.from({ length: 20 }, (_, i) => story(i + 1));
  const block = storiesBlock('/en/feature-c.json');
  window.history.replaceState(null, '', '/en/tag/model/epiq?offset=10');
  await decorate(block);
  assert.equal(block.querySelectorAll('.stories-item').length, 10);
  window.history.replaceState(null, '', '/en/tag/model/epiq');
});

test('decorate: Back to the page without an offset restores the 4-story first page', async () => {
  const block = await decorated('/en/feature-f.json', 20);
  click(block.querySelector('.stories-loadmore-btn'));
  assert.equal(block.querySelectorAll('.stories-item').length, 10);
  window.history.replaceState(null, '', '/en/tag/model/epiq');
  window.dispatchEvent(new window.PopStateEvent('popstate'));
  assert.equal(block.querySelectorAll('.stories-item').length, 4);
  assert.equal(block.querySelector('.stories-items > li').className, 'stories-feature');
});

test('decorate: the card paints before the index and stays when the index fails', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => (String(url).includes('placeholders')
    ? realFetch(url) : { ok: false, status: 500, json: async () => ({}) });
  try {
    const block = storiesBlock('/en/feature-broken.json');
    await decorate(block);
    assert.ok(block.querySelector('.stories-items > li.stories-feature'), 'authored card kept');
    assert.equal(block.querySelector('.stories-status').textContent, 'Could not load results.');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('decorate: no feature row keeps the feed as before (6 stories, no card, no has-feature)', async () => {
  const block = await decorated('/en/feature-d.json', 20, { feature: null });
  assert.equal(block.classList.contains('has-feature'), false);
  assert.equal(block.querySelector('.stories-feature'), null);
  assert.equal(block.querySelectorAll('.stories-item').length, 6);
});

test('decorate: the card still renders when the tag has no stories yet', async () => {
  const block = await decorated('/en/feature-e.json', 0);
  assert.ok(block.querySelector('.stories-items > li.stories-feature'));
  assert.equal(block.querySelector('.stories-loadmore-btn'), null);
});
