/*
 * Minimal zero-dependency DOM for node:test block tests (no jsdom in this repo).
 * Covers what footer + newsletter-stub touch: element tree ops (append/remove/replaceWith/
 * replaceChildren, textContent, children, firstElementChild), attributes / classList / dataset,
 * events (addEventListener/dispatchEvent) and a small selector engine (tag, .class, [attr],
 * :scope, :empty, descendant + child combinators, comma lists). Plus parseHTML() for fixtures.
 * `test/*` is in .hlxignore, so this helper is never served.
 */
/* eslint-disable max-classes-per-file, no-use-before-define */

const VOID = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'source']);

class Node {
  constructor() {
    this.parentNode = null;
    this.childNodes = [];
  }

  remove() {
    if (!this.parentNode) return;
    const siblings = this.parentNode.childNodes;
    siblings.splice(siblings.indexOf(this), 1);
    this.parentNode = null;
  }

  replaceWith(...nodes) {
    const parent = this.parentNode;
    if (!parent) return;
    const idx = parent.childNodes.indexOf(this);
    nodes.forEach((n) => n.remove());
    this.remove();
    parent.childNodes.splice(idx, 0, ...nodes);
    nodes.forEach((n) => { n.parentNode = parent; });
  }
}

export class Text extends Node {
  constructor(data) {
    super();
    this.nodeType = 3;
    this.data = data;
  }

  get textContent() { return this.data; }

  set textContent(v) { this.data = String(v); }
}

export class Element extends Node {
  constructor(tag) {
    super();
    this.nodeType = 1;
    this.tagName = tag.toUpperCase();
    this.attrs = new Map();
    this.listeners = {};
  }

