/*
 * Tags block tests (SKODA-205 + SKODA-401 metadata fallback).
 * Zero-dependency: node:test + a minimal DOM shim (the block uses only a small
 * DOM surface). No jsdom/browser needed, so this runs on any checkout.
 * Run: node --test blocks/tags/tags.test.mjs
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
    this.textContent = '';
    this._parent = null;
  }

  get classList() {
    const self = this;
    return {
      contains: (c) => self.className.split(/\s+/).includes(c),
      add: (c) => { if (!self.className.split(/\s+/).includes(c)) self.className = `${self.className} ${c}`.trim(); },
    };
  }

  set href(v) { this.attributes.href = v; }

  get href() { return this.attributes.href; }

  set title(v) { this.attributes.title = v; }

  setAttribute(k, v) { this.attributes[k] = v; }

  getAttribute(k) { return this.attributes[k] ?? null; }

  append(child) { child._parent = this; this.children.push(child); }

  replaceChildren(...kids) { this.children = kids; kids.forEach((k) => { k._parent = this; }); }

  closest(sel) {
    const want = sel.toUpperCase();
    let n = this;
    while (n) { if (n.tagName === want) return n; n = n._parent; }
    return null;
  }

  querySelectorAll(sel) {
    // supports only 'a' (all descendant anchors), sufficient for the block
    const out = [];
    const walk = (node) => node.children.forEach((c) => {
      if (sel === 'a' && c.tagName === 'A') out.push(c);
      walk(c);
    });
    walk(this);
    return out;
  }
}

// scripts/aem.js touches window; provide a minimal stub before import.
// (navigator already exists as a read-only global in Node 24 — don't reassign.)
globalThis.window = globalThis.window || {
  location: { href: 'https://x/', search: '', pathname: '/' },
  origin: 'https://x',
  hlx: { codeBasePath: '' },
};

function setup(articleTag = '') {
  const document = {
    createElement: (t) => new El(t),
  };
  globalThis.document = document;
  globalThis.window.document = document;
  // getMetadata reads globalThis.document.head; give it what article:tag needs.
  document.head = {
    querySelectorAll: (sel) => {
      // getMetadata('article:tag') → meta[property="article:tag"]
      if (!articleTag || !sel.includes('article:tag')) return [];
      // one meta per value (mirrors AEM), each with .content
      return articleTag.split('|').map((c) => ({ content: c }));
    },
  };
  return document;
}

// Build an authored block: rows→cells→anchors.
function buildBlock(document, cells) {
  const block = new El('div');
  const row = new El('div');
  cells.forEach(({ text, href }) => {
    const cell = new El('div');
    if (text !== undefined) {
      const a = new El(href ? 'a' : 'span');
      a.textContent = text;
      if (href) a.setAttribute('href', href);
      cell.append(a);
    }
    row.append(cell);
  });
  block.append(row);
  return block;
}

const { default: decorate } = await import('./tags.js');

test('authored tags render and win (no fallback)', () => {
  const document = setup('elroq|2026'); // metadata present but should be ignored
  const block = buildBlock(document, [
    { text: 'Epiq', href: '/en/tag/model/epiq/' },
    { text: '2026', href: '/en/tag/years/2026/' },
  ]);
  decorate(block);
  const ul = block.children[0];
  assert.equal(ul.className, 'tags-list');
  assert.equal(ul.children.length, 2);
  const labels = ul.children.map((li) => li.children[0].textContent);
  assert.deepEqual(labels, ['Epiq', '2026']);
  // authored → linked anchors, not the metadata fallback
  assert.equal(ul.children[0].children[0].tagName, 'A');
});

test('empty block falls back to article:tag metadata → N static pills', () => {
  const document = setup('elroq|2026'); // two article:tag metas
  const block = buildBlock(document, []); // no authored cells
  decorate(block);
  const ul = block.children[0];
  assert.equal(ul.children.length, 2);
  const labels = ul.children.map((li) => li.children[0].textContent);
  assert.deepEqual(labels, ['elroq', '2026']);
  // fallback tags are static labels (span), not links
  assert.equal(ul.children[0].children[0].tagName, 'SPAN');
});

test('empty block + no metadata → renders nothing, no error', () => {
  const document = setup(''); // no article:tag metas
  const block = buildBlock(document, []);
  decorate(block);
  const ul = block.children[0];
  assert.equal(ul.children.length, 0);
});

test('comma-joined single meta value splits into multiple pills', () => {
  // getMetadata joins multiple metas with ", "; a single meta may itself be
  // comma-separated. Simulate one meta whose content is "elroq, 2026".
  const document = setup('elroq, 2026');
  const block = buildBlock(document, []);
  decorate(block);
  const labels = block.children[0].children.map((li) => li.children[0].textContent);
  assert.deepEqual(labels, ['elroq', '2026']);
});
