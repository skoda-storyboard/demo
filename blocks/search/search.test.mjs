/*
 * search block (SKODA-1003): the result summary's %q / %d tokens.
 * Run: node --test blocks/search/search.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('search format: %q / %d in one pass, in any order; the query is literal text', async () => {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('', { url: 'https://x.test/cs/search' });
  globalThis.window ??= dom.window;
  globalThis.document ??= dom.window.document;
  const { format } = await import('./search.js');
  assert.equal(format('Výsledky pro „%q“: %d', { q: '%d', d: 3 }), 'Výsledky pro „%d“: 3');
  assert.equal(format('%d results for “%q”', { q: "$` $& $'", d: 3 }), "3 results for “$` $& $'”");
});
