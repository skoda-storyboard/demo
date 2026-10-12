/*
 * SKODA-842: the DA block library covers every block on main, every contract variant and every
 * contract section style. Run: node --test tools/library/library-check.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { covers, libraryProblems, repoInputs } from './library-check.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const base = () => ({
  blockDirs: ['cards', 'header'],
  contracts: { main: { cards: { variants: ['overlay'] }, header: { variants: [] } }, pending: [] },
  spec: { cards: { variants: [{ class: 'overlay', label: 'overlay', description: 'd' }] } },
  excluded: { header: 'loaded from /nav' },
  sectionStyles: [['dark, full-width', 'd']],
});

test('the repo library covers every block, variant and section style', async () => {
  assert.deepEqual(libraryProblems(await repoInputs(ROOT)), []);
});

test('covers: token subsets, multi-token variants and aliases', () => {
  const entry = { aliases: ['story'], variants: [{ class: 'overlay tiles' }, { class: 'chips outline' }] };
  assert.equal(covers(entry, []), true);
  assert.equal(covers(entry, ['story']), true);
  assert.equal(covers(entry, ['tiles', 'overlay']), true);
  assert.equal(covers(entry, ['outline']), true);
  assert.equal(covers(entry, ['media']), false);
  assert.equal(covers({}, ['media']), false);
});

test('a complete library has no problems', () => {
  assert.deepEqual(libraryProblems(base()), []);
});

test('a block on main without a library entry fails', () => {
  const input = base();
  input.blockDirs.push('quote');
  assert.deepEqual(libraryProblems(input), ['block "quote" has no library entry (add it to SPEC or EXCLUDED)']);
});

test('a contract variant without a library variant fails (main and pending)', () => {
  const input = base();
  input.contracts.main.cards.variants.push('media');
  input.contracts.pending.push({ id: 'cards-tiles', block: 'cards', variants: ['overlay', 'tiles'] });
  // a pending block without code is not checked
  input.contracts.pending.push({ id: 'hero', block: 'hero', variants: ['x'] });
  assert.deepEqual(libraryProblems(input), [
    'contract variant "cards (media)" [main] has no library variant',
    'contract variant "cards (overlay, tiles)" [cards-tiles] has no library variant',
  ]);
});

test('stale and contradictory entries fail', () => {
  const input = base();
  input.spec.gone = { variants: [] };
  input.excluded.cards = 'twice';
  assert.deepEqual(libraryProblems(input), [
    'block "cards" is both in SPEC and EXCLUDED',
    'library entry "gone" has no block in blocks/',
  ]);
});

test('a contract section style without a Section Metadata entry fails', () => {
  const input = base();
  input.contracts.pending.push({ id: 'highlight', form: 'section-style', styles: ['dark', 'highlight-grey'] });
  assert.deepEqual(libraryProblems(input), ['section style "highlight-grey" has no Section Metadata library entry']);
});

test('metadata.json must exist and list the spec variants', () => {
  const input = base();
  input.metadata = { cards: null };
  assert.deepEqual(libraryProblems(input), ['blocks/cards/metadata.json is missing']);
  input.metadata = { cards: { options: [{ class: 'overlay' }, { class: 'media' }] } };
  assert.deepEqual(libraryProblems(input), ['blocks/cards/metadata.json options [media|overlay] differ from the spec [overlay]']);
  input.metadata = { cards: { options: [{ class: 'overlay' }] } };
  assert.deepEqual(libraryProblems(input), []);
});
