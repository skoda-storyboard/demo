/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda story-detail (single-post) extra cleanup.
 *
 * Layered ON TOP of skoda-page-cleanup (register both; this one handles what the
 * shared cleanup does not). The story is a two-column article shell
 * `.columns > .content (primary) + .sidebar (secondary)`. This pass strips:
 *   - `.btn-group.social` / `.social-container` — the floating share cluster
 *     (skoda-page-cleanup only targets `.social-share`/`.share-bar`, not these).
 *   - the in-body deferred-media shells inside `.content` (see below).
 *
 * ⚠️ THE SIDEBAR IS NO LONGER DROPPED HERE (SKODA-801). It is rebuilt into a
 * `Style: sidebar` section (Cards + Tags) by skoda-story-aside.js so it renders
 * beside the body via the grid-on-main story layout. This transformer must NOT
 * remove `.sidebar` — storyAside owns it now.
 *
 * ⚠️ FLATTEN pass, in-body media deferred to SKODA-604. In-body galleries
 * (`a.colorbox`, `.sb-gallery`), embeds (`.embed-controller-wrapper`, `.page-embed`),
 * and the Media Box (`.search-results.media-box`) inside `.content` are the must-keep
 * content SKODA-604 restores full-fidelity on the hero demo stories. They are removed
 * here (with a LOG so the drop is never silent) so the common story flattens to clean
 * body content; the SKODA-801 flatten parser handles the SiteOrigin WIDGET tree.
 *
 * Selectors verified against .migration/work/samples/story-live.html + story.html.
 *
 * ⚠️ ORDERING: `.sidebar` holds the story's `ol.entry-tags` (the tag links the
 * shared metadata transformer derives `tags`/facets from). Both this transformer and
 * skoda-story-aside act in `afterTransform` and MUST be registered AFTER
 * skoda-metadata.js so the Metadata block is built (from the still-present tags)
 * before the sidebar is restructured. The floating social cluster carries no
 * metadata, so it goes early (beforeTransform).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// The 15 taxonomy facets (index columns). Transformers are self-contained (the validator
// loads them standalone), so this mirrors skoda-metadata.js / skoda-metadata-extract.mjs
// FACETS — keep the three in sync.
const FACETS = [
  'model', 'bodywork', 'derivative', 'motorsport', 'equipment', 'technology',
  'years', 'view', 'company', 'concept', 'environment', 'happening', 'history',
  'sponsorship', 'vip',
];

// /en/tag/<taxonomy>/<slug>/ → { taxonomy, slug } (mirrors skoda-metadata-extract.mjs
// parseTagHref for the story tag-row link shape; story tag rows use /tag/ links only).
function parseTagHref(href) {
  const m = String(href || '').match(/\/tag\/([a-z0-9-]+)\/([a-z0-9-]+)\/?/i);
  return m ? { taxonomy: m[1].toLowerCase(), slug: m[2].toLowerCase() } : null;
}

// Canonical watch URL for an in-body video (SKODA-818), or '' if not a video embed.
// The SKODA-204 embed block (PR #109) autoblocks a bare YouTube/Vimeo URL on its own line.
function videoUrl(el) {
  const id = el.getAttribute('videoid');
  if (el.tagName.toLowerCase() === 'lite-youtube') {
    return id ? `https://www.youtube.com/watch?v=${id}` : '';
  }
  const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
  const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
  const vimeo = src.match(/player\.vimeo\.com\/video\/(\d+)/i);
  if (vimeo) return `https://vimeo.com/${vimeo[1]}`;
  return '';
}

// Replace in-body videos with a bare provider-URL paragraph (SKODA-818). The source uses
// <lite-youtube videoid> (hydrated into a poster + "Play" links by the time the importer
// sees it) behind a .page-embed consent shell; plain iframes may sit in a ratio wrapper.
function videosToUrls(element, document) {
  element.querySelectorAll('lite-youtube, iframe[src], iframe[data-src]').forEach((el) => {
    const url = videoUrl(el);
    if (!url) return;
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.textContent = url;
    p.appendChild(a);
    // Replace the whole wrapper: .embed-controller-wrapper is removed wholesale in
    // afterTransform (deferred audio embeds), which would otherwise take the URL with it.
    const target = el.closest('.embed-controller-wrapper, .video-container, .ratio-container') || el;
    target.replaceWith(p);
  });
  // The per-embed YouTube consent shell carries no content once the video is a URL.
  WebImporter.DOMUtils.remove(element, ['.page-embed.yt-embed-cookie']);
}

