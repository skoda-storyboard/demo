/*
 * media-items-lib.mjs — pure helpers for the SKODA-608 image/video item pages.
 *
 * Source: the server-rendered source listings (/en/images/, /en/videos/ with
 * `filter[<tax>][]=<slug>` and `ajax_search_results_image|video=N`). Their
 * `article.media-cart-item` cards are the only source that covers every item: many
 * attachment pages 404 (unpublished parent press kits) while the card is listed.
 *
 * No page per item (docs/architecture/SKODA-MEDIA-ITEMS-OPTIONS.md, option B: AEM Assets is
 * the source of truth). Each item becomes one ROW of the generated media feed
 * (/en/media-feed.json, a DA sheet in the query-index shape; contract `media-item` shape 3),
 * which the listing and story-rail blocks read through their `index` config row. For the M1
 * demo the rows come from the source listing; the M2 sync job writes the same rows from
 * published AEM Assets.
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

// The lightbox detail-panel fields (media-item shape 4): file metadata as the source prints
// it, the tag chip labels in source order, and the related article.
export const DETAIL_FIELDS = ['filetype', 'filesize', 'dimensions', 'labels', 'related', 'related-title'];

const text = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');

/** The source's per-item detail request (the colorbox panel, `image-overlay-meta-data`). */
export function detailRequest(id, nonce) {
  const body = new URLSearchParams({
    action: 'skoda_ajax_loader',
    nonce,
    template: 'templates/image-overlay-meta-data',
    loop: 'false',
    'query_vars[post_type]': 'attachment',
    'query_vars[offset]': '0',
    'query_vars[p]': String(id),
    'query_vars[include_hidden]': 'true',
  });
  return { url: `${SOURCE_ORIGIN}/wp/wp-admin/admin-ajax.php`, body: body.toString() };
}

/** The ajax loader nonce a source listing page embeds (`var skoda_ajax_loader = {…}`). */
export function ajaxNonce(html) {
  return (String(html || '').match(/skoda_ajax_loader\s*=\s*\{[^}]*"nonce":"([a-z0-9]+)"/i) || [])[1] || '';
}

/**
 * The detail-panel fields from the source panel markup: `File type: JPG`, `File size: 10 MB`,
 * `Dimensions: 8256 × 5504 px` (the source's non-breaking spaces become plain ones), the
 * tag chip labels ("2026, Octavia") and the first related article (absolute source URL).
 * @param {Document} doc the parsed panel HTML
 */
