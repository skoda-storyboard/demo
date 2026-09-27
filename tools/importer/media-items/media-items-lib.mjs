/*
 * media-items-lib.mjs — pure helpers for the SKODA-608 image/video item pages.
 *
 * Source: the server-rendered source listings (/en/images/, /en/videos/ with
 * `filter[<tax>][]=<slug>` and `ajax_search_results_image|video=N`). Their
 * `article.media-cart-item` cards are the only source that covers every item: many
 * attachment pages 404 (unpublished parent press kits) while the card is listed.
 *
 * One EDS page per item at /en/images/<slug> or /en/videos/<slug> (contract `media-item`
 * shape 2, docs/planning/SKODA-PENDING-BLOCK-CONTRACTS.md). The page body uses blocks on
 * main only (embed autoblock, downloads, tags); the Metadata block carries the index row:
 * template, title, description, image, publisheddate, category, tags, the 15 facets and
 * the download fields (original, rendition-1920, mp4, vimeo-id, poster).
 *
 * Every function here is DOM-in / data-out and has no network access, so it is unit-tested
 * on saved fixtures (tools/importer/media-items/media-items.test.mjs).
 */

export const SOURCE_ORIGIN = 'https://www.skoda-storyboard.com';
export const CDN_ORIGIN = 'https://cdn.skoda-storyboard.com';

// The 15 index facets (query-index-config.yaml, SKODA-METADATA-SCHEMA.md).
export const FACETS = [
  'model', 'bodywork', 'derivative', 'motorsport', 'equipment', 'technology',
  'years', 'view', 'company', 'concept', 'environment', 'happening', 'history',
  'sponsorship', 'vip',
];

// Download fields, in the order they are written to the Metadata block + index.
export const DOWNLOAD_FIELDS = ['original', 'rendition-1920', 'mp4', 'vimeo-id', 'poster'];

const text = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');

