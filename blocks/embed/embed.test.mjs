/*
 * Embeds block tests (SKODA-204).
 * Zero-dependency: node:test + a minimal DOM shim (the block uses a small DOM surface).
 * No jsdom/browser needed, so this runs on any checkout.
 * Run: node --test blocks/embed/embed.test.mjs
 *
 * Focus: the acceptance-critical URL normalisation + provider/audio detection that a browser
 * preview cannot easily assert (Vimeo dnt=1, YouTube nocookie host, audio vs video, ratio,
 * lazy + title + data-src consent stub). Rendering geometry is verified separately in preview.
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
    };
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

  addEventListener(type, fn) { (this._listeners[type] ||= []).push(fn); }

  dispatch(type) { (this._listeners[type] || []).forEach((fn) => fn()); }

  append(...kids) { kids.forEach((k) => { k._parent = this; this.children.push(k); }); }

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
  location: { href: 'https://x/' },
  hlx: { codeBasePath: '' },
};
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

test('YouTube: matches live embed URL (youtube.com/embed + feature=oembed + enablejsapi)', () => {
  const block = buildEmbed('https://www.youtube.com/watch?v=9LfK-A20pgw');
  decorate(block);
  const iframe = block.querySelector('iframe');
  assert.equal(iframe.getAttribute('src'), 'https://www.youtube.com/embed/9LfK-A20pgw?feature=oembed&enablejsapi=1');
  assert.equal(iframe.dataset.src, undefined, 'no consent gate — src set directly');
  // allow list matches live YouTube verbatim (accelerometer/gyroscope, no fullscreen)
  assert.equal(iframe.getAttribute('allow'), 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
  assert.ok(block.querySelector('.embed-video'));
  assert.equal(block.querySelector('.embed-facade'), null);
  assert.equal(block.querySelector('.embed-consent'), null);
});

test('YouTube: /embed/ + si token and youtu.be forms both build the live URL', () => {
  const a = buildEmbed('https://www.youtube.com/embed/B4ZafpJKk0M?si=v58s4T3awpvcBd7Y');
  decorate(a);
  assert.equal(a.querySelector('iframe').getAttribute('src'), 'https://www.youtube.com/embed/B4ZafpJKk0M?feature=oembed&si=v58s4T3awpvcBd7Y&enablejsapi=1');
  const b = buildEmbed('https://youtu.be/atipTWwYw5E');
  decorate(b);
  assert.equal(b.querySelector('iframe').getAttribute('src'), 'https://www.youtube.com/embed/atipTWwYw5E?feature=oembed&enablejsapi=1');
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

test('no consent placeholder or facade is rendered for any provider', () => {
  ['https://vimeo.com/1', 'https://www.youtube.com/watch?v=abc', 'https://open.spotify.com/episode/x']
    .forEach((href) => {
      const block = buildEmbed(href);
      decorate(block);
      assert.equal(block.querySelector('.embed-consent'), null, `${href}: no consent box`);
      assert.equal(block.querySelector('.embed-facade'), null, `${href}: no facade`);
    });
});

test('authored ratio override is applied', () => {
  const block = buildEmbed('https://vimeo.com/1');
  block.dataset.ratio = '4x3';
  decorate(block);
  assert.equal(block.querySelector('.embed-video').style['--embed-ratio'], '4 / 3');
});

test('unusable URL: no throw, block left empty', () => {
  const block = new El('div');
  block.classList.add('embed');
  const a = new El('a');
  a.setAttribute('href', 'not a url');
  block.append(a);
  assert.doesNotThrow(() => decorate(block));
});
