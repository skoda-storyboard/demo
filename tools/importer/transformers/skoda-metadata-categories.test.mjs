/* global globalThis */
/*
 * Unit tests for the story `categories` metadata (SKODA-831): a story's own WP categories
 * (`category-<slug>` classes on article.post-<postid>) plus every ancestor, so a category
 * archive's Stories feed can scope by `categories` the way the source archive does.
 * Run: node --test tools/importer/transformers/skoda-metadata-categories.test.mjs
 * The DOM tests run the production transformer on jsdom; they skip if jsdom is unavailable.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATEGORY_PARENTS, categoriesFromPostClass, withCategoryAncestors, pickCategories,
  buildMetaFields,
} from './skoda-metadata-extract.mjs';
import { buildParents, renderInto, BLOCK } from '../build-category-parents.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// the measured origin classes (cached origin snapshots, 2026-10-05)
const CAMOUFLAGE = 'post-377544 post type-post status-publish format-standard has-post-thumbnail hentry category-design category-elroq category-emobility category-sustainability global-categories-brand model-elroq company-design environment-sustainability technology-emobility years-48727 media-cart-item';
const CYCLING = 'post-449201 post type-post status-publish hentry category-cycling category-lifestyle years-48727';

test('categoriesFromPostClass: category-<slug> tokens only, lowercase, de-duped, class order', () => {
  assert.deepEqual(categoriesFromPostClass(CAMOUFLAGE), ['design', 'elroq', 'emobility', 'sustainability']);
  assert.deepEqual(categoriesFromPostClass('category-125-let-skode___en CATEGORY-Heritage category-heritage'), ['125-let-skode___en', 'heritage']);
  assert.deepEqual(categoriesFromPostClass('global-categories-brand categoryx category-'), []);
  assert.deepEqual(categoriesFromPostClass(''), []);
  assert.deepEqual(categoriesFromPostClass(null), []);
});

test('withCategoryAncestors: each slug then its parent chain, de-duped', () => {
  assert.deepEqual(
    withCategoryAncestors(['design', 'elroq', 'emobility', 'sustainability']),
    ['design', 'skoda-world', 'elroq', 'models', 'emobility', 'sustainability'],
  );
  // three levels: cycling → sports → lifestyle (lifestyle also an own class)
  assert.deepEqual(withCategoryAncestors(['cycling', 'lifestyle']), ['cycling', 'sports', 'lifestyle']);
  assert.deepEqual(withCategoryAncestors(['technology']), ['technology', 'innovation-and-technology', 'skoda-world']);
  assert.deepEqual(withCategoryAncestors(['not-in-the-tree']), ['not-in-the-tree'], 'unknown slugs are kept');
  assert.deepEqual(withCategoryAncestors(['a'], { a: 'b', b: 'a' }), ['a', 'b'], 'a cycle terminates');
  assert.deepEqual(withCategoryAncestors([]), []);
});

test('pickCategories: story pages only, comma-joined', () => {
  assert.equal(pickCategories({ template: 'story', postClass: CAMOUFLAGE }), 'design, skoda-world, elroq, models, emobility, sustainability');
  assert.equal(pickCategories({ template: 'story', postClass: CYCLING }), 'cycling, sports, lifestyle');
  // a press kit carries category-* classes too, but only stories get the row
  assert.equal(pickCategories({ template: 'press_kit', postClass: 'press_kit hentry category-octavia category-press-kits' }), '');
  assert.equal(pickCategories({ template: 'story', postClass: '' }), '', 'no post article → no row');
  assert.equal(pickCategories(), '');
});

test('buildMetaFields writes `categories` beside an unchanged `category`', () => {
  const { meta } = buildMetaFields({
    title: 'Camouflage', template: 'story', category: 'emobility', categories: 'design, skoda-world, emobility',
  });
  assert.equal(meta.category, 'emobility');
  assert.equal(meta.categories, 'design, skoda-world, emobility');
  assert.equal('categories' in buildMetaFields({ title: 'x', template: 'page' }).meta, false);
});

test('CATEGORY_PARENTS: the generated English tree (spot checks)', () => {
  assert.equal(CATEGORY_PARENTS.design, 'skoda-world');
  assert.equal(CATEGORY_PARENTS.cycling, 'sports');
  assert.equal(CATEGORY_PARENTS.sports, 'lifestyle');
  assert.equal(CATEGORY_PARENTS.elroq, 'models');
  ['emobility', 'skoda-world', 'lifestyle', 'models'].forEach((root) => assert.equal(root in CATEGORY_PARENTS, false, `${root} is a root`));
});

test('buildParents: English archives only, roots have no entry, foreign parents dropped', () => {
  const rows = [
    {
      id: 6, slug: 'skoda-world', parent: 0, link: 'https://x/en/category/skoda-world/',
    },
    {
      id: 26, slug: 'design', parent: 6, link: 'https://x/en/category/skoda-world/design/',
    },
    {
      id: 90, slug: 'design-cs', parent: 91, link: 'https://x/cs/category/svet-skody/design-cs/',
    },
    {
      id: 91, slug: 'svet-skody', parent: 0, link: 'https://x/cs/category/svet-skody/',
    },
    {
      id: 92, slug: 'orphan', parent: 91, link: 'https://x/en/category/orphan/',
    },
  ];
  assert.deepEqual(buildParents(rows), { design: 'skoda-world' });
  assert.deepEqual(buildParents([]), {});
});

test('renderInto rewrites only the generated block and keeps each file\'s export style', () => {
  const src = 'a\n// BEGIN GENERATED CATEGORY PARENTS (x)\nconst CATEGORY_PARENTS = {};\n// END GENERATED CATEGORY PARENTS\nb\n';
  const out = renderInto(src, { design: 'skoda-world', 'peaq-en': 'models' });
  assert.equal(out, "a\n// BEGIN GENERATED CATEGORY PARENTS (x)\nconst CATEGORY_PARENTS = {\n  design: 'skoda-world',\n  'peaq-en': 'models',\n};\n// END GENERATED CATEGORY PARENTS\nb\n");
  assert.match(renderInto(src.replace('const', 'export const'), {}), /export const CATEGORY_PARENTS = \{\};/);
  assert.throws(() => renderInto('no markers', {}), /markers not found/);
});

test('the transformer\'s inline CATEGORY_PARENTS equals the tested mirror', () => {
  const block = (f) => readFileSync(path.join(here, f), 'utf8').match(BLOCK)[0]
    .replace('export const', 'const');
  assert.equal(block('skoda-metadata.js'), block('skoda-metadata-extract.mjs'));
});

// ---- the production transformer on jsdom ----------------------------------------------------

let JSDOM = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* jsdom unavailable — skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

let captured = null;
globalThis.WebImporter = {
  Blocks: {
    getMetadataBlock: (doc, meta) => {
      captured = meta;
      return doc.createElement('table');
    },
  },
};
const { default: metadata } = await import('./skoda-metadata.js');

function run(bodyClass, body, url) {
  const { document } = new JSDOM(`<html><head><title>T - Škoda Storyboard</title></head><body class="${bodyClass}">${body}</body></html>`).window;
  captured = null;
  metadata('afterTransform', document.body, { document, url, params: { originalURL: url } });
  return captured;
}

const TEASERS = '<article class="article-teaser post-1 post category-heritage"></article>';

test('transformer: a story gets categories from its own post article; category unchanged', { skip }, () => {
  const meta = run(
    'single single-post postid-377544 post-template',
    `<article class="${CAMOUFLAGE}"><div class="content">x</div></article>${TEASERS}`,
    'https://www.skoda-storyboard.com/en/emobility/camouflage-to-get-you-hooked/',
  );
  assert.equal(meta.template, 'story');
  assert.equal(meta.category, 'emobility');
  assert.equal(meta.categories, 'design, skoda-world, elroq, models, emobility, sustainability');
});

test('transformer: teaser cards never contribute; a missing post article emits no row', { skip }, () => {
  const meta = run('single single-post postid-999', TEASERS, 'https://www.skoda-storyboard.com/en/lifestyle/x/');
  assert.equal(meta.template, 'story');
  assert.equal('categories' in meta, false);
});

test('transformer: non-story pages get no categories row', { skip }, () => {
  const kit = run(
    'single single-press_kit postid-5',
    '<article class="post-5 press_kit category-octavia category-press-kits model-octavia"></article>',
    'https://www.skoda-storyboard.com/en/press-kits/octavia/',
  );
  assert.equal(kit.template, 'press_kit');
  assert.equal('categories' in kit, false);
  const archive = run('archive category category-design', TEASERS, 'https://www.skoda-storyboard.com/en/category/skoda-world/design/');
  assert.equal('categories' in archive, false);
});
