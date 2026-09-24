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

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      '.btn-group.social',
      '.social-container',
    ]);
    videosToUrls(element, element.ownerDocument || document);
  }

  if (hookName === TransformHook.afterTransform) {
    // Must run before the removals below (the band's teasers contain a.colorbox) and
    // before skoda-story-aside (it reads the still-present sidebar entry-tags).
    relatedBand(element, element.ownerDocument || document, payload);

    // In-body galleries / embeds / Media Box are the must-keep content this
    // flatten pass does NOT reconstruct (→ SKODA-604 full restore). Remove them
    // from the flattened body so the story is clean linear default content, and
    // LOG the counts so the drop is never silent. The sidebar is intentionally
    // left untouched here — skoda-story-aside rebuilds it. The remaining
    // `.cover-box.dark` is the Media Box band (the related band was rebuilt above).
    const deferredSelectors = [
      '.search-results.media-box', '.sb-gallery', 'a.colorbox',
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
