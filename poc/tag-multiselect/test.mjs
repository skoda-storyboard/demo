/*
 * test.mjs — dependency-free smoke test for the tag-picker's output contract.
 *
 * Runs with the built-in node runner (no framework): `node --test poc/` (see the demo
 * package.json `test` script). It pins the emitted Tags-block markup the plugin sends
 * into the document via DA_SDK.actions.sendHTML(), which is the SKODA-211 acceptance
 * criterion "emitted Tags-block HTML matches the expected markup for a given selection".
 * The href shape (/en/tag/<taxonomy>/<slug>/) matches docs/ui-specs/tags.md (SKODA-205).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import FALLBACK_TAGS from './fallback-tags.js';
import { buildTagsBlockHTML } from './tags-block.js';

test('emits the expected Tags block for a multi-tag selection', () => {
  const html = buildTagsBlockHTML([
    { taxonomy: 'model', slug: 'epiq', label: 'Epiq' },
    { taxonomy: 'years', slug: '2026', label: '2026' },
  ]);
  assert.equal(
    html,
    '<table><tbody><tr><th>Tags</th></tr><tr>'
    + '<td><a href="/en/tag/model/epiq/">Epiq</a></td>'
    + '<td><a href="/en/tag/years/2026/">2026</a></td>'
    + '</tr></tbody></table>',
  );
});

test('every fallback tag produces a spec /en/tag/<taxonomy>/<slug>/ anchor with its label', () => {
  FALLBACK_TAGS.forEach(({ taxonomy, slug, label }) => {
    const html = buildTagsBlockHTML([{ taxonomy, slug, label }]);
    assert.ok(
      html.includes(`<td><a href="/en/tag/${taxonomy}/${slug}/">${label}</a></td>`),
      `missing anchor for ${taxonomy}/${slug}`,
    );
  });
});

test('an empty selection yields an empty tag row', () => {
  assert.equal(
    buildTagsBlockHTML([]),
    '<table><tbody><tr><th>Tags</th></tr><tr></tr></tbody></table>',
  );
});
