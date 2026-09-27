import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

/* eslint-disable import/no-extraneous-dependencies, no-undef */

const setup = (pressRelease = true) => {
  const dom = new JSDOM('<body><div class="downloads"></div></body>', {
    url: 'https://example.com/en/press-releases/sample',
  });
  if (pressRelease) dom.window.document.body.className = 'press-release';
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
  assert.equal(block.querySelector('.downloads-play').getAttribute('aria-hidden'), 'true');
  assert.equal(block.querySelector('.downloads-download').getAttribute('href'), 'https://example.com/video.mp4?version=2');
  assert.equal(block.querySelector('.downloads-download').getAttribute('aria-label'), 'Download Launch video (MP4)');
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

test('large press boxes disclose two rows; smaller boxes and stories retain their behavior', async () => {
  const small = setup();
  for (let i = 0; i < 8; i += 1) addRow(small, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(small);
  assert.equal(small.querySelector('.downloads-more'), null);

  const large = setup();
  for (let i = 0; i < 9; i += 1) addRow(large, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(large);
  const toggle = large.querySelector('.downloads-more');
  assert.equal(toggle.textContent, 'Show more');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.getAttribute('aria-controls'), large.querySelector('.downloads-items').id);
  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.textContent, 'Show less');
  toggle.click();
  assert.equal(large.classList.contains('downloads-expanded'), false);

  const story = setup(false);
  for (let i = 0; i < 9; i += 1) addRow(story, { title: `PDF ${i}`, links: [['PDF', `/file${i}.pdf`]] });
  await decorate(story);
  assert.equal(story.querySelector('.downloads-more'), null);
  assert.equal(story.querySelectorAll('.downloads-file').length, 9);
});

test('mediabox API mode still renders configured images without a file tile', async () => {
  const block = setup();
  const originalFetch = globalThis.fetch;
  const config = [['source', 'mediabox'], ['postid', '123']];
  config.forEach(([key, value]) => {
    const row = document.createElement('div');
    [key, value].forEach((text) => {
      const cell = document.createElement('div');
      cell.textContent = text;
      row.append(cell);
    });
    block.append(row);
  });
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