/** Lowercase, anything outside [a-z0-9-] becomes `-` (the EDS path rule, push/m1-status-lib). */
export function slugify(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** "21. 9. 2026" → "2026-09-21" ('' when it doesn't parse). */
export function isoDate(value) {
  const m = String(value || '').match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

/** `/direct-download/2026/08/file.jpg` (or absolute) → the stable CDN URL. */
export function cdnUrl(href) {
  const m = String(href || '').match(/\/direct-download\/(\d{4}\/\d{2}\/[^?#]+?)\/?(?:[?#]|$)/);
  if (m) return `${CDN_ORIGIN}/${m[1]}`;
  return /^https:\/\/cdn\.skoda-storyboard\.com\//.test(href || '') ? href.split(/[?#]/)[0] : '';
}

/** Vimeo poster in its ingestible form: `…-d_295x166?region=us` → `…-d_1280x720.jpg`. */
export function vimeoPoster(src) {
  if (!/^https:\/\/i\.vimeocdn\.com\/video\//.test(src || '')) return '';
  return src.replace(/(-d)?_\d+x\d+(\.[a-z]+)?(\?.*)?$/i, '-d_1280x720.jpg')
    .replace(/(\?.*)$/, '');
}

/**
 * Facet values the source listing offers (`filter[<tax>][]=<value>` checkboxes), with
 * their labels. Only values offered here are accepted from card classes, which drops
 * non-EN leaks (`model-peaq-sk`) and stray terms (`view-exter`).
 * @param {Document} doc a source listing page
 * @returns {Map<string, string>} `${tax}:${value}` → label
 */
export function facetOptions(doc) {
  const out = new Map();
  doc.querySelectorAll('form.search-filter input[name^="filter["]').forEach((input) => {
    const tax = (input.getAttribute('name').match(/^filter\[([a-z0-9_-]+)\]/) || [])[1];
    const value = input.getAttribute('value');
    if (!tax || !value) return;
    const label = text(input.id ? doc.querySelector(`label[for="${input.id}"]`) : null) || value;
    out.set(`${tax}:${value}`, label);
  });
  return out;
}

/**
 * Taxonomy terms of a card from its classes. `years-<termId>` uses a numeric term id,
 * resolved through `yearsById` (probed per year value, see build-media-items.mjs).
 * @returns {Record<string, string[]>} facet → values
 */
export function cardTerms(article, options, yearsById = {}) {
  const terms = {};
  const add = (tax, value) => {
    if (!value) return;
    if (options && !options.has(`${tax}:${value}`)) return;
    (terms[tax] = terms[tax] || []);
    if (!terms[tax].includes(value)) terms[tax].push(value);
  };
  (article.getAttribute('class') || '').split(/\s+/).forEach((cls) => {
    const dash = cls.indexOf('-');
    if (dash < 1) return;
    const tax = cls.slice(0, dash);
    const slug = cls.slice(dash + 1);
    if (!FACETS.includes(tax)) return;
    if (tax === 'years') add(tax, yearsById[slug] || (/^\d{4}$/.test(slug) ? slug : ''));
    else add(tax, slug);
  });
  return terms;
}

/** Years term ids present on a set of cards (`years-61572` → '61572'). */
export function yearIds(articles) {
  const ids = new Set();
  articles.forEach((a) => (a.getAttribute('class') || '').split(/\s+/)
    .forEach((c) => { const m = c.match(/^years-(\d+)$/); if (m) ids.add(m[1]); }));
  return ids;
}

/** Slug for an item from its source attachment URL, or the file name for `?attachment_id=`. */
export function itemSlug(sourceUrl, fileUrl) {
  let segment = '';
  try {
    const u = new URL(sourceUrl, SOURCE_ORIGIN);
    if (!u.searchParams.get('attachment_id')) {
      segment = u.pathname.replace(/\/+$/, '').split('/').pop();
    }
  } catch (e) { /* fall through to the file name */ }
  if (!segment && fileUrl) segment = fileUrl.split('/').pop().split(/[?#]/)[0].replace(/\.[a-z0-9]+$/i, '');
  return slugify(segment);
}

/**
 * Parse the media cards of a source listing page into item descriptors.
 * @param {Document} doc
 * @param {{options?: Map, yearsById?: object}} ctx
 */
export function parseCards(doc, { options, yearsById } = {}) {
  const opts = options || facetOptions(doc);
  return [...doc.querySelectorAll('article.media-cart-item')].map((article) => {
    const type = article.classList.contains('video') ? 'video' : 'image';
    const id = article.getAttribute('data-post-id') || '';
    const titleLink = article.querySelector('.entry-title a[href]');
    const source = titleLink ? titleLink.getAttribute('href') : `${SOURCE_ORIGIN}/?attachment_id=${id}`;
    const img = article.querySelector('.article-teaser-media img');
    const colorbox = article.querySelector('a.colorbox[href]');
    const item = {
      id,
      type,
      title: text(titleLink) || (img && img.getAttribute('alt')) || '',
      source,
      date: isoDate(text(article.querySelector('.entry-published'))),
      caption: ((img && img.getAttribute('data-caption')) || '').replace(/\s+/g, ' ').trim(),
      alt: ((img && img.getAttribute('alt')) || '').trim(),
      terms: cardTerms(article, opts, yearsById),
    };

    if (type === 'image') {
      const master = colorbox ? cdnUrl(colorbox.getAttribute('href')) : '';
      const sizes = [...article.querySelectorAll('.media-cart-action-multi.download a[href]')];
      const r1920 = sizes.map((a) => cdnUrl(a.getAttribute('href'))).find((u) => /-1920x\d+\.[a-z]+$/i.test(u)) || '';
      const single = article.querySelector('a.media-cart-action.download[href]');
      item.original = master || cdnUrl(single && single.getAttribute('href'));
      item['rendition-1920'] = r1920;
      item.image = item.original;
    } else {
      const player = colorbox ? colorbox.getAttribute('href') : '';
      item['vimeo-id'] = (player.match(/player\.vimeo\.com\/video\/(\d+)/) || [])[1] || '';
      const dl = article.querySelector('a.media-cart-action.download[href]');
      item.mp4 = cdnUrl(dl && dl.getAttribute('href'));
      item.poster = vimeoPoster(img && img.getAttribute('src'));
      item.image = item.poster;
    }
    item.slug = itemSlug(source, item.original || item.mp4);
    item.path = `/en/${type === 'image' ? 'images' : 'videos'}/${item.slug}`;
    return item;
  });
}

/** Merge item lists by source id (first wins; terms are unioned). Resolves slug collisions. */
export function mergeItems(lists) {
  const byId = new Map();
  lists.flat().forEach((item) => {
    const prev = byId.get(item.id);
    if (!prev) { byId.set(item.id, { ...item, terms: { ...item.terms } }); return; }
    Object.entries(item.terms).forEach(([tax, values]) => {
      prev.terms[tax] = [...new Set([...(prev.terms[tax] || []), ...values])];
    });
  });
  const seen = new Map();
  return [...byId.values()].map((item) => {
    const n = (seen.get(item.path) || 0) + 1;
    seen.set(item.path, n);
    if (n === 1) return item;
    const slug = `${item.slug}-${item.id}`;
    return { ...item, slug, path: item.path.replace(/[^/]+$/, slug) };
  });
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
const row = (key, valueHtml) => `<div><div>${esc(key)}</div><div>${valueHtml}</div></div>`;
const picture = (src, alt) => `<picture><img src="${esc(src)}" alt="${esc(alt)}"></picture>`;
const listingOf = (item) => (item.type === 'image' ? '/en/images' : '/en/videos');

/** Display date "21. 9. 2026" (the source card format) from ISO. */
function displayDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${Number(m[3])}. ${Number(m[2])}. ${m[1]}` : '';
}

/**
 * Item page (.plain.html, the importer output format push-to-da wraps for DA).
 * @param {object} item a parseCards() descriptor
 * @param {Map<string,string>} labels `${tax}:${value}` → label (facetOptions)
 */
export function itemPageHtml(item, labels = new Map()) {
  const body = [`<h1>${esc(item.title)}</h1>`];
  if (item.date) body.push(`<p>${esc(displayDate(item.date))}</p>`);
  if (item.type === 'image') {
    body.push(`<p>${picture(item.original, item.alt || item.title)}</p>`);
  } else if (item['vimeo-id']) {
    const url = `https://vimeo.com/${item['vimeo-id']}`;
    body.push(`<p><a href="${esc(url)}">${esc(url)}</a></p>`);
  }
  if (item.caption) body.push(`<p>${esc(item.caption)}</p>`);

  // Downloads: one row in the block's 3-cell shape (contract downloads-file-rows).
  const links = item.type === 'image'
    ? [['Original', item.original], ['1920px', item['rendition-1920']]]
    : [['MP4', item.mp4]];
  const linkCell = links.filter(([, href]) => href)
    .map(([label, href]) => `<p><a href="${esc(href)}">${esc(label)}</a></p>`).join('');
  if (linkCell) {
    body.push(`<div class="downloads"><div><div>${item.image ? picture(item.image, item.alt || item.title) : ''}</div><div>${esc(item.title)}</div><div>${linkCell}</div></div></div>`);
  }

  // Tags: every facet value, linked to the filtered demo listing (deep-links the facet).
  const tagLinks = FACETS.flatMap((tax) => (item.terms[tax] || []).map((value) => {
    const href = `${listingOf(item)}?filter%5B${tax}%5D%5B%5D=${encodeURIComponent(value)}`;
    return `<a href="${esc(href)}">${esc(labels.get(`${tax}:${value}`) || value)}</a>`;
  }));
  if (tagLinks.length) {
    body.push('<h3>Tags</h3>');
    body.push(`<div class="tags"><div><div>${tagLinks.join('')}</div></div></div>`);
  }

  // Metadata = the index row (contract media-item shape 2).
  const allTags = [...new Set(FACETS.flatMap((tax) => item.terms[tax] || []))];
  const meta = [
    row('Title', esc(item.title)),
    row('Description', esc(item.caption || item.title)),
  ];
  if (item.image) meta.push(row('Image', picture(item.image, item.alt || item.title)));
  if (item.date) meta.push(row('publisheddate', esc(item.date)));
  meta.push(row('template', item.type));
  meta.push(row('category', item.type === 'image' ? 'images' : 'videos'));
  if (allTags.length) meta.push(row('tags', esc(allTags.join(', '))));
  FACETS.forEach((tax) => {
    if ((item.terms[tax] || []).length) meta.push(row(tax, esc(item.terms[tax].join(', '))));
  });
  DOWNLOAD_FIELDS.forEach((field) => { if (item[field]) meta.push(row(field, esc(item[field]))); });
  meta.push(row('source', esc(item.source)));
  body.push(`<div class="metadata">${meta.join('')}</div>`);

  return `<div>${body.join('')}</div>\n`;
}
