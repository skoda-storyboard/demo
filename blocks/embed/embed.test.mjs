/*
 * Embeds block tests (SKODA-204).
 * Zero-dependency: node:test + a minimal DOM shim (the block uses a small DOM surface).
 * No jsdom/browser needed, so this runs on any checkout.
 * Run: node --test blocks/embed/embed.test.mjs
 *
 * Focus: the acceptance-critical URL normalisation + provider/audio detection that a browser
 * preview cannot easily assert (Vimeo dnt=1, live youtube.com embed URL, audio vs video, ratio,
 * lazy + title, invalid-URL rejection). Rendering geometry is verified separately in preview.
 */
/* eslint-disable no-underscore-dangle, no-undef, max-classes-per-file */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// --- minimal DOM shim -----------------------------------------------------
class El {
  constructor(tag) {
    this.tagName = (tag || 'DIV').toUpperCase();
    this.children = [];
    this.className = '';
    this.attributes = {};
    this.dataset = {};
    this.style = { setProperty(k, v) { this[k] = v; } };
    this._text = '';
    this._parent = null;
    this._listeners = {};
  }

  get classList() {
    const self = this;
    return {
      contains: (c) => self.className.split(/\s+/).includes(c),
      add: (c) => { if (!self.className.split(/\s+/).includes(c)) self.className = `${self.className} ${c}`.trim(); },
      remove: (c) => { self.className = self.className.split(/\s+/).filter((x) => x && x !== c).join(' '); },
    };
  }

  focus() { globalThis.__focused = this; globalThis.document.activeElement = this; }

  contains(node) {
    let n = node;
    while (n && n !== this) n = n._parent;
    return n === this;
  }

  set textContent(v) { this._text = v; this.children = []; }

  get textContent() {
    if (this.children.length) return this.children.map((c) => c.textContent).join('');
    return this._text;
  }

  set href(v) { this.attributes.href = v; }

  get href() { return this.attributes.href; }

  set type(v) { this.attributes.type = v; }

  set src(v) { this.attributes.src = v; }

  get src() { return this.attributes.src; }

  setAttribute(k, v) { this.attributes[k] = v; }

  getAttribute(k) { return this.attributes[k] ?? null; }

  removeAttribute(k) { delete this.attributes[k]; }

  addEventListener(type, fn, options) {
    const listener = options?.once
      ? () => { this.removeEventListener(type, listener); fn(); }
      : fn;
    (this._listeners[type] ||= []).push(listener);
  }

  removeEventListener(type, fn) {
    this._listeners[type] = (this._listeners[type] || []).filter((f) => f !== fn);
  }

  dispatch(type) { (this._listeners[type] || []).forEach((fn) => fn()); }

  append(...kids) { kids.forEach((k) => { k._parent = this; this.children.push(k); }); }

  replaceWith(node) {
    const parent = this._parent;
    if (!parent) return;
    node._parent = parent;
    parent.children[parent.children.indexOf(this)] = node;
    this._parent = null;
  }

  remove() {
    if (!this._parent) return;
    this._parent.children = this._parent.children.filter((c) => c !== this);
  }

  closest(sel) {
    // supports '.embed, .widget' and single tag/class
    const wants = sel.split(',').map((s) => s.trim());
    let n = this;
    while (n) {
      if (wants.some((w) => (w.startsWith('.') ? n.classList.contains(w.slice(1)) : n.tagName === w.toUpperCase()))) return n;
      n = n._parent;
    }
    return null;
  }

  _walk(fn) { this.children.forEach((c) => { fn(c); c._walk(fn); }); }

  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }

  querySelectorAll(sel) {
    // direct-child selectors used by the table-form config reader
    const divKids = (n) => n.children.filter((c) => c.tagName === 'DIV');
    if (sel === ':scope > div') return divKids(this);
    if (sel === ':scope > div > div') return divKids(this).flatMap(divKids);
    const out = [];
    const match = (c) => {
      if (sel === 'a[href]') return c.tagName === 'A' && c.attributes.href != null;
      if (sel === 'iframe[data-src]') return c.tagName === 'IFRAME' && c.dataset.src != null;
      if (sel.startsWith('.')) return c.classList.contains(sel.slice(1));
      if (sel.includes(':scope')) return false; // table form not exercised here
      return c.tagName === sel.toUpperCase();
    };
    this._walk((c) => { if (match(c)) out.push(c); });
    return out;
  }
}

