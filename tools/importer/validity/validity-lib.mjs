/*
 * validity-lib.mjs: the import validity checks (SKODA-603), pure functions over parsed
 * documents. The CLI is tools/importer/import-validity.mjs; tests in validity-lib.test.mjs.
 *
 * Three failure patterns, as found on the Octavia press kits (imported with the generic page
 * importer) and in the M1 backlog (data tables as unknown blocks, a dropped teaser summary):
 *   1. page type: the importer used doesn't match the source's own page type;
 *   2. blocks: unknown / unnamed / content-named blocks, leftover source markup;
 *   3. completeness: source text, headings, images or files missing from the import.
 */

// The glued non-breaking space placeholder the importer writes (skoda-nbsp, push-lib).
const NBSP_PLACEHOLDER = '\u{F00A0}';

/** Text for comparison: placeholder, nbsp and whitespace runs → one space; quotes; lowercase. */
export const norm = (s) => String(s || '')
  .replaceAll(NBSP_PLACEHOLDER, ' ')
  .replace(/[\s\u00a0\u2009\u202f]+/g, ' ')
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .trim()
  .toLowerCase();

/**
 * A file's identity across source, DAM and media-bus URLs: the basename without the
 * WordPress `-WxH` rendition suffix, the query/hash, or the extension.
 */