  // --- attributes -------------------------------------------------------
  setAttribute(k, v) { this.attrs.set(k, String(v)); }

  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }

  hasAttribute(k) { return this.attrs.has(k); }

  removeAttribute(k) { this.attrs.delete(k); }

  get id() { return this.getAttribute('id') || ''; }

  set id(v) { this.setAttribute('id', v); }

  get className() { return this.getAttribute('class') || ''; }

  set className(v) { this.setAttribute('class', v); }

  get classList() {
    const list = () => this.className.split(/\s+/).filter(Boolean);
    return {
      add: (...cs) => { this.className = [...new Set([...list(), ...cs])].join(' '); },
      remove: (...cs) => { this.className = list().filter((c) => !cs.includes(c)).join(' '); },
      contains: (c) => list().includes(c),
      [Symbol.iterator]: () => list()[Symbol.iterator](),
    };
  }

  get dataset() {
    const el = this;
    const attr = (k) => `data-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
    return new Proxy({}, {
      get: (_, k) => el.getAttribute(attr(k)) ?? undefined,
      set: (_, k, v) => { el.setAttribute(attr(k), v); return true; },
    });
  }

  get href() { return this.getAttribute('href') || ''; }

  get title() { return this.getAttribute('title') || ''; }

  set title(v) { this.setAttribute('title', v); }

  // form-ish properties used by the blocks
  get value() { return this.getAttribute('value') || ''; }

  set value(v) { this.setAttribute('value', v); }

  // --- tree -------------------------------------------------------------
  get children() { return this.childNodes.filter((n) => n.nodeType === 1); }

  get firstElementChild() { return this.children[0] || null; }

  get textContent() { return this.childNodes.map((n) => n.textContent).join(''); }

  set textContent(v) {
    this.childNodes.forEach((n) => { n.parentNode = null; });
    this.childNodes = [];
    if (v !== '') this.append(new Text(String(v)));
  }

  append(...nodes) {
    nodes.forEach((n) => {
      const node = typeof n === 'string' ? new Text(n) : n;
      node.remove();
      node.parentNode = this;
      this.childNodes.push(node);
    });
  }

  replaceChildren(...nodes) {
    this.textContent = '';
    this.append(...nodes);
  }

  closest(sel) {
    let n = this;
    while (n && n.nodeType === 1) {
      if (matches(n, sel, null)) return n;
      n = n.parentNode;
    }
    return null;
  }

  querySelectorAll(sel) {
    const out = [];
    const walk = (node) => node.children.forEach((c) => {
      if (matches(c, sel, this)) out.push(c);
      walk(c);
    });
    walk(this);
    return out;
  }

  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }

  // --- events -----------------------------------------------------------
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }

  dispatchEvent(event) {
    let n = this;
    while (n) {
      (n.listeners?.[event.type] || []).forEach((fn) => fn.call(n, event));
      if (!event.bubbles) break;
      n = n.parentNode;
    }
    return !event.defaultPrevented;
  }
}

export class Event {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = !!init.bubbles;
    this.defaultPrevented = false;
  }

  preventDefault() { this.defaultPrevented = true; }
}

export class CustomEvent extends Event {
  constructor(type, init = {}) {
    super(type, init);
    this.detail = init.detail;
  }
}

// --- selector engine (subset) ---------------------------------------------
function matchCompound(el, compound, scope) {
  if (compound === '') return true;
  const re = /(:scope|:empty|\.[\w-]+|\[[^\]]+\]|[\w-]+)/g;
  const parts = compound.match(re) || [];
  if (parts.join('') !== compound) throw new Error(`unsupported selector: ${compound}`);
  return parts.every((p) => {
    if (p === ':scope') return el === scope;
    if (p === ':empty') return el.childNodes.length === 0;
    if (p.startsWith('.')) return el.classList.contains(p.slice(1));
    if (p.startsWith('[')) {
      const [k, v] = p.slice(1, -1).split('=');
      return v === undefined ? el.hasAttribute(k) : el.getAttribute(k) === v.replace(/["']/g, '');
    }
    return el.tagName === p.toUpperCase();
  });
}

function matchComplex(el, tokens, scope) {
  // tokens: [compound, combinator, compound, ...] matched right-to-left
  const last = tokens[tokens.length - 1];
  if (!matchCompound(el, last, scope)) return false;
  if (tokens.length === 1) return true;
  const comb = tokens[tokens.length - 2];
  const rest = tokens.slice(0, -2);
  if (comb === '>') {
    return !!el.parentNode && el.parentNode.nodeType === 1 && matchComplex(el.parentNode, rest, scope);
  }
  let n = el.parentNode;
  while (n && n.nodeType === 1) {
    if (matchComplex(n, rest, scope)) return true;
    n = n.parentNode;
  }
  return false;
}

function matches(el, sel, scope) {
  return sel.split(',').some((s) => {
    // → [compound, combinator, compound, …] with ' ' (descendant) or '>' (child)
    const tokens = [];
    s.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/).forEach((t) => {
      if (t === '>') tokens.push('>');
      else {
        if (tokens.length && tokens[tokens.length - 1] !== '>') tokens.push(' ');
        tokens.push(t);
      }
    });
    return matchComplex(el, tokens, scope);
  });
}

// --- tiny HTML parser for well-formed fixtures -------------------------------
export function parseHTML(html) {
  const root = new Element('div');
  const stack = [root];
  const re = /<\/([\w-]+)\s*>|<([\w-]+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/?>|([^<]+)/g;
  let m = re.exec(html);
  while (m) {
    const top = stack[stack.length - 1];
    if (m[1]) {
      stack.pop();
    } else if (m[2]) {
      const el = new Element(m[2]);
      (m[3].match(/[\w-]+(?:="[^"]*")?/g) || []).forEach((a) => {
        const [k, ...v] = a.split('=');
        el.setAttribute(k, v.length ? v.join('=').slice(1, -1) : '');
      });
      top.append(el);
      if (!VOID.has(m[2].toLowerCase())) stack.push(el);
    } else if (m[4].trim()) {
      // whitespace-only runs between tags are dropped (fixtures are indented for reading)
      top.append(new Text(m[4].replace(/&amp;/g, '&')));
    }
    m = re.exec(html);
  }
  return root;
}

/** Installs a global document/CustomEvent backed by this mini DOM. */
export function installDom() {
  globalThis.document = { createElement: (t) => new Element(t) };
  globalThis.CustomEvent = CustomEvent;
  globalThis.Event = Event;
  return globalThis.document;
}