globalThis.window = globalThis.window || {
  location: { href: 'https://x/', pathname: '/en/test', search: '' },
  hlx: { codeBasePath: '' },
};
// window events for scripts/embed-consent.js (SKODA-204a)
const windowEvents = new EventTarget();
globalThis.window.addEventListener = windowEvents.addEventListener.bind(windowEvents);
globalThis.window.removeEventListener = windowEvents.removeEventListener.bind(windowEvents);
globalThis.window.dispatchEvent = windowEvents.dispatchEvent.bind(windowEvents);
// the no-consent placeholder reads the placeholders sheet: none in tests (English defaults)
globalThis.__fetches = 0;
globalThis.fetch = async () => { globalThis.__fetches += 1; return { ok: false }; };
globalThis.document = { createElement: (t) => new El(t) };
globalThis.window.document = globalThis.document;

// Build an autoblocked embed block: block > div > div > a[href].
function buildEmbed(href, { title } = {}) {
  const block = new El('div');
  block.classList.add('embed');
  const a = new El('a');
  a.setAttribute('href', href);
  a.textContent = title || href;
  if (title) a.setAttribute('title', title);
  block.append(a);
  return block;
}

const { default: decorate } = await import('./embed.js');

// YouTube shows the click-to-load poster (SKODA-702a): press play and return the player.
function play(block) {
  block.querySelector('.embed-play').dispatch('click');
  return block.querySelector('iframe');
}

test('Vimeo: preserves dnt=1, uses player host, video wrapper, lazy + title, direct src', () => {
  const block = buildEmbed('https://vimeo.com/1221703335', { title: 'Octavia film' });
  decorate(block);
  const wrapper = block.querySelector('.embed-video');
  assert.ok(wrapper, 'video wrapper present');
  assert.equal(wrapper.style['--embed-ratio'], '16 / 9');
  const iframe = wrapper.querySelector('iframe');
  const src = iframe.getAttribute('src');
  assert.ok(src.startsWith('https://player.vimeo.com/video/1221703335?'), src);
  assert.equal(new URL(src).searchParams.get('dnt'), '1');
  assert.equal(iframe.getAttribute('loading'), 'lazy');
  assert.equal(iframe.getAttribute('title'), 'Octavia film');
  assert.equal(iframe.dataset.src, undefined, 'src set directly (no consent gate)');
  assert.ok(block.classList.contains('embed-vimeo'));
});

test('Vimeo already-embed URL keeps app_id and forces dnt=1', () => {
  const block = buildEmbed('https://player.vimeo.com/video/1003242587?app_id=122963');
  decorate(block);
  const src = block.querySelector('iframe').getAttribute('src');
  const params = new URL(src).searchParams;
  assert.equal(params.get('dnt'), '1');
  assert.equal(params.get('app_id'), '122963');
});