export function assetName(url) {
  if (!url) return '';
  let name = String(url).split(/[?#]/)[0].split('/').pop() || '';
  try { name = decodeURIComponent(name); } catch { /* keep as is */ }
  return name.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/-\d{2,5}x\d{2,5}$/, '')
    .replace(/-scaled$/, '').toLowerCase();
}

// --- 1. page type -------------------------------------------------------------------------

const TYPE_MARKER = /^(single|page-template|template|archive|post-type|error|home|blog|press_kit-template|category|tag)/;
const LISTING_TOKENS = ['images', 'videos', 'news', 'press-kits', 'search', 'media-room'];

/**
 * The source page's own type, from its body classes and (for press kits) its structure.
 * Press kits: a `press_kit-template-default` page whose article is a hero + chapter-teaser
 * grid (no primary column) is a tiles hub too (Elroq, Superb, Kodiaq).
 * @param {Document} doc the source page
 * @returns {{type: string, markers: string[]}}
 */
export function sourceType(doc) {
  const body = doc.body ? [...doc.body.classList] : [];
  const has = (c) => body.includes(c);
  const markers = body.filter((c) => TYPE_MARKER.test(c) || LISTING_TOKENS.includes(c));
  let type = 'unknown';
  if (has('error404')) type = '404';
  else if (has('single-press_release')) type = 'press-release';
  else if (has('single-press_kit')) {
    const article = doc.querySelector('article.press_kit');
    const teaserHub = article && article.querySelector(':scope > .hero')
      && !article.querySelector('.column-primary')
      && article.querySelector('.content article.article-teaser');
    type = has('press_kit-template-template-tiles') || teaserHub ? 'press-kit-hub' : 'press-kit-default';
  } else if (has('single-skoda_model')) type = 'model-page';
  else if (has('single-skoda_series')) type = 'series-hub';
  else if (has('single-post')) type = 'story-detail';
  else if (has('page-template-template-search-results')) {
    if (has('images')) type = 'images-listing';
    else if (has('videos')) type = 'videos-listing';
    else if (has('search')) type = 'search-listing';
    else type = 'pr-listing'; // news, press-kits
  } else if (has('page-template-template-homepage') || has('home')) type = 'home-sto';
  else if (has('page-template-template-media-room')) type = 'home-mr';
  else if (has('page-template-template-tiles')) type = 'series-directory';
  else if (has('post-type-archive-skodapedia') || has('tax-skodapedia') || has('single-skodapedia')) type = 'skodapedia';
  else if (has('archive') && (has('category') || has('tag'))) type = 'category-archive';
  else if (has('page-template-template-media-room-page')) type = 'company-page';
  else if (has('page') || has('page-template-default')) type = 'page-base';
  return { type, markers };
}

/** The importer that is right for each source type (the template census, _TEMPLATES.md). */
export const EXPECTED_IMPORTERS = {
  404: ['404'],
  'press-release': ['press-release'],
  'press-kit-hub': ['press-kit-hub'],
  'press-kit-default': ['press-kit-default'],
  'model-page': ['model-page'],
  'series-hub': ['series-hub'],
  'story-detail': ['story-detail'],
  'images-listing': ['images-listing'],
  'videos-listing': ['videos-listing'],
  'search-listing': ['search-listing'],
  'pr-listing': ['pr-listing'],
  'home-sto': ['home-sto'],
  'home-mr': ['home-mr'],
  'series-directory': ['series-directory'],
  skodapedia: ['skodapedia'],
  'category-archive': ['category-archive'],
  'company-page': ['company-page'],
  'page-base': ['page-base'],
};

/** The page's `template` metadata each source type should carry (the index contract). */
export const EXPECTED_TEMPLATE_META = {
  'press-release': ['press_release'],
  'press-kit-hub': ['press_kit'],
  'press-kit-default': ['press_kit', 'press_kit_chapter'],
  'model-page': ['skoda_model'],
  'series-hub': ['skoda_series'],
  'story-detail': ['story'],
};

/**
 * Page-type findings for one page.
 * @returns {Array<{check: string, severity: string, detail: string}>}
 */
export function pageTypeFindings({ type, importer, templateMeta }) {
  const out = [];
  if (type === 'unknown') {
    out.push({ check: 'page-type', severity: 'medium', detail: 'source page type not recognised' });
    return out;
  }
  const expected = EXPECTED_IMPORTERS[type] || [];
  if (!importer) {
    out.push({ check: 'importer-unknown', severity: 'low', detail: `no import record; source type ${type} (expected ${expected.join(' | ')})` });
  } else if (!expected.includes(importer)) {
    out.push({ check: 'wrong-importer', severity: 'high', detail: `imported with ${importer}; the source is ${type} (expected ${expected.join(' | ')})` });
  }
  const meta = EXPECTED_TEMPLATE_META[type];
  if (meta && templateMeta && !meta.includes(templateMeta)) {
    out.push({ check: 'template-metadata', severity: 'high', detail: `template metadata "${templateMeta}"; a ${type} page carries ${meta.join(' | ')}` });
  }
  return out;
}

// --- 2. blocks ----------------------------------------------------------------------------

/** EDS block name from a DA block div's class list (its first class, as EDS reads it). */
const blockName = (div) => (div.classList[0] || '').trim();

const LEFTOVERS = [
  ['.so-panel, .panel-grid, .panel-layout, [class*="siteorigin"]', 'SiteOrigin layout markup'],
  ['[class*="widget_"], .textwidget', 'WordPress widget markup'],
  ['iframe', 'a raw iframe (embeds should be a link or an Embed block)'],
  ['table', 'a raw table'],
  ['script, style', 'a script or style element'],
];

/**
 * Block and leftover-markup findings for one imported page (DA source or served HTML:
 * main > section divs > block divs).
 * @param {Document} doc
 * @param {Set<string>} codeBlocks block folder names in the code
 * @param {{icons?: Set<string>}} [o] asset names of small (≤ 60px) source images
 */
export function blockFindings(doc, codeBlocks, { icons = new Set() } = {}) {
  const out = [];
  const main = doc.querySelector('main') || doc.body;
  const sections = [...main.children].filter((el) => el.localName === 'div');
  const known = new Set([...codeBlocks, 'metadata', 'section-metadata']);
  sections.forEach((section) => {
    [...section.children].filter((el) => el.localName === 'div').forEach((div) => {
      const name = blockName(div);
      if (!name) {
        const first = (div.querySelector('div > div') || div).textContent.trim().slice(0, 40);
        out.push({ check: 'unnamed-block', severity: 'high', detail: `a table with no block name (first cell "${first}"): usually a source data or layout table` });
      } else if (!known.has(name)) {
        out.push({ check: 'unknown-block', severity: 'high', detail: `block "${name}" exists in no code (from "${div.className}")` });
      }
    });
  });
  LEFTOVERS.forEach(([sel, what]) => {
    const n = main.querySelectorAll(sel).length;
    if (n) out.push({ check: 'leftover-markup', severity: 'medium', detail: `${n} × ${what}` });
  });
  const emptySections = sections
    .filter((s) => !s.textContent.trim() && !s.querySelector('img, picture, a[href], div[class]')).length;
  if (emptySections) out.push({ check: 'empty-section', severity: 'low', detail: `${emptySections} empty section(s)` });
  // a small source icon (X, WhatsApp, …) that became a full paragraph image; inside a block
  // (a classed div) the block sizes it (Columns callout)
  const iconsAsImages = [...main.querySelectorAll('p > picture > img, p > img')]
    .filter((img) => !img.closest('div[class]'))
    .map((img) => assetName(img.getAttribute('src')))
    .filter((n) => n && icons.has(n));
  if (iconsAsImages.length) {
    out.push({ check: 'icon-as-image', severity: 'medium', detail: `${iconsAsImages.length} small source icon(s) imported as full-width images: ${[...new Set(iconsAsImages)].slice(0, 3).join(', ')}` });
  }
  return out;
}

/** Small source images (declared width ≤ 60): icons, by asset name. */
export function sourceIcons(doc) {
  return new Set([...doc.querySelectorAll('img[width]')]
    .filter((img) => Number(img.getAttribute('width')) > 0 && Number(img.getAttribute('width')) <= 60)
    .map((img) => assetName(img.getAttribute('src'))).filter(Boolean));
}

// --- 3. completeness ------------------------------------------------------------------------

const BINARY = /\.(pdf|mp4|mov|m4v|zip)(?:$|[?#])/i;

/**
 * Where the content lives on the source, per page type. A type without an entry is
 * index-driven or composed at runtime (listings, homes, archives), so a text comparison
 * isn't meaningful there. `drop`: the dynamic or chrome parts the migration rebuilds on
 * purpose (related bands, newsletter forms, share widgets, banners).
 */
export const SOURCE_REGIONS = {
  'press-release': { root: 'article.press_release, article', drop: ['.search-results', '.sa-bnr', '.newsletter-subscribe-widget', 'form', '.share', '.side-banner'] },
  'press-kit-default': { root: 'article.press_kit', drop: ['.search-results.media-box .search-results-header', '.sa-bnr', 'form', '.share', '.chapter-nav-header'] },
  'press-kit-hub': { root: 'article.press_kit', drop: ['form', '.share'] },
  'story-detail': { root: 'article', drop: ['.search-results', '.related', 'form', '.share', '.sa-bnr', '.newsletter-subscribe-widget', '.side-banner'] },
  'model-page': { root: 'article, main', drop: ['.search-results', '.cover-box', 'form', '.share'] },
  'series-hub': { root: 'article, main', drop: ['form', '.share'] },
  'page-base': { root: 'article, main', drop: ['form', '.share', '.search-results'] },
  'company-page': { root: 'article, main', drop: ['form', '.share', '.search-results'] },
  'series-directory': { root: 'main', drop: ['form', '.share'] },
};

const CHROME = 'header, footer, nav, script, style, noscript, template, svg, .cookie, [class*="onetrust"], [id*="onetrust"], .screen-reader-text, [aria-hidden="true"]';

/** The source content region (a detached clone with chrome and dynamic parts removed). */
export function sourceRegion(doc, type) {
  const spec = SOURCE_REGIONS[type];
  if (!spec) return null;
  const root = spec.root.split(',').map((s) => doc.querySelector(s.trim())).find(Boolean);
  if (!root) return null;
  const clone = root.cloneNode(true);
  clone.querySelectorAll(CHROME).forEach((n) => n.remove());
  spec.drop.forEach((sel) => clone.querySelectorAll(sel).forEach((n) => n.remove()));
  return clone;
}

const BLOCKISH = 'p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, figcaption, dt, dd';

/** Comparable facts of a content tree: text, text blocks, headings, images, file links. */
export function contentFacts(root) {
  const text = norm(root.textContent);
  const blocks = [...root.querySelectorAll(BLOCKISH)]
    .filter((el) => !el.querySelector(BLOCKISH))
    .map((el) => norm(el.textContent))
    .filter((t) => t.length >= 25);
  // a text container that isn't one of the above (a teaser summary in a bare <div>)
  const looseDivs = [...root.querySelectorAll('div')]
    .filter((el) => !el.querySelector(`${BLOCKISH}, div`) && norm(el.textContent).length >= 40)
    .map((el) => norm(el.textContent));
  const headings = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .map((h) => norm(h.textContent)).filter(Boolean);
  const imgs = [...root.querySelectorAll('img')]
    .map((img) => assetName(img.getAttribute('data-src') || img.getAttribute('src')))
    .filter((n) => n && !/^(data:|blank|placeholder|spacer|loading)/.test(n));
  const links = [...root.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
  const files = links.filter((h) => BINARY.test(h)).map(assetName);
  return {
    text,
    blocks: [...new Set([...blocks, ...looseDivs])],
    headings,
    images: [...new Set(imgs)],
    files: [...new Set(files)],
    links: links.length,
  };
}

/**
 * Compare source and imported facts.
 * @returns {{coverage: number, missingBlocks: string[], missingHeadings: string[],
 *   missingImages: string[], missingFiles: string[], imageRatio: number}}
 */
export function compareFacts(src, imp) {
  const missingBlocks = src.blocks.filter((b) => !imp.text.includes(b));
  const total = src.blocks.reduce((n, b) => n + b.length, 0) || 1;
  const missingChars = missingBlocks.reduce((n, b) => n + b.length, 0);
  const missingHeadings = src.headings.filter((h) => h.length > 2 && !imp.text.includes(h));
  const impImages = new Set(imp.images);
  // served (previewed) HTML names images by media hash, not by file: compare counts there
  const hashed = imp.images.length > 0 && imp.images.every((n) => /^media_[0-9a-f]{20,}$/.test(n));
  const missingImages = hashed
    ? src.images.slice(Math.min(src.images.length, imp.images.length))
    : src.images.filter((n) => !impImages.has(n));
  const impFiles = new Set(imp.files);
  const missingFiles = src.files.filter((n) => !impFiles.has(n));
  return {
    coverage: 1 - missingChars / total,
    missingBlocks,
    missingHeadings,
    missingImages,
    missingFiles,
    imageRatio: src.images.length ? (src.images.length - missingImages.length) / src.images.length : 1,
  };
}

export const THRESHOLDS = {
  coverage: 0.95, // share of source text (characters of its text blocks) found in the import
  imageRatio: 0.9, // share of source images found
};

/** Completeness findings from a comparison. */
export function completenessFindings(cmp, thresholds = THRESHOLDS) {
  const out = [];
  if (cmp.coverage < thresholds.coverage) {
    out.push({
      check: 'missing-text',
      severity: cmp.coverage < 0.8 ? 'high' : 'medium',
      detail: `${Math.round(cmp.coverage * 100)}% of the source text found; missing e.g. "${(cmp.missingBlocks[0] || '').slice(0, 90)}"`,
    });
  }
  if (cmp.missingHeadings.length) {
    out.push({ check: 'missing-heading', severity: 'medium', detail: `${cmp.missingHeadings.length} heading(s) missing: "${cmp.missingHeadings.slice(0, 3).join('", "').slice(0, 140)}"` });
  }
  if (cmp.imageRatio < thresholds.imageRatio) {
    out.push({ check: 'missing-images', severity: cmp.imageRatio < 0.5 ? 'high' : 'medium', detail: `${Math.round(cmp.imageRatio * 100)}% of the source images found; missing e.g. ${cmp.missingImages.slice(0, 3).join(', ')}` });
  }
  if (cmp.missingFiles.length) {
    out.push({ check: 'missing-files', severity: 'high', detail: `${cmp.missingFiles.length} file link(s) missing: ${cmp.missingFiles.slice(0, 3).join(', ')}` });
  }
  return out;
}

const RANK = { high: 3, medium: 2, low: 1 };
/** A page's severity is its worst finding; `none` when clean. */
export const worst = (findings) => findings
  .reduce((w, f) => (RANK[f.severity] > (RANK[w] || 0) ? f.severity : w), 'none');
/** Most severe first. */
export const bySeverity = (a, b) => (RANK[b.severity] || 0) - (RANK[a.severity] || 0);
