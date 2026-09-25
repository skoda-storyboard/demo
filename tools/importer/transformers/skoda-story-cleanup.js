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

// Curated Story Rail rows from the band's teasers: [image, date <p> + <h3><a>title</a></h3>].
// The carousel's card-teaser detects the date paragraph and renders the dated overlay card.
function curatedRows(band, document) {
  const matched = [...band.querySelectorAll('article.article-teaser, .search-results-item')];
  const teasers = matched.filter((el) => !matched.some((o) => o !== el && o.contains(el)));
  const rows = [];
  teasers.forEach((t) => {
    const titleLink = t.querySelector('.entry-title a[href], h3 a[href], a.link-more[href]');
    if (!titleLink) return;
    let title = (t.querySelector('.entry-title') || titleLink).textContent.trim();
    if (!title) return;
    // The source clamps titles client-side (data-dotdotdot → "… reasons to…"); the image
    // alt carries the full title, so restore it when the visible text is a truncation.
    const img = t.querySelector('img');
    const alt = img ? (img.getAttribute('alt') || '').trim() : '';
    const stem = title.replace(/\s*(…|\.\.\.)$/, '');
    if (stem !== title && alt.startsWith(stem)) title = alt;
    const body = [];
    const date = t.querySelector('.entry-published, time');
    if (date && date.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = date.textContent.trim();
      body.push(p);
    }
    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.setAttribute('href', titleLink.getAttribute('href'));
    a.textContent = title;
    h3.appendChild(a);
    body.push(h3);
    rows.push([img || '', body]);
  });
  return rows;
}

// Rebuild the full-width bottom "Related Stories" band (SKODA-820). It is NOT a duplicate
// of the sidebar "Explore more" (3 hand-picked vs 10 tag-matched stories). Emit it as its
// own `Style: dark` section: the heading + "Based on tags" subheading as default content,
// then a Story Rail (SKODA-212). The rail is CURATED from the band's teasers: the source list
// is ranked server-side by tag relevance, which the index rail's any-tag filter can't
// reproduce, and the related stories may not be in the index yet. With no teasers, fall
// back to an index-driven rail scoped to this story's tags, excluding the story itself.
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

  let rows = curatedRows(band, document);
  if (rows.length) {
    rows = [['Story Rail'], ...rows];
  } else {
    // Index fallback. Tag slugs from the sidebar tag row (/en/tag/<taxonomy>/<slug>/), the
    // same anchors the metadata transformer turns into `tags`; else the subheading's list.
    // Story Rail ORs the values within `tags` (listing-logic filterRows), so a year tag
    // (/en/tag/years/2026/) would match every story of that year: drop year tags whenever
    // a more specific tag (model, topic) exists.
    const tagLinks = [...element.querySelectorAll('ol.entry-tags a[href], .sidebar .tags a[href]')]
      .map((a) => a.getAttribute('href') || '');
    const specific = tagLinks.filter((h) => !/\/tag\/years\//.test(h));
    const slugs = (specific.length ? specific : tagLinks)
      .map((h) => lastSegment(h).toLowerCase())
      .filter((s, i, arr) => s && arr.indexOf(s) === i);
    if (!slugs.length && subText) {
      subText.replace(/^[^:]*:/, '').split(',').map((s) => s.trim().toLowerCase())
        .filter(Boolean).forEach((s) => slugs.push(s));
    }
    if (!slugs.length) {
      console.warn('[story-cleanup] related band has no teasers and no tags; dropped');
      cover.remove();
      return;
    }
    const originalURL = (payload && payload.params && payload.params.originalURL) || '';
    const self = lastSegment(originalURL);
    rows = [
      ['Story Rail'],
      ['template', 'story'],
      ['tags', slugs.join(', ')],
      ['limit', '10'],
    ];
    if (self) rows.push(['exclude', self]);
  }

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
