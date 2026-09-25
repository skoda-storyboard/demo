/*
 * Unit tests for the SKODA-602 push helpers (pure; no network, no fs).
 * Run: node --test tools/importer/push/push-lib.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pagePath, parseList, wrapPage, hashOf, mainContent, contentHash, decideAction, PUSHING, chunk,
  parseJobDetails,
  fragmentPaths, imageCheck, summarize,
} from './push-lib.mjs';

// ---- paths + lists ----------------------------------------------------------

test('pagePath maps source URLs and paths to EDS page paths', () => {
  assert.equal(pagePath('https://www.skoda-storyboard.com/en/emobility/foo/'), '/en/emobility/foo');
  assert.equal(pagePath('/en/emobility/foo'), '/en/emobility/foo');
  assert.equal(pagePath('/en/emobility/foo.plain.html'), '/en/emobility/foo');
  assert.equal(pagePath('https://www.skoda-storyboard.com/'), '/index');
  assert.equal(pagePath(''), '');
});

test('parseList skips comments/blanks, ignores inline notes, de-duplicates in order', () => {
  const list = parseList([
    '# header comment',
    '',
    'https://www.skoda-storyboard.com/en/a/',
    'https://www.skoda-storyboard.com/en/b/   # ALIAS of /en/a/',
    '/en/a',
    '  https://www.skoda-storyboard.com/en/c/  ',
  ].join('\n'));
  assert.deepEqual(list, ['/en/a', '/en/b', '/en/c']);
});

// ---- document shape + hashing -------------------------------------------------

test('wrapPage produces the DA document shape (body > header + main + footer)', () => {
  assert.equal(
    wrapPage('  <div><p>x</p></div>\n'),
    '<body><header></header><main><div><p>x</p></div></main><footer></footer></body>',
  );
});

test('contentHash ignores wrapper whitespace (no false conflict), not content changes', () => {
  // the two shapes seen in DA on 2026-09-25 for the same import
  const compact = '<body><header></header><main><div><p>21. 9. 2026</p></div></main><footer></footer></body>';
  const spaced = '<body>\n<header></header>\n<main>\n<div><p>21. 9. 2026</p></div>\n</main>\n<footer></footer>\n</body>';
  assert.equal(mainContent(spaced), '<div><p>21. 9. 2026</p></div>');
  assert.equal(contentHash(compact), contentHash(spaced));
  assert.notEqual(contentHash(compact), contentHash(compact.replace('21. 9.', '22. 9.')));
  assert.equal(contentHash(wrapPage('<div>x</div>')), contentHash('<div>x</div>'), 'no <main>: whole doc, trimmed');
});

test('hashOf is stable and content-sensitive', () => {
  assert.equal(hashOf('a'), hashOf('a'));
  assert.notEqual(hashOf('a'), hashOf('b'));
  assert.match(hashOf('a'), /^[0-9a-f]{64}$/);
});

// ---- overwrite protection -------------------------------------------------------

test('decideAction: DA has no document → new', () => {
  assert.equal(decideAction({ localHash: 'L', remoteHash: null }).action, 'new');
});

test('decideAction: DA equals local → unchanged (with or without a record)', () => {
  assert.equal(decideAction({ localHash: 'L', remoteHash: 'L' }).action, 'unchanged');
  assert.equal(decideAction({ localHash: 'L', remoteHash: 'L', record: { hash: 'OLD' } }).action, 'unchanged');
});

test('decideAction: local changed and DA still equals our last push → update', () => {
  assert.equal(decideAction({ localHash: 'NEW', remoteHash: 'OLD', record: { hash: 'OLD' } }).action, 'update');
});

test('decideAction: DA edited since our last push → conflict (never overwritten silently)', () => {
  const d = decideAction({ localHash: 'NEW', remoteHash: 'AUTHOR', record: { hash: 'OLD' } });
  assert.equal(d.action, 'conflict');
  assert.match(d.reason, /changed since our last push/);
  assert.equal(PUSHING.has(d.action), false);
});

test('decideAction: DA holds a document we never pushed → conflict', () => {
  const d = decideAction({ localHash: 'NEW', remoteHash: 'UNKNOWN' });
  assert.equal(d.action, 'conflict');
  assert.match(d.reason, /no push record/);
});

test('decideAction: --force turns a conflict into an overwrite (and only then)', () => {
  const d = decideAction({
    localHash: 'NEW', remoteHash: 'AUTHOR', record: { hash: 'OLD' }, force: true,
  });
  assert.equal(d.action, 'overwrite');
  assert.equal(PUSHING.has(d.action), true);
  assert.equal(decideAction({ localHash: 'L', remoteHash: 'L', force: true }).action, 'unchanged');
});

test('PUSHING covers exactly the writing actions', () => {
  assert.deepEqual([...PUSHING].sort(), ['new', 'overwrite', 'update']);
});

// ---- bulk jobs -------------------------------------------------------------------

test('chunk splits into bounded batches', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 100), []);
  assert.deepEqual(chunk([1], 0), [[1]]);
});

test('parseJobDetails reads the live admin job-details shape (per-path status + error)', () => {
  // shape captured from a real preview job on 2026-09-25
  const details = {
    topic: 'preview',
    state: 'stopped',
    data: {
      phase: 'completed',
      resources: [
        { status: 200, path: '/en/emobility/epiq', resourcePath: '/en/emobility/epiq.md' },
        { status: 404, path: '/en/missing', error: "Unable to fetch '/en/missing.md' from 'html2md': (404)" },
      ],
    },
  };
  const out = parseJobDetails(details);
  assert.equal(out.done, true);
  assert.deepEqual(out.results['/en/emobility/epiq'], { status: 200 });
  assert.equal(out.results['/en/missing'].status, 404);
  assert.match(out.results['/en/missing'].error, /html2md/);
});

test('parseJobDetails: a running job is not done', () => {
  const out = parseJobDetails({ state: 'running', data: {} });
  assert.equal(out.done, false);
  assert.deepEqual(out.results, {});
});

// ---- shared fragments ---------------------------------------------------------------

test('fragmentPaths: defaults /nav + /footer, plus metadata overrides, de-duplicated', () => {
  const plain = '<div><div class="metadata"><div><div>Title</div><div>X</div></div>'
    + '<div><div>footer</div><div>/en/footer-mr</div></div><div><div>nav</div><div>/nav</div></div></div></div>';
  assert.deepEqual(fragmentPaths([plain, '<div><p>no metadata</p></div>']), ['/nav', '/footer', '/en/footer-mr']);
  assert.deepEqual(fragmentPaths([]), ['/nav', '/footer']);
});

// ---- post-preview content check --------------------------------------------------------

test('imageCheck: media-bus images pass, source-CDN images are flagged', () => {
  const ok = '<picture><img src="./media_1a2b3c.jpg?width=750" alt=""></picture>';
  const bad = '<img alt="" src="https://cdn.skoda-storyboard.com/2026/09/big.png">';
  assert.deepEqual(imageCheck(ok), { images: 1, selfHosted: 1, external: [] });
  const r = imageCheck(ok + bad);
  assert.equal(r.images, 2);
  assert.equal(r.selfHosted, 1);
  assert.deepEqual(r.external, ['https://cdn.skoda-storyboard.com/2026/09/big.png']);
});

test('summarize counts actions', () => {
  assert.deepEqual(
    summarize([{ action: 'new' }, { action: 'unchanged' }, { action: 'unchanged' }, { action: 'conflict' }]),
    { new: 1, unchanged: 2, conflict: 1 },
  );
});