// Replace self-hosted WordPress videos (`[video]` shortcode) with an Embed table (SKODA-801a).
// By the time the importer sees the page, MediaElement.js has wrapped the <video> in `.mejs-*`
// player chrome whose CSS sprites (mejs-controls.svg), timecodes and a javascript:void volume
// link would otherwise flatten into the story body. The embed block plays the file natively.
function wpVideosToEmbeds(element, document) {
  element.querySelectorAll('.wp-video').forEach((wrapper) => {
    const video = wrapper.querySelector('video');
    const src = video && (video.querySelector('source[src]')?.getAttribute('src')
      || video.getAttribute('src') || wrapper.querySelector('a[href]')?.getAttribute('href') || '');
    if (!src || !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)) return;
    // WordPress appends a cache-buster (?_=1) to the source URL.
    const url = src.replace(/\?_=\d+$/, '');
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.textContent = url;
    const rows = [['Embed'], ['url', link]];
    const posterUrl = video.getAttribute('poster');
    if (posterUrl) {
      const poster = document.createElement('img');
      poster.setAttribute('src', posterUrl);
      poster.setAttribute('alt', '');
      rows.push(['poster', poster]);
    }
    wrapper.replaceWith(WebImporter.DOMUtils.createTable(rows, document));
  });
}

// Last non-empty path segment of an href/URL ('' when unparsable).
function lastSegment(href) {
  try {
    const segs = new URL(href, 'https://www.skoda-storyboard.com').pathname.split('/').filter(Boolean);
    return segs[segs.length - 1] || '';
  } catch (e) {
    return '';
  }
}

// Story Rail filter rows for the related band: one row per index facet column the story is
// tagged with (/en/tag/<taxonomy>/<slug>/ → `<taxonomy>: <slug>`), e.g. `model: epiq` +
// `years: 2026`. The rail ANDs across facet keys and ORs within one key, which is the
// source's "Based on tags: 2026, Epiq" rule (every related story carries both tags).
// Tag taxonomies that are not index facets fall back to the plain `tags` key.
function facetRows(element) {
  const byFacet = {};
  const plain = [];
  element.querySelectorAll('ol.entry-tags a[href], .sidebar .tags a[href]').forEach((a) => {
    const t = parseTagHref(a.getAttribute('href') || '');
    if (!t || !t.slug) return;
    if (FACETS.includes(t.taxonomy)) {
      byFacet[t.taxonomy] = byFacet[t.taxonomy] || [];
      if (!byFacet[t.taxonomy].includes(t.slug)) byFacet[t.taxonomy].push(t.slug);
    } else if (!plain.includes(t.slug)) {
      plain.push(t.slug);
    }
  });
  const rows = FACETS.filter((f) => byFacet[f]).map((f) => [f, byFacet[f].join(', ')]);
  if (plain.length) rows.push(['tags', plain.join(', ')]);
  return rows;
}

// Rebuild the full-width bottom "Related Stories" band (SKODA-820). It is NOT a duplicate
// of the sidebar "Explore more" (3 hand-picked vs 10 tag-matched stories). Emit it as its
// own `Style: dark` section: the heading + "Based on tags" subheading as default content,
// then an INDEX-DRIVEN Story Rail (SKODA-212): stories matching ALL of this story's tags,
// newest first, 10 items, the story itself excluded. Nothing is copied from the SSR
// teasers; the list stays current as stories are published.
function relatedBand(element, document, payload) {
  const band = element.querySelector('.cover-box .related-stories');
  if (!band) return;
  const cover = band.closest('.cover-box') || band;

  const headingEl = band.querySelector('.search-results-heading, h2, h3');
  const subEl = headingEl && headingEl.querySelector('.subheading');
  const subText = subEl ? (subEl.textContent || '').trim() : '';
  let headingText = 'Related Stories';
  if (headingEl) {
    const clone = headingEl.cloneNode(true);
    clone.querySelectorAll('.subheading').forEach((s) => s.remove());
    headingText = (clone.textContent || '').trim() || headingText;
  }

  const filters = facetRows(element);
  if (!filters.length) {
    console.warn('[story-cleanup] related band: story has no tags to match; dropped');
    cover.remove();
    return;
  }
  const originalURL = (payload && payload.params && payload.params.originalURL) || '';
  const self = lastSegment(originalURL);
  const rows = [['Story Rail'], ['template', 'story'], ...filters, ['limit', '10']];
  if (self) rows.push(['exclude', self]);

  const h2 = document.createElement('h2');
  h2.textContent = headingText;
  const out = [document.createElement('hr'), h2];
  if (subText) {
    const p = document.createElement('p');
    p.textContent = subText;
    out.push(p);
  }
  out.push(WebImporter.DOMUtils.createTable(rows, document));
  out.push(WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { Style: 'dark' },
  }));
  cover.replaceWith(...out);
}

// ---- SKODA-830 (import validity audit F3/F4) ----------------------------------------

