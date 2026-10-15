/*
 * `Embed (vimeo)` with the clip's MP4 master (`file` row): Vimeo's player where Vimeo allows this
 * domain, else the master with the source player's controls (the source's account locks some
 * clips to its own domain, SKODA-805c). Vimeo's oEmbed is stubbed.
 * Run: node --test blocks/embed/embed-vimeo.test.mjs
 */
/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM;
try {
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* importer validator may have no test dependencies */ }

const VIMEO = 'https://player.vimeo.com/video/1218264535?dnt=1&app_id=122963';
const MP4 = 'https://publish-p220607-e2281243.adobeaemcloud.com/content/dam/storyboard/en/clip.mp4';

function setup({ search = '', oembed = () => ({ ok: true, json: { title: 'Clip' } }) } = {}) {
  const dom = new JSDOM(`<main><div class="embed vimeo">
    <div><div>url</div><div><a href="${VIMEO}">Clip title</a></div></div>
    <div><div>file</div><div><a href="${MP4}">Clip title</a></div></div>
    <div><div>title</div><div>Clip title</div></div>
  </div></main>`, { url: `https://example.com/en/videos${search}` });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  const asked = [];
  globalThis.fetch = async (url) => {
    asked.push(String(url));
    const r = oembed(String(url));
    if (r instanceof Error) throw r;
    return { ok: r.ok, status: r.ok ? 200 : 404, json: async () => r.json };
  };
  return { window, block: window.document.querySelector('.embed'), asked };
}
const settle = () => new Promise((r) => { setTimeout(r, 20); });
// a fresh module per test: the answers are cached per page
let n = 0;
const load = async () => { n += 1; return import(`./embed.js?case=${n}`); };

test('a clip Vimeo plays here: the Vimeo player, as the source (no native video)', { skip: !JSDOM }, async () => {
  const { block, asked } = setup();
  const { default: decorate } = await load();
  decorate(block);
  await settle();
  assert.equal(asked.length, 1);
  assert.equal(asked[0], 'https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F1218264535');
  const iframe = block.querySelector('iframe');
  assert.ok(iframe, 'the Vimeo player');
  assert.match(iframe.getAttribute('src') || iframe.dataset.src, /^https:\/\/player\.vimeo\.com\/video\/1218264535\?.*dnt=1/);
  assert.equal(iframe.getAttribute('title'), 'Clip title');
  assert.equal(block.querySelector('video'), null);
  assert.ok(block.classList.contains('embed-vimeo'));
});

test('a clip locked to the source domain (oEmbed 403): the master, no iframe', { skip: !JSDOM }, async () => {
  const { block } = setup({ oembed: () => ({ ok: true, json: { domain_status_code: 403 } }) });
  const { default: decorate } = await load();
  decorate(block);
  await settle();
  assert.equal(block.querySelector('iframe'), null);
  assert.equal(block.querySelector('video source').getAttribute('src'), MP4);
  assert.ok(block.classList.contains('embed-file'));
});

test('Vimeo not answering (network error, a non-OK reply): the master, which always plays', { skip: !JSDOM }, async () => {
  for (const oembed of [() => new Error('offline'), () => ({ ok: false, json: null })]) {
    const { block } = setup({ oembed });
    // eslint-disable-next-line no-await-in-loop
    const { default: decorate } = await load();
    decorate(block);
    // eslint-disable-next-line no-await-in-loop
    await settle();
    assert.equal(block.querySelector('iframe'), null);
    assert.ok(block.querySelector('video'));
  }
});

test('no embed consent: nothing asks Vimeo, the master plays', { skip: !JSDOM }, async () => {
  const { block, asked } = setup({ search: '?consent=decline' });
  const { default: decorate } = await load();
  decorate(block);
  await settle();
  assert.equal(asked.length, 0);
  assert.ok(block.querySelector('video'));
});

test('playsHere: one question per clip, none for a broken id', { skip: !JSDOM }, async () => {
  const { asked } = setup();
  const { playsHere } = await load();
  assert.equal(await playsHere('1218264535'), true);
  assert.equal(await playsHere('1218264535'), true);
  assert.equal(asked.length, 1, 'cached');
  assert.equal(await playsHere('../x'), false);
  assert.equal(await playsHere(''), false);
  assert.equal(asked.length, 1);
});

test('a broken or non-video file row: the plain Vimeo embed, as before', { skip: !JSDOM }, async () => {
  const { block, asked } = setup();
  block.querySelectorAll(':scope > div')[1].lastElementChild.innerHTML = '<a href="https://example.com/notes.pdf">notes</a>';
  const { default: decorate } = await load();
  decorate(block);
  await settle();
  assert.equal(asked.length, 0, 'no question without a master');
  assert.ok(block.querySelector('iframe'));
});