test('YouTube: the played URL is the live embed URL (feature=oembed + enablejsapi) + autoplay', () => {
  const block = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw');
  decorate(block);
  const iframe = play(block);
  assert.equal(iframe.getAttribute('src'), 'https://www.youtube.com/embed/9LfK-A20pgw?feature=oembed&enablejsapi=1&autoplay=1&playsinline=1');
  assert.equal(iframe.dataset.src, undefined);
  // allow list matches live YouTube verbatim (accelerometer/gyroscope, no fullscreen)
  assert.equal(iframe.getAttribute('allow'), 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
  assert.ok(block.querySelector('.embed-video'));
  assert.equal(block.querySelector('.embed-consent'), null);
});

test('YouTube: /embed/ + si token and youtu.be forms both build the live URL', () => {
  const a = buildEmbed('https://www.youtube.com/embed/B4ZafpJKk0M?si=v58s4T3awpvcBd7Y');
  decorate(a);
  assert.equal(play(a).getAttribute('src'), 'https://www.youtube.com/embed/B4ZafpJKk0M?feature=oembed&si=v58s4T3awpvcBd7Y&enablejsapi=1&autoplay=1&playsinline=1');
  const b = buildEmbed('https://youtu.be/atipTWwYw5E');
  decorate(b);
  assert.equal(play(b).getAttribute('src'), 'https://www.youtube.com/embed/atipTWwYw5E?feature=oembed&enablejsapi=1&autoplay=1&playsinline=1');
});

// --- SKODA-702a: YouTube click-to-load poster --------------------------------

test('YouTube poster: no player before the click, one labelled button with the poster', () => {
  const block = buildEmbed('https://www.youtube.com/watch?v=1Y3QHmZeLxk');
  decorate(block);
  assert.equal(block.querySelector('iframe'), null, 'no player: nothing but the poster reaches YouTube');
  const wrapper = block.querySelector('.embed-video');
  assert.equal(wrapper.style['--embed-ratio'], '16 / 9', 'the poster keeps the 16:9 box (no CLS)');
  assert.equal(wrapper.children.length, 1);
  const button = wrapper.children[0];
  assert.equal(button.tagName, 'BUTTON');
  assert.equal(button.className, 'embed-play');
  assert.equal(button.getAttribute('type'), 'button');
  assert.equal(button.getAttribute('aria-label'), 'Play YouTube video', 'bare URL: the generic label, not said twice');
  const img = button.querySelector('img');
  assert.equal(img.getAttribute('src'), 'https://i.ytimg.com/vi/1Y3QHmZeLxk/maxresdefault.jpg');
  assert.equal(img.getAttribute('alt'), '', 'decorative: the button carries the name');
  assert.equal(img.getAttribute('loading'), 'lazy');
  assert.ok(block.classList.contains('embed-youtube'));
});

test('YouTube poster: a descriptive title names the button', () => {
  const block = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw', { title: 'The all-new Škoda Kodiaq RS' });
  decorate(block);
  assert.equal(block.querySelector('.embed-play').getAttribute('aria-label'), 'Play video: The all-new Škoda Kodiaq RS');
  assert.equal(play(block).getAttribute('title'), 'The all-new Škoda Kodiaq RS');
});

test('YouTube poster: the click swaps in the player, plays it and moves focus into it', () => {
  const block = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw');
  const other = buildEmbed('https://youtu.be/atipTWwYw5E');
  decorate(block);
  decorate(other);
  const iframe = play(block);
  assert.equal(block.querySelector('.embed-play'), null, 'the poster is gone');
  assert.equal(block.querySelector('.embed-video').children[0], iframe, 'the player takes its place');
  assert.equal(new URL(iframe.getAttribute('src')).searchParams.get('autoplay'), '1', 'one click plays');
  assert.equal(globalThis.__focused, iframe);
  assert.ok(other.querySelector('.embed-play'), 'another video keeps its poster');
  assert.equal(other.querySelector('iframe'), null);
});

test('YouTube poster: maxresdefault missing (error or 120px placeholder) → hqdefault, once', () => {
  const missing = buildEmbed('https://www.youtube.com/watch?v=abc');
  decorate(missing);
  const img = missing.querySelector('img');
  img.dispatch('error');
  assert.equal(img.getAttribute('src'), 'https://i.ytimg.com/vi/abc/hqdefault.jpg');
  img.setAttribute('src', 'stays');
  img.dispatch('error'); // a failing fallback doesn't loop
  assert.equal(img.getAttribute('src'), 'stays');

  const placeholder = buildEmbed('https://www.youtube.com/watch?v=def');
  decorate(placeholder);
  const small = placeholder.querySelector('img');
  small.naturalWidth = 120; // YouTube's grey "no thumbnail" image
  small.dispatch('load');
  assert.equal(small.getAttribute('src'), 'https://i.ytimg.com/vi/def/hqdefault.jpg');

  const found = buildEmbed('https://www.youtube.com/watch?v=ghi');
  decorate(found);
  const big = found.querySelector('img');
  big.naturalWidth = 1280;
  big.dispatch('load');
  assert.equal(big.getAttribute('src'), 'https://i.ytimg.com/vi/ghi/maxresdefault.jpg');
});

test('YouTube poster: a Shorts URL takes its poster from the video id', () => {
  const block = buildEmbed('https://www.youtube.com/shorts/Xy12_ab-Cd');
  decorate(block);
  assert.equal(block.querySelector('img').getAttribute('src'), 'https://i.ytimg.com/vi/Xy12_ab-Cd/maxresdefault.jpg');
});

test('YouTube poster: a second click does nothing (one player, loaded once)', () => {
  const block = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw');
  decorate(block);
  const button = block.querySelector('.embed-play');
  button.dispatch('click');
  const iframe = block.querySelector('iframe');
  iframe.setAttribute('src', 'marked');
  button.dispatch('click'); // e.g. a double click
  assert.equal(iframe.getAttribute('src'), 'marked', 'not reloaded');
  assert.equal(block.querySelector('.embed-video').children.length, 1);
});

test('YouTube URLs: a list param keeps the video; extra youtu.be segments are ignored', () => {
  const list = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw&list=PL123');
  decorate(list);
  assert.equal(list.querySelector('img').getAttribute('src'), 'https://i.ytimg.com/vi/9LfK-A20pgw/maxresdefault.jpg');
  const extra = buildEmbed('https://youtu.be/atipTWwYw5E/extra');
  decorate(extra);
  assert.equal(extra.querySelector('img').getAttribute('src'), 'https://i.ytimg.com/vi/atipTWwYw5E/maxresdefault.jpg');
  assert.equal(play(extra).getAttribute('src'), 'https://www.youtube.com/embed/atipTWwYw5E?feature=oembed&enablejsapi=1&autoplay=1&playsinline=1');
});

test('YouTube URLs with an id that is not a video id are rejected', () => {
  [
    'https://www.youtube.com/watch?v=a%2F..%2F..%2Fx', // would leave /embed/
    'https://www.youtube.com/watch?v=abc%23frag', // would move the params into a fragment
    'https://www.youtube.com/watch?v=abc%22%3E',
    'https://youtu.be/',
  ].forEach((href) => assertRejected(buildEmbed(href), href));
});

test('Buzzsprout: audio wrapper (fixed height, not 16:9), iframe=true preserved', () => {
  const block = buildEmbed('https://www.buzzsprout.com/1730804/episodes/19710108-x?client_source=small_player&iframe=true');
  decorate(block);
  assert.ok(block.querySelector('.embed-audio'), 'audio wrapper');
  assert.equal(block.querySelector('.embed-video'), null, 'not a video wrapper');
  const src = block.querySelector('iframe').getAttribute('src');
  assert.equal(new URL(src).searchParams.get('iframe'), 'true');
  assert.ok(block.classList.contains('embed-buzzsprout'));
});

test('Spotify: audio wrapper + /embed/ path injection', () => {
  const block = buildEmbed('https://open.spotify.com/episode/abc123');
  decorate(block);
  assert.ok(block.querySelector('.embed-audio'));
  assert.equal(block.querySelector('iframe').getAttribute('src'), 'https://open.spotify.com/embed/episode/abc123');
});

test('Vimeo carries the live Vimeo allow list (fullscreen, no gyroscope) and no data-src', () => {
  const block = buildEmbed('https://vimeo.com/1221703335');
  decorate(block);
  const iframe = block.querySelector('iframe');
  assert.equal(iframe.getAttribute('allow'), 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
  assert.ok(iframe.getAttribute('src'), 'src is set');
  assert.equal(iframe.dataset.src, undefined, 'no data-src (no gate)');
});

test('with consent: no consent box for any provider; only YouTube gets the poster', () => {
  [
    ['https://vimeo.com/1', false],
    ['https://www.youtube.com/watch?v=abc', true],
    ['https://open.spotify.com/episode/x', false],
    ['https://www.buzzsprout.com/1730804/episodes/123', false],
  ].forEach(([href, poster]) => {
    const block = buildEmbed(href);
    decorate(block);
    assert.equal(block.querySelector('.embed-consent'), null, `${href}: no consent box`);
    assert.equal(!!block.querySelector('.embed-play'), poster, `${href}: poster ${poster}`);
    assert.equal(!!block.querySelector('iframe'), !poster, `${href}: iframe ${!poster}`);
  });
});

test('authored ratio override is applied', () => {
  const block = buildEmbed('https://vimeo.com/1');
  block.dataset.ratio = '4x3';
  decorate(block);
  assert.equal(block.querySelector('.embed-video').style['--embed-ratio'], '4 / 3');
});

// --- invalid authoring (PR #109 review) --------------------------------------

// Run fn with console.warn captured; returns the warn call count.
function countWarnings(fn) {
  const orig = console.warn;
  let calls = 0;
  console.warn = () => { calls += 1; };
  try { fn(); } finally { console.warn = orig; }
  return calls;
}

// Assert the block rendered nothing, was flagged, and the authoring error was reported.
function assertRejected(block, label) {
  const warnings = countWarnings(() => assert.doesNotThrow(() => decorate(block), label));
  assert.equal(block.querySelector('iframe'), null, `${label}: no iframe`);
  assert.equal(block.children.length, 0, `${label}: raw cells cleared`);
  assert.ok(block.classList.contains('embed-invalid'), `${label}: flagged embed-invalid`);
  assert.equal(warnings, 1, `${label}: authoring error reported once`);
}

// Table-form block: rows of [key, value]; a value may be an El (e.g. an auto-linked URL).
function buildTable(rows) {
  const block = new El('div');
  block.classList.add('embed');
  rows.forEach(([key, value]) => {
    const row = new El('div');
    const keyCell = new El('div');
    keyCell.textContent = key;
    const valueCell = new El('div');
    if (value instanceof El) valueCell.append(value);
    else valueCell.textContent = value;
    row.append(keyCell, valueCell);
    block.append(row);
  });
  return block;
}

test('missing URL: empty Embed is rejected, not resolved to /drafts/undefined', () => {
  const block = new El('div');
  block.classList.add('embed');
  assertRejected(block, 'empty block');
});

test('malformed / relative / non-http(s) URLs are rejected (no same-site iframe)', () => {
  ['not a url', 'vimeo.com/123', '/drafts/embed-qa', '', 'javascript:alert(1)', 'ftp://vimeo.com/1']
    .forEach((href) => assertRejected(buildEmbed(href), JSON.stringify(href)));
});

test('provider URL without a media id is rejected (no empty /embed/ player)', () => {
  ['https://www.youtube.com/@skoda', 'https://vimeo.com/skoda']
    .forEach((href) => assertRejected(buildEmbed(href), href));
});

test('table form with a non-URL url cell is rejected', () => {
  assertRejected(buildTable([['url', 'see the video below'], ['ratio', '4x3']]), 'table');
});

// --- iframe titles (PR #109 review) ------------------------------------------

test('bare-URL autoblock: iframe title is a provider label, never the URL string', () => {
  [
    ['https://www.youtube.com/watch?v=9LfK-A20pgw', 'YouTube video'],
    ['https://vimeo.com/1003242587', 'Vimeo video'],
    ['https://www.buzzsprout.com/1730804/episodes/19710108-x?iframe=true', 'Buzzsprout podcast episode'],
    ['https://open.spotify.com/show/4ywat2rxDqNidxx7FQxXGb', 'Spotify podcast'],
    ['https://open.spotify.com/episode/abc123', 'Spotify podcast episode'],
  ].forEach(([href, label]) => {
    const block = buildEmbed(href); // link text === href (the autoblock case)
    decorate(block);
    const iframe = block.querySelector('.embed-play') ? play(block) : block.querySelector('iframe');
    assert.equal(iframe.getAttribute('title'), label, href);
  });
});

test('URL-valued title attribute (set by decorateButtons) is ignored in favour of the label', () => {
  const href = 'https://vimeo.com/1003242587';
  const block = buildEmbed(href);
  block.querySelector('a').setAttribute('title', href); // scripts.js: a.title = a.textContent
  decorate(block);
  assert.equal(block.querySelector('iframe').getAttribute('title'), 'Vimeo video');
});

test('descriptive link text is used as the iframe title', () => {
  const block = new El('div');
  block.classList.add('embed');
  const a = new El('a');
  a.setAttribute('href', 'https://www.youtube.com/watch?v=9LfK-A20pgw');
  a.textContent = 'The all-new Škoda Kodiaq RS';
  block.append(a);
  decorate(block);
  assert.equal(play(block).getAttribute('title'), 'The all-new Škoda Kodiaq RS');
});

test('table form: auto-linked url cell still honours ratio + title rows', () => {
  const link = new El('a');
  link.setAttribute('href', 'https://vimeo.com/1003242587');
  link.textContent = 'https://vimeo.com/1003242587';
  const block = buildTable([['url', link], ['ratio', '4x3'], ['title', 'Škoda Superb Sportline']]);
  decorate(block);
  assert.equal(block.querySelector('.embed-video').style['--embed-ratio'], '4 / 3');
  assert.equal(block.querySelector('iframe').getAttribute('title'), 'Škoda Superb Sportline');
});

test('table form: plain-text url cell works (no link)', () => {
  const block = buildTable([['url', 'https://youtu.be/atipTWwYw5E']]);
  decorate(block);
  const iframe = play(block);
  assert.equal(iframe.getAttribute('src'), 'https://www.youtube.com/embed/atipTWwYw5E?feature=oembed&enablejsapi=1&autoplay=1&playsinline=1');
  assert.equal(iframe.getAttribute('title'), 'YouTube video');
});

// --- self-hosted video file (SKODA-801a: WordPress [video] shortcode) ---------

test('self-hosted .mp4 renders a native <video> with the poster row, no iframe', () => {
  const link = new El('a');
  link.setAttribute('href', 'https://cdn.skoda-storyboard.com/2026/02/hero_16-9.mp4');
  link.textContent = 'https://cdn.skoda-storyboard.com/2026/02/hero_16-9.mp4';
  const img = new El('img');
  img.setAttribute('src', './media_1234.jpg?width=750');
  const block = buildTable([['url', link], ['poster', img]]);
  decorate(block);
  assert.equal(block.querySelector('iframe'), null);
  const video = block.querySelector('video');
  assert.ok(video, 'video element');
  assert.equal(video.getAttribute('controls'), '');
  assert.equal(video.getAttribute('preload'), 'metadata');
  assert.equal(video.getAttribute('poster'), './media_1234.jpg?width=750');
  assert.equal(video.getAttribute('aria-label'), 'Video');
  const source = block.querySelector('source');
  assert.equal(source.getAttribute('src'), 'https://cdn.skoda-storyboard.com/2026/02/hero_16-9.mp4');
  assert.equal(source.getAttribute('type'), 'video/mp4');
  assert.ok(block.classList.contains('embed-file'));
  assert.equal(block.querySelector('.embed-video').style['--embed-ratio'], '16 / 9');
});

test('self-hosted .webm: poster as a plain URL cell, title row as the accessible name', () => {
  const block = buildTable([
    ['url', 'https://cdn.example.com/v/clip.webm'],
    ['poster', 'https://cdn.example.com/v/clip.jpg'],
    ['title', 'Škoda x AirConsole'],
  ]);
  decorate(block);
  const video = block.querySelector('video');
  assert.equal(video.getAttribute('poster'), 'https://cdn.example.com/v/clip.jpg');
  assert.equal(video.getAttribute('aria-label'), 'Škoda x AirConsole');
  assert.equal(block.querySelector('source').getAttribute('type'), 'video/webm');
});

test('self-hosted video without a poster row has no poster attribute', () => {
  const block = buildEmbed('https://cdn.example.com/v/clip.mp4');
  decorate(block);
  assert.equal(block.querySelector('video').getAttribute('poster'), null);
});

// --- SKODA-204a: consent gate ----------------------------------------------
const consent = await import('../../scripts/embed-consent.js');

const withSearch = async (search, fn) => {
  const prev = window.location.search;
  window.location.search = search;
  try { await fn(); } finally { window.location.search = prev; }
};

// Gated blocks stay subscribed to consent changes; detach + notify so a test's placeholders
// unsubscribe instead of reacting to later tests.
const retire = (...blocks) => {
  blocks.forEach((b) => b.querySelectorAll('.embed-gated').forEach((w) => { w.isConnected = false; }));
  consent.setEmbedConsent(null);
};

test('embed consent: granted by default (M1 stub), ?consent= switch wins over the hook', async () => {
  consent.setEmbedConsent(null);
  assert.equal(consent.hasEmbedConsent(), true, 'default: granted');
  await withSearch('?consent=decline', () => assert.equal(consent.hasEmbedConsent(), false));
  await withSearch('?consent=accept', () => assert.equal(consent.hasEmbedConsent(), true));
  consent.setEmbedConsent(false);
  assert.equal(consent.hasEmbedConsent(), false, 'hook: boolean');
  await withSearch('?consent=accept', () => assert.equal(consent.hasEmbedConsent(), true, 'query wins'));
  consent.setEmbedConsent(() => false);
  assert.equal(consent.hasEmbedConsent(), false, 'hook: function');
  consent.setEmbedConsent(null);
});

test('embed consent: consentFromQuery is the shared ?consent= parser (null when absent)', () => {
  assert.equal(consent.consentFromQuery(''), null);
  assert.equal(consent.consentFromQuery('?consent=decline'), false);
  assert.equal(consent.consentFromQuery('?consent=YES'), true);
  assert.equal(consent.consentFromQuery('?utm_source=x'), null);
});

test('embed consent: setEmbedConsent notifies subscribers with the resulting state', () => {
  const seen = [];
  const off = consent.onEmbedConsentChange((c) => seen.push(c));
  consent.setEmbedConsent(false);
  consent.setEmbedConsent(true);
  off();
  consent.setEmbedConsent(false);
  assert.deepEqual(seen, [false, true], 'unsubscribe stops notifications');
  consent.setEmbedConsent(null);
});

test('with consent (default): same markup as before 204a, no placeholders fetch', () => {
  const fetches = globalThis.__fetches;
  const block = buildEmbed('https://vimeo.com/1221703335');
  decorate(block);
  assert.equal(block.className, 'embed embed-vimeo');
  assert.equal(block.children.length, 1);
  const wrapper = block.children[0];
  assert.equal(wrapper.className, 'embed-video');
  assert.equal(wrapper.children.length, 1);
  const iframe = wrapper.children[0];
  assert.deepEqual(Object.keys(iframe.attributes).sort(), ['allow', 'frameborder', 'loading', 'src', 'title']);
  assert.equal(iframe.getAttribute('src'), 'https://player.vimeo.com/video/1221703335?dnt=1');
  assert.equal(block.querySelector('.embed-consent'), null);
  const youtube = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw');
  decorate(youtube); // the poster path doesn't load the sheet either
  assert.equal(globalThis.__fetches, fetches, 'the consented path loads no placeholder sheet');
});

[
  ['https://www.youtube.com/watch?v=9LfK-A20pgw', 'www.youtube.com'],
  ['https://vimeo.com/1221703335', 'player.vimeo.com'],
  ['https://www.buzzsprout.com/1730804/episodes/123', 'www.buzzsprout.com'],
  ['https://open.spotify.com/episode/abc', 'open.spotify.com'],
].forEach(([href, host]) => {
  test(`no consent (${host}): no iframe in the DOM, labelled placeholder naming the host`, async () => {
    await withSearch('?consent=decline', async () => {
      const block = buildEmbed(href);
      decorate(block);
      assert.equal(block.querySelector('iframe'), null, 'iframe held back: nothing can reach the provider');
      assert.ok(block.querySelector('.embed-gated'), 'gated class set synchronously (final size from frame 1)');
      const text = block.querySelector('.embed-consent-text');
      assert.match(text.textContent, new RegExp(`third party \\(${host.replace(/\./g, '\\.')}\\)`));
      const button = block.querySelector('button');
      assert.equal(button.getAttribute('type'), 'button');
      assert.equal(button.textContent, 'I acknowledge and confirm', 'accessible name = visible label');
      assert.equal(button.getAttribute('aria-describedby'), text.id, 'the host text describes the button');
      assert.ok(text.id);
      retire(block);
    });
  });
});

test('no consent: activating the placeholder loads that one embed and focuses it', async () => {
  await withSearch('?consent=decline', async () => {
    const block = buildEmbed('https://vimeo.com/1221703335', { title: 'Octavia film' });
    const other = buildEmbed('https://www.buzzsprout.com/1730804/episodes/123');
    decorate(block);
    decorate(other);
    block.querySelector('button').dispatch('click');
    assert.equal(block.querySelector('.embed-consent'), null, 'placeholder removed');
    const iframe = block.querySelector('iframe');
    assert.ok(iframe.getAttribute('src').startsWith('https://player.vimeo.com/video/1221703335?'));
    assert.equal(iframe.dataset.src, undefined);
    assert.equal(iframe.getAttribute('title'), 'Octavia film');
    assert.equal(globalThis.__focused, iframe, 'focus moves to the iframe');
    assert.equal(block.querySelector('.embed-video').classList.contains('embed-gated'), false);
    assert.ok(other.querySelector('.embed-consent'), 'the other embed stays gated');
    assert.equal(other.querySelector('iframe'), null);
    retire(other);
  });
});

test('no consent, then consent granted through the hook: waiting embeds load; focus kept', async () => {
  await withSearch('?consent=decline', async () => {
    const block = buildEmbed('https://vimeo.com/1221703335');
    decorate(block);
    block.querySelector('button').focus(); // a keyboard user is on the placeholder button
    window.location.search = ''; // the CMP now decides
    consent.setEmbedConsent(true);
    const iframe = block.querySelector('iframe');
    assert.ok(iframe, 'iframe back in the DOM');
    assert.equal(iframe.getAttribute('src'), 'https://player.vimeo.com/video/1221703335?dnt=1');
    assert.equal(block.querySelector('.embed-consent'), null);
    assert.equal(globalThis.__focused, iframe, 'focus moves from the removed button to the iframe');
    consent.setEmbedConsent(null);
  });
});

test('no consent, YouTube: one click on the placeholder loads and plays the video', async () => {
  await withSearch('?consent=decline', async () => {
    const block = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw');
    decorate(block);
    assert.equal(block.querySelector('.embed-play'), null, 'no poster either: nothing reaches YouTube');
    assert.equal(block.querySelector('img'), null);
    block.querySelector('button').dispatch('click');
    const iframe = block.querySelector('iframe');
    assert.equal(iframe.getAttribute('src'), 'https://www.youtube.com/embed/9LfK-A20pgw?feature=oembed&enablejsapi=1&autoplay=1&playsinline=1');
    assert.equal(block.querySelector('.embed-play'), null, 'consent then play would be two clicks');
    assert.equal(globalThis.__focused, iframe);
  });
});

test('consent withdrawn after the poster showed: the click shows the placeholder, loads nothing', async () => {
  const block = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw');
  decorate(block); // consented: the poster
  await withSearch('?consent=decline', async () => {
    block.querySelector('.embed-play').dispatch('click');
    assert.equal(block.querySelector('iframe'), null, 'nothing reaches YouTube');
    assert.equal(block.querySelector('.embed-play'), null);
    const gateButton = block.querySelector('.embed-consent-button');
    assert.ok(gateButton, 'the consent placeholder instead');
    assert.equal(globalThis.__focused, gateButton, 'keyboard focus lands on its button');
    gateButton.dispatch('click'); // acknowledging plays at once
    assert.ok(block.querySelector('iframe').getAttribute('src').includes('autoplay=1'));
  });
});

test('no consent, YouTube, then a grant through the hook: the poster shows, focus on its button', async () => {
  await withSearch('?consent=decline', async () => {
    const block = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw');
    decorate(block);
    block.querySelector('button').focus();
    window.location.search = '';
    consent.setEmbedConsent(true);
    assert.equal(block.querySelector('iframe'), null, 'not asked to play: the poster, not the player');
    const poster = block.querySelector('.embed-play');
    assert.ok(poster);
    assert.equal(globalThis.__focused, poster, 'focus moves from the removed button to the poster');
    assert.ok(play(block).getAttribute('src').includes('autoplay=1'));
    consent.setEmbedConsent(null);
  });
});

test('no consent: a detached placeholder stops listening and is not released', async () => {
  await withSearch('?consent=decline', async () => {
    const block = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw');
    decorate(block);
    block.querySelector('.embed-gated').isConnected = false; // e.g. a re-rendered fragment
    window.location.search = '';
    consent.setEmbedConsent(true);
    assert.equal(block.querySelector('iframe'), null, 'no iframe appended into a detached block');
    consent.setEmbedConsent(null);
  });
});