// Lightbox / gallery UI the source injects at the end of <body> or around a gallery
// (`.sb-gallery-overlay`: "Gallery overview", "Share gallery" + share links; colorbox's
// own overlay; the "Show more / Show less" togglebox of teaser grids). None of it is
// content; left in, it lands as paragraphs after the related band (audit 4.3, 4.9).
const CHROME_SELECTORS = [
  '.sb-gallery-overlay', '.sb-gallery-lightbox', '.sb-gallery-share', '.sb-gallery-share-dropdown',
  '#colorbox', '#cboxOverlay', '.togglebox-opener',
];

// Media Box section style: the press-release contract (downloads-file-rows, SKODA-510):
// the `media-box` class gives the Downloads block its Media Box look and disclosure.
const MEDIA_BOX_STYLE = 'dark, full-width, media-box';
const MEDIA_BOX_MARKER = 'data-story-media-box';

const squash = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');

// Quiz widget (`.knowledge-test`, audit 4.7): keep each question (heading + image) and its
// answer options as a plain list; drop the hidden JSON config, the checkboxes, the pager
// ("1 / 14"), the navigation buttons and the server-graded result panels.
function flattenQuiz(element) {
  element.querySelectorAll('.knowledge-test').forEach((quiz) => {
    quiz.querySelectorAll([
      '.jsonStruct', '.position', '.next-wrap', '.prev-wrap', '.question-results',
      'button', 'input',
    ].join(', ')).forEach((n) => n.remove());
  });
}

// A data table in the story body (the Epiq spec table, audit 4.6) would become a block
// named after its first cell (`version`, a block-JS 404) and lose its header row. Emit it
// as a Columns block instead (contract spec-table-versions: "resolve to Columns rows"),
// keeping every source row, the header row first. A colspan value is repeated across the
// columns it spans, so each row has the same number of cells.
function tablesToColumns(element, document) {
  const bodies = element.querySelectorAll('.columns > .content, article .content, .entry-content');
  const tables = new Set();
  bodies.forEach((body) => body.querySelectorAll('table').forEach((t) => tables.add(t)));
  tables.forEach((table) => {
    if (table.parentElement && table.parentElement.closest('table')) return;
    const rows = [...table.querySelectorAll(':scope > tbody > tr, :scope > thead > tr, :scope > tr')]
      .map((tr) => {
        const cells = [];
        [...tr.children].filter((c) => /^(td|th)$/i.test(c.tagName)).forEach((c) => {
          const span = Math.max(1, parseInt(c.getAttribute('colspan'), 10) || 1);
          for (let i = 0; i < span; i += 1) {
            const cell = [...(i ? c.cloneNode(true) : c).childNodes];
            cells.push(cell.length ? cell : '');
          }
        });
        return cells;
      })
      .filter((cells) => cells.some((c) => c && c.some((n) => (n.textContent || '').trim() || (n.querySelector && n.querySelector('img')))));
    if (!rows.length) {
      table.remove();
      return;
    }
    const width = Math.max(...rows.map((r) => r.length));
    rows.forEach((r) => { while (r.length < width) r.push(''); });
    table.replaceWith(WebImporter.DOMUtils.createTable([['Columns'], ...rows], document));
  });
}

// "Next up in <series> series" teaser grid below the story body (audit 4.9). The teasers'
// images sit in an empty `a.colorbox` (dropped later) and their titles are truncated by
// the source's dotdotdot script, so rebuild them as Cards (overlay), like the aside's
// "Explore more": [image, <p>date</p><h3><a>title</a></h3>]. The full title is the image's
// alt when the visible one ends in an ellipsis.
function seriesNavCards(element, document) {
  element.querySelectorAll('.series-nav').forEach((nav) => {
    const rows = [['Cards (overlay)']];
    nav.querySelectorAll('article.article-teaser').forEach((card) => {
      const link = card.querySelector('.entry-title a[href]') || card.querySelector('a.link-more[href]');
      const href = link && link.getAttribute('href');
      if (!href) return;
      const img = card.querySelector('img');
      const alt = img ? (img.getAttribute('alt') || '').trim() : '';
      let title = squash(card.querySelector('.entry-title'));
      if (/(…|\.\.\.)$/.test(title) && alt.startsWith(title.replace(/(…|\.\.\.)$/, '').trim())) title = alt;
      title = title || alt;
      if (!title) return;
      if (img) ['data-caption', 'data-video_title', 'data-video_src', 'srcset', 'sizes', 'itemprop'].forEach((a) => img.removeAttribute(a));
      const body = [];
      const date = squash(card.querySelector('.entry-published'));
      if (date) {
        const p = document.createElement('p');
        p.textContent = date;
        body.push(p);
      }
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = title;
      h3.append(a);
      body.push(h3);
      rows.push([img || '', body]);
    });
    const heading = nav.querySelector(':scope > .heading, :scope > h2, :scope > h3');
    const out = [];
    if (heading && squash(heading)) {
      const h3 = document.createElement('h3');
      h3.append(...heading.childNodes);
      out.push(h3);
    }
    if (rows.length > 1) out.push(WebImporter.DOMUtils.createTable(rows, document));
    nav.replaceWith(...out);
  });
}

