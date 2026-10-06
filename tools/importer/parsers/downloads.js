/* eslint-disable */
/* global WebImporter */
/**
 * Parser: downloads (block name: "Downloads")
 * Source: the press-release Media Box —
 *   .search-results.media-box with a grid of `.search-results-item > article.media-cart-item`
 *   entries (classes `image` / `video` / `pdf`). Each has a 16:9 preview <img> (none for a PDF),
 *   a title (`h3.entry-title a`) and a toolbar with either a download size menu
 *   (`.media-cart-action-multi.download a` → "Original" / "1920px") or a single
 *   `a.media-cart-action.download` (MP4 / PDF).
 * (measured on the 5 M1 releases 2026-09-27; ties to docs/ui-specs/downloads.md, SKODA-502.)
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Everything is derived from the DOM inside the
 * element the Media-Box selector matched. If no download-shaped items are found it
 * unwraps and bails rather than emit an empty block.
 *
 * DA table shape — contract `downloads-file-rows` v1 (SKODA-510), 3 cells per row, the
 * shape blocks/downloads `readAsset` reads (image cell / title text / links cell):
 *   ['Downloads']
 *   [<img> or '', 'Title', [<a>Original</a>, <a>1920px</a>]]   // image
 *   [<img>,       'Title', [<a>MP4</a>]]                          // video (Vimeo poster)
 *   ['',          'Title', [<a>PDF</a>]]                          // document — dropped by the
 *                                                                 // block until SKODA-510 lands
 * Every link is the source `/direct-download/…` URL (skoda-links makes it absolute).
 * The cart hooks (data-id / data-size, SKODA-505) don't survive DA, so none are emitted.
 */

const text = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');

/**
 * An `.mp4` href in its URL-serialised form (non-ASCII and spaces percent-encoded), relative
 * hrefs kept relative. helix-importer rewrites every `.mp4` link in the markdown to
 * `new URL(href).href` AFTER the grid table is laid out, so a raw `4×4` in the filename grows
 * the row by 5 characters per `×`; md2da then can't parse the grid, and the Media Box lands in
 * DA as literal `+---+` text plus a nameless block that ate the next row (SKODA-833, the 4×4
 * release). Serialising first makes that rewrite a no-op. Other links are left as they are.
 */
function serialiseMp4(href) {
  try {
    const url = new URL(href, 'https://www.skoda-storyboard.com');
    if (!/\.mp4$/i.test(url.pathname) || url.href === href) return href;
    if (/^[a-z][a-z\d+.-]*:/i.test(href)) return url.href;
    return href.startsWith('/') && !href.startsWith('//') ? `${url.pathname}${url.search}${url.hash}` : href;
  } catch (e) {
    return href;
  }
}

// Size label for a single-download item: its file type (SKODA-503 keeps binaries as links).
function fileLabel(href) {
  const ext = ((href || '').split(/[?#]/)[0].split('.').pop() || '').toLowerCase();
  if (/^(jpe?g|png|webp|gif|tiff?)$/.test(ext)) return 'Original';
  return ext ? ext.toUpperCase() : 'Download';
}

function sizeLinks(item, document) {
  const links = [];
  const add = (raw, label) => {
    if (!raw || raw === '#') return;
    const href = serialiseMp4(raw);
    if (links.some((l) => l.getAttribute('href') === href)) return;
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = label;
    links.push(a);
  };

  // Image: the download size menu ("Original" / "1920px").
  item.querySelectorAll('.media-cart-action-multi.download a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    add(href, text(a) || fileLabel(href));
  });
  if (links.length) return links;

  // Video / PDF / legacy markup: one download anchor.
  const single = item.querySelector('a.media-cart-action.download[href], a[data-action="download"][href]')
    || item.querySelector('a[href*="direct-download"]');
  if (single) add(single.getAttribute('href'), fileLabel(single.getAttribute('href')));
  return links;
}

export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('article.media-cart-item'));
  if (items.length === 0) {
    items = Array.from(element.querySelectorAll('.search-results-item, .items > .item'));
  }

  // Defensive: nothing download-shaped — unwrap and bail.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Downloads']];

  items.forEach((item) => {
    const links = sizeLinks(item, document);
    if (!links.length) return; // no resolvable asset — skip, never guess

    // Preview: the teaser image (a PDF has none, only a file-type icon).
    const img = item.querySelector('.article-teaser-media img, .entry-thumbnail img, img');
    if (img) {
      // The Vimeo poster only carries a `title` ("Video | …"); keep it as the alt text.
      if (!(img.getAttribute('alt') || '').trim() && img.getAttribute('title')) {
        img.setAttribute('alt', img.getAttribute('title').replace(/^Video\s*\|\s*/i, '').trim());
      }
      // Vimeo posters come extension-less (`…-d_295x166?region=us`), which the media
      // pipeline can't ingest; the CDN serves the same frame as `…-d_1280x720.jpg`.
      const src = img.getAttribute('src') || '';
      if (/^https:\/\/i\.vimeocdn\.com\//.test(src)) {
        img.setAttribute('src', src.replace(/-d_\d+x\d+(\.[a-z]+)?(\?.*)?$/i, '-d_1280x720.jpg'));
      }
      ['data-caption', 'data-video_title', 'data-video_src', 'data-media-url', 'srcset', 'sizes', 'itemprop', 'title']
        .forEach((a) => img.removeAttribute(a));
    }

    const filename = links[0].getAttribute('href').split('/').pop().split(/[?#]/)[0];
    const title = text(item.querySelector('.entry-title'))
      || (img && img.getAttribute('alt'))
      || filename;

    const linkCell = links.map((a) => {
      const p = document.createElement('p');
      p.append(a);
      return p;
    });
    cells.push([img || '', title, linkCell]);
  });

  if (cells.length === 1) {
    element.replaceWith(...element.childNodes);
    return;
  }

  element.replaceWith(WebImporter.DOMUtils.createTable(cells, document));
}
