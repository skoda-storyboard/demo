/*
 * Split article body (SKODA-824): spanSidebar() counts the body-column run a highlight panel
 * splits, so the story and press-release grids can span the sidebar over every part. Pins the
 * counts for the shapes the importers emit, and that pages without a split stay untouched.
 * jsdom has no layout: the geometry is measured in the browser (docs/ui-specs/highlight.md),
 * and the CSS guards below pin the rules that consume the counts.
 * Run: node --test scripts/split-body.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import { spanSidebar } from './split-body.js';

const { document } = new JSDOM('<!DOCTYPE html><main></main>').window;

/** A decorated main: one `.section` per class list ('' = no style). */
function main(...sections) {
  const el = document.createElement('main');
  sections.forEach((classes) => {
    const section = document.createElement('div');
    section.className = `section ${classes}`.trim();
    el.append(section);
  });
  return el;
}

const vars = (el) => ['--body-row-start', '--body-rows', '--body-rows-before-last']
  .map((name) => el.style.getPropertyValue(name));

test('story split by one panel: the sidebar spans the three parts from row 2', () => {
  const el = main('hero-image-container', 'body-column', 'body-column highlight-dark', 'body-column', 'sidebar', 'dark');
  spanSidebar(el);
  assert.deepEqual(vars(el), ['2', '3', '3']);
});

test('joined panels and a trailing panel count as body parts', () => {
  const el = main('', 'body-column', 'body-column highlight-dark', 'body-column highlight-dark', 'sidebar', 'dark');
  spanSidebar(el);
  assert.deepEqual(vars(el), ['2', '3', '3']);
});

test('a leading panel starts the run', () => {
  const el = main('', 'body-column highlight-dark', 'body-column', 'sidebar');
  spanSidebar(el);
  assert.deepEqual(vars(el), ['2', '2', '2']);
});

test('press release: header, body, grey callout, sidebar, bands', () => {
  const el = main('', 'body-column', 'body-column highlight-grey', 'sidebar', 'dark full-width media-box', 'dark full-width related');
  spanSidebar(el);
  assert.deepEqual(vars(el), ['2', '2', '2']);
});

test('a single body section, no sidebar, or no body leave main untouched', () => {
  [
    main('', 'body-column', 'sidebar', 'dark'),
    main('', 'body-column', 'body-column highlight-dark'),
    main('', 'sidebar'),
    main(),
  ].forEach((el) => {
    spanSidebar(el);
    assert.equal(el.getAttribute('style'), null);
  });
});

test('only the first contiguous run counts, and the sidebar must close it', () => {
  const el = main('', 'body-column', 'body-column highlight-dark', 'dark', 'body-column', 'sidebar');
  spanSidebar(el);
  assert.equal(el.getAttribute('style'), null, 'a full-width section breaks the run');
});

// --- CSS guards: the rules that consume the counts and draw the panel ----------------------
const styles = await readFile(new URL('../styles/styles.css', import.meta.url), 'utf8');
const pressRelease = await readFile(new URL('../templates/press-release/press-release.css', import.meta.url), 'utf8');

test('both grids span the sidebar from the counts and give the slack to the last part', () => {
  [['body.story', styles], ['body.press-release', pressRelease]].forEach(([scope, css]) => {
    const wide = css.slice(css.indexOf('@media (width >= 768px) {'));
    const rule = (selector) => wide.match(new RegExp(`\\n  ${selector.replace(/[.>]/g, '\\$&')} \\{([^}]+)\\}`))?.[1] || '';
    assert.match(rule(`${scope} main`), /grid-template-rows: repeat\(var\(--body-rows-before-last\), auto\) 1fr;/, scope);
    assert.match(rule(`${scope} main > .section.sidebar`), /grid-row: var\(--body-row-start\) \/ span var\(--body-rows\);/, scope);
  });
});

test('the story panel is the body track plus the inset, and joined panels drop the gap', () => {
  const wide = styles.slice(styles.indexOf('@media (width >= 768px) {'));
  assert.match(wide, /\.section\.body-column:is\(\.highlight-dark, \.highlight-grey\) \{\s+margin-inline-end: calc\(-1 \* var\(--story-inset\)\);/);
  assert.match(styles, /\.section\.highlight-dark:has\(\+ \.section\.highlight-dark\),\s+body\.story main > \.section\.highlight-grey:has\(\+ \.section\.highlight-grey\) \{\s+padding-block-end: 0;/);
  assert.match(styles, /@media \(width >= 781px\) \{\s+body\.story \{\s+--highlight-widget-block: 0px;/);
});