export function parseDetailPanel(doc) {
  const strong = (sel) => text(doc.querySelector(`${sel} strong`));
  const related = doc.querySelector('.related-links a.related-link[href]');
  return {
    filetype: strong('.meta-filetype'),
    filesize: strong('.meta-filesize'),
    dimensions: strong('.meta-dimensions'),
    labels: [...doc.querySelectorAll('.entry-tags a.label')].map(text).filter(Boolean).join(', '),
    related: related ? related.getAttribute('href') : '',
    'related-title': text(related),
  };
}

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
 * Images a source page links from its own copy (`<a href="…jpg"><img class="wp-image-N">`,
 * e.g. the model pages' Liftback / Combi drawings): the source opens them in the same
 * colorbox, with the attachment's detail panel. Listing and rail cards (`.article-teaser`) are not
 * matched. Returns [{ id, original, alt }] in page order, de-duplicated by id.
 * @param {Document} doc the source page
 */
export function parseAssetLinks(doc) {
  const seen = new Set();
  return [...doc.querySelectorAll('a[href]')].flatMap((a) => {
    const img = a.querySelector(':scope > img[class*="wp-image-"]');
    const href = cdnUrl(a.getAttribute('href'));
    if (!img || !/\.(jpe?g|png|webp)$/i.test(href) || a.closest('.article-teaser')) return [];
    const id = (img.getAttribute('class').match(/wp-image-(\d+)/) || [])[1];
    if (!id || seen.has(id)) return [];
    seen.add(id);
    return [{ id, original: href, alt: (img.getAttribute('alt') || '').trim() }];
  });
}

/**
 * A content-linked image as a feed item (template `asset`, contract media-item shape 5): no
 * listing, rail or cart; it only carries what the lightbox shows. Title and published date
 * come from the source detail panel (its first line and "Published"), else the alt text.
 * @param {{id: string, original: string, alt: string}} link from parseAssetLinks
 * @param {Document} panelDoc the parsed source detail panel
 */
export function assetItem(link, panelDoc) {
  const panel = parseDetailPanel(panelDoc);
  const title = text(panelDoc.querySelector('p')) || link.alt;
  const slug = slugify(link.original.split('/').pop().replace(/\.[a-z0-9]+$/i, ''));
  return {
    id: link.id,
    type: 'asset',
    title,
    source: `${SOURCE_ORIGIN}/?attachment_id=${link.id}`,
    date: isoDate(text(panelDoc.querySelector('.meta-published strong'))),
    caption: '',
    alt: link.alt,
    original: link.original,
    thumbnail: link.original,
    image: link.original,
    terms: {},
    slug,
    path: `/en/assets/${slug}`,
    ...panel,
  };
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
      thumbnail: cdnUrl(img && img.getAttribute('src')),
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

/**
 * Source ids in the source's own listing order. Every listing is a slice of one global
 * order (newest first, then the source's gallery order, which neither the id nor the publish
 * time reproduces), so consecutive cards give "a before b" edges; a topological merge of
 * them rebuilds the order across listings. Unordered pairs go newest first, then (like any
 * inconsistent pair) first-seen.
 */
export function sourceOrder(lists) {
  const firstSeen = new Map();
  const dates = new Map();
  const next = new Map();
  const indegree = new Map();
  lists.forEach((list) => list.forEach((item, i) => {
    if (!firstSeen.has(item.id)) {
      firstSeen.set(item.id, firstSeen.size);
      dates.set(item.id, item.date || '');
      next.set(item.id, new Set());
      indegree.set(item.id, 0);
    }
    const prev = list[i - 1];
    if (prev && prev.id !== item.id && !next.get(prev.id).has(item.id)) {
      next.get(prev.id).add(item.id);
      indegree.set(item.id, indegree.get(item.id) + 1);
    }
  }));
  const order = [];
  const done = new Set();
  const byDateThenSeen = (a, b) => dates.get(b).localeCompare(dates.get(a))
    || firstSeen.get(a) - firstSeen.get(b);
  while (order.length < firstSeen.size) {
    const ready = [...firstSeen.keys()].filter((id) => !done.has(id) && indegree.get(id) === 0);
    // a cycle (listings disagree): release the earliest-seen remaining id
    const id = (ready.length ? ready : [...firstSeen.keys()].filter((x) => !done.has(x)))
      .sort(byDateThenSeen)[0];
    done.add(id);
    order.push(id);
    next.get(id).forEach((n) => indegree.set(n, indegree.get(n) - 1));
  }
  return order;
}

/**
 * Merge item lists by source id (first wins; terms are unioned), in source listing order.
 * Resolves slug collisions.
 */
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
  return sourceOrder(lists).map((id) => byId.get(id)).map((item) => {
    const n = (seen.get(item.path) || 0) + 1;
    seen.set(item.path, n);
    if (n === 1) return item;
    const slug = `${item.slug}-${item.id}`;
    return { ...item, slug, path: item.path.replace(/[^/]+$/, slug) };
  });
}

/** Link target of a feed row until the listing lightbox lands (SKODA-406). */
function rowPath(item) {
  if (item.type === 'image' || item.type === 'asset') return item.original;
  return item['vimeo-id'] ? `https://vimeo.com/${item['vimeo-id']}` : item.mp4;
}

/**
 * One media feed row (contract media-item shape 3): the columns the listing and story-rail
 * read (path, title, description, image, template, date, category, tags, the 15 facets) plus
 * the download fields. Every value is a string (a sheet cell); lists are comma-joined.
 */
export function feedRow(item) {
  const row = {
    path: rowPath(item),
    title: item.title,
    description: item.caption,
    // Card thumbnail: the source's 768px rendition for images, the Vimeo poster for videos.
    image: (item.type === 'image' ? item.thumbnail : item.poster) || item.image,
    template: item.type,
    date: item.date,
    category: { image: 'images', video: 'videos', asset: 'assets' }[item.type] || '',
    tags: [...new Set(FACETS.flatMap((tax) => item.terms[tax] || []))].join(', '),
  };
  FACETS.forEach((tax) => { row[tax] = (item.terms[tax] || []).join(', '); });
  DOWNLOAD_FIELDS.forEach((field) => { row[field] = item[field] || ''; });
  DETAIL_FIELDS.forEach((field) => { row[field] = item[field] || ''; });
  row.id = item.id;
  row.source = item.source;
  return row;
}

/**
 * The DA sheet JSON (`:type: sheet`, the shape DA stores and Edge Delivery serves). Newest
 * first; same-day rows keep the source listing order (mergeItems), which the rails' stable
 * date sort then preserves, so a rail lists them as the source does.
 */
export function feedSheet(items) {
  const data = items.map(feedRow)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return {
    total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
  };
}