// Media Box band (`.cover-box.dark > .search-results.media-box`, SKODA-801a, audit 4.1/F4)
// → its own section, as on press releases: `h2` heading, the stats line ("13 images"),
// then the Media Box element itself, which the downloads parser turns into the Downloads
// table between the hooks. The band is unwrapped out of `.cover-box.dark` (still dropped
// below) and opened with a marker <hr>; finishMediaBox() closes it with Section Metadata.
function mediaBoxBand(element, document) {
  element.querySelectorAll('.search-results.media-box').forEach((box) => {
    if (box.closest('.sidebar')) return;
    const band = box.closest('.cover-box') || box;
    const heading = squash(box.querySelector('.search-results-heading')) || 'Media Box';
    const stats = squash(box.querySelector('.search-results-stats .stats, .stats'));
    box.querySelectorAll('.search-results-header, .search-results-stats, .togglebox-opener').forEach((n) => n.remove());
    const hr = document.createElement('hr');
    hr.setAttribute(MEDIA_BOX_MARKER, '');
    const h2 = document.createElement('h2');
    h2.textContent = heading;
    const out = [hr, h2];
    if (stats) {
      const p = document.createElement('p');
      p.textContent = stats;
      out.push(p);
    }
    out.push(box);
    band.replaceWith(...out);
  });
}

const isBlockNamed = (el, re) => el && el.tagName === 'TABLE'
  && re.test(squash(el.querySelector('tr > th, tr > td')));

// Close each Media Box section with its Section Metadata. When the downloads parser found
// no asset (the box unwrapped or is still there), the whole section is dropped and logged,
// so no empty dark band or stray thumbnails are left.
function finishMediaBox(element, document) {
  element.querySelectorAll(`hr[${MEDIA_BOX_MARKER}]`).forEach((hr) => {
    const nodes = [];
    for (let n = hr.nextElementSibling; n && n.tagName !== 'HR'; n = n.nextElementSibling) nodes.push(n);
    hr.removeAttribute(MEDIA_BOX_MARKER);
    if (!nodes.some((n) => isBlockNamed(n, /^downloads\b/i))) {
      console.warn('[story-cleanup] Media Box had no downloadable asset; section dropped');
      [hr, ...nodes].forEach((n) => n.remove());
      return;
    }
    nodes[nodes.length - 1].after(WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style: MEDIA_BOX_STYLE },
    }));
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const doc = element.ownerDocument || document;
    WebImporter.DOMUtils.remove(element, [
      '.btn-group.social',
      '.social-container',
      ...CHROME_SELECTORS,
    ]);
    // First: only source tables exist yet (the Embed/Cards tables below are blocks).
    tablesToColumns(element, doc);
    videosToUrls(element, doc);
    wpVideosToEmbeds(element, doc);
    flattenQuiz(element);
    seriesNavCards(element, doc);
    mediaBoxBand(element, doc);
  }

  if (hookName === TransformHook.afterTransform) {
    // Must run before the removals below (the band's teasers contain a.colorbox) and
    // before skoda-story-aside (it reads the still-present sidebar entry-tags).
    relatedBand(element, element.ownerDocument || document, payload);
    finishMediaBox(element, element.ownerDocument || document);

    // In-body lightbox galleries / audio embeds are the must-keep content this
    // flatten pass does NOT reconstruct (→ SKODA-604 full restore). Remove them
    // from the flattened body so the story is clean linear default content, and
    // LOG the counts so the drop is never silent. The sidebar is intentionally
    // left untouched here — skoda-story-aside rebuilds it. The Media Box is no longer
    // dropped (SKODA-801a: Downloads section above); any `.cover-box.dark` left is a
    // band the importer does not know.
    const deferredSelectors = [
      '.sb-gallery', 'a.colorbox',
      '.embed-controller-wrapper', '.page-embed',
      '.cover-box.dark',
    ];
    const dropped = {};
    deferredSelectors.forEach((sel) => {
      const n = element.querySelectorAll(sel).length;
      if (n) dropped[sel] = n;
    });
    if (Object.keys(dropped).length) {
      console.warn(
        `[story-cleanup] flatten-to-default dropped in-body media (deferred to SKODA-801/814/604): ${JSON.stringify(dropped)}`,
      );
    }
    WebImporter.DOMUtils.remove(element, deferredSelectors);
  }
}
