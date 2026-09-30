/* global WebImporter */
import parseTiles from './press-kit-hub-tiles.js';

const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();

// The clip's name: what titles it on the page, the all-bold paragraph right before it
// (Motorsport Videos: `<p><strong>Škoda 1100 OHC – Footage</strong></p>`) or the heading
// before it (Peaq/Epiq Videos); else its Media Box item ("Footage | Škoda Peaq Covered
// Drive"), whose title is sometimes just the file name.
const boldCaption = (node) => node?.matches('p') && !!text(node)
  && text(node) === [...node.querySelectorAll('strong, b')].map(text).join(' ').trim();
function clipTitle(document, file, attachment) {
  const before = attachment.previousElementSibling;
  if (boldCaption(before)) return text(before);
  let node = before;
  while (node && !node.matches('h1, h2, h3, h4, h5, h6, .media-cart-item')) node = node.previousElementSibling;
  if (node && !node.matches('.media-cart-item') && text(node)) return text(node);
  const item = [...document.querySelectorAll('.search-results-item')]
    .find((el) => [...el.querySelectorAll('a[href]')].some((a) => a.getAttribute('href') === file));
  return text(item?.querySelector('.entry-title'));
}

// The source's Vimeo account is domain-locked, so its player errors on the demo (SKODA-805c
// decision, 2026-09-29): a Vimeo clip that carries its MP4 master plays that natively instead, an
// `Embed` table whose url is the master. Inside an accordion or Columns cell a block can't
// nest, so there it stays the bare provider link.
function videoEmbed(document, file, attachment) {
  const title = clipTitle(document, file, attachment);
  // The link text becomes the player's accessible name (decorateButtons copies it into the
  // link title, which the embed block reads first), so it is the clip title, never the path.
  const link = Object.assign(document.createElement('a'), { href: file, textContent: title || 'Video' });
  const rows = [['Embed'], ['url', link]];
  if (title) rows.push(['title', title]);
  return WebImporter.DOMUtils.createTable(rows, document);
}

function embedUrls(root, document, { nested = false } = {}) {
  root.querySelectorAll('iframe').forEach((frame) => {
    const url = frame.getAttribute('src') || frame.getAttribute('data-src');
    if (!url || !/^https?:\/\//.test(url)) {
      throw new Error('Press-kit article contains an iframe without a provider URL');
    }
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = url;
    a.textContent = url;
    p.append(a);
    const attachment = frame.closest('.media-cart-item.attachment');
    const video = frame.closest('.video-container');
    // The cart toolbar's only text is the "Download" preprocess gives its icon link.
    const bare = attachment?.cloneNode(true);
    bare?.querySelectorAll('.media-cart-actions').forEach((actions) => actions.remove());
    if (attachment && root.contains(attachment) && !text(bare)
      && attachment.querySelectorAll('iframe').length === 1
      && !attachment.querySelector('img, video')) {
      // The cart toolbar's download icon is the only way to the video file (resource "Videos"
      // pages have no Media Box, SKODA-805b): keep it as a labelled link after the embed.
      const file = [...attachment.querySelectorAll('a.media-cart-action.download[href], a[data-action="download"][href]')]
        .map((link) => link.getAttribute('href')).find((href) => /\.mp4(?:[?#]|$)/i.test(href || ''));
      // Only Vimeo is domain-locked; YouTube clips (Motorsport Videos) play and stay embeds.
      const locked = /(^|\.)vimeo\.com$/i.test(new URL(url).hostname);
      const out = [file && locked && !nested ? videoEmbed(document, file, attachment) : p];
      if (file) {
        const dp = document.createElement('p');
        const link = document.createElement('a');
        link.href = file;
        link.textContent = 'Download video';
        dp.append(link);
        out.push(dp);
      }
      attachment.replaceWith(...out);
    } else if (video && root.contains(video) && !text(video)
      && video.querySelectorAll('iframe').length === 1) {
      video.replaceWith(p);
    } else {
      frame.replaceWith(p);
    }
  });
}

// An in-body Storyboard gallery shows five thumbnails of the Media Box set and opens it in a
// lightbox. Keep its lead image and caption and link the "+N" count to the imported Media Box.
function inlineGalleries(root, document) {
  root.querySelectorAll('.sb-gallery').forEach((gallery) => {
    const img = gallery.querySelector('.sb-gallery-image-main img') || gallery.querySelector('img');
    if (!img) throw new Error('Press-kit in-body gallery has no image');
    const nodes = [];
    const figure = document.createElement('p');
    const caption = img.getAttribute('data-caption')?.trim();
    ['data-caption', 'data-video_title', 'data-video_src', 'srcset', 'sizes', 'itemprop']
      .forEach((attr) => img.removeAttribute(attr));
    figure.append(img);
    nodes.push(figure);
    if (caption) nodes.push(Object.assign(document.createElement('p'), { textContent: caption }));
    const more = text(gallery.querySelector('.sb-gallery-show-more'));
    if (more && document.querySelector('.search-results.media-box')) {
      const p = document.createElement('p');
      p.append(Object.assign(document.createElement('a'), { href: '#media-box', textContent: `+${more}` }));
      nodes.push(p);
    }
    gallery.replaceWith(...nodes);
  });
}

function contents(panel, document, { nested: inBlock = false } = {}) {
  const nested = panel.querySelector(':scope > .panel-widget-style .panel-layout, :scope > .panel-layout, .panel-layout');
  // The SiteOrigin grid and answer panels recursively contain one another.
  // eslint-disable-next-line no-use-before-define
  if (nested) return flatten(nested, document, { nested: true });
  const widgets = panel.querySelectorAll('.textwidget');
  if (widgets.length) {
    return [...widgets].flatMap((widget) => {
      // Images resource pages title each gallery group with the widget title.
      const title = text(widget.parentElement?.querySelector(':scope > .widget-title'));
      const heading = title ? [Object.assign(document.createElement('h2'), { textContent: title })] : [];
      embedUrls(widget, document, { nested: inBlock });
      inlineGalleries(widget, document);
      // Stray rules would split the DA section; pull-quote rules are consumed in `preprocess`.
      widget.querySelectorAll('hr').forEach((rule) => rule.remove());
      const items = widget.childNodes;
      return [...heading, ...[...items].filter((node) => node.nodeType === 1 || text(node))];
    });
  }
  // A WordPress video widget holds one cart attachment, as in a text widget (Fabia 130: its
  // Vimeo clip + MP4 master), so the same native-MP4 rule applies.
  if (panel.matches('.widget_media_video')) {
    const holder = panel.querySelector('.media-cart-item.attachment')?.parentElement;
    if (!holder || panel.querySelectorAll('iframe').length !== 1) {
      throw new Error('Press-kit video widget needs one cart attachment with a player');
    }
    embedUrls(holder, document, { nested: inBlock });
    return [...holder.children];
  }
  if (!text(panel) && !panel.querySelector('img, a[href]')) return [];
  throw new Error(`Unsupported press-kit content widget: ${panel.className}`);
}

// The widest authored image that still counts as a banner (the PDF/share banners are 240).
const BANNER_MAX_WIDTH = 400;

// A cell that is only a linked, narrow image: the PDF download and share banners.
function bannerCell(nodes) {
  if (nodes.length !== 1 || text(nodes[0])) return false;
  const imgs = nodes[0].querySelectorAll?.('img') || [];
  const width = Number(imgs[0]?.getAttribute('width'));
  return imgs.length === 1 && !!imgs[0].closest('a[href]')
    && width > 0 && width <= BANNER_MAX_WIDTH;
}

const hasContent = (cell) => text(cell) || cell.querySelector('img, iframe, a[href]');

// A top-level row with 2+ filled cells sits side by side on the source (photo pairs,
// contact cards, the PDF/share banners): one `Columns` row, one cell per source cell, as
// story-flatten does. Banner rows keep their authored 240px width (`Columns (banners)`).
function columnsRow(cells, document) {
  const row = cells.map((cell) => [...cell.children]
    .filter((node) => node.matches('.so-panel'))
    .flatMap((panel) => contents(panel, document, { nested: true })));
  const name = row.every(bannerCell) ? 'Columns (banners)' : 'Columns';
  return WebImporter.DOMUtils.createTable([[name], row], document);
}

function flatten(layout, document, { nested = false } = {}) {
  const output = [];
  let rows = [];
  let tileGrids = [];
  const flush = () => {
    if (rows.length) output.push(WebImporter.DOMUtils.createTable([['Accordion'], ...rows], document));
    rows = [];
  };
  // Consecutive rows of chapter teasers (an older kit landing page in article form, e.g. the
  // second Elroq kit) are one tiles mosaic, as on a hub.
  const flushTiles = () => {
    if (!tileGrids.length) return;
    const holder = document.createElement('div');
    holder.append(...tileGrids);
    output.push(parseTiles(holder, document));
    tileGrids = [];
  };

  [...layout.children].forEach((grid) => {
    if (!grid.matches('.panel-grid')) {
      if (text(grid) || grid.querySelector('img, a[href]')) throw new Error('Unexpected press-kit article grid');
      return;
    }
    const gridPanels = [...grid.querySelectorAll(':scope > .panel-grid-cell > .so-panel')];
    if (!nested && gridPanels.some((panel) => panel.matches('.widget_ys-so-widget-post-teaser'))
      && gridPanels.every((panel) => panel.matches('.widget_ys-so-widget-post-teaser, .widget_skoda-offset'))) {
      flush();
      tileGrids.push(grid);
      return;
    }
    flushTiles();
    const filled = [...grid.children].filter((cell) => cell.matches('.panel-grid-cell') && hasContent(cell));
    // Accordion answers are linear: DA blocks can't nest (accordion contract).
    if (!nested && filled.length > 1
      && !grid.querySelector('.widget_ys-row-toggle, .widget_siteorigin-panels-builder')) {
      flush();
      output.push(columnsRow(filled, document));
      return;
    }
    [...grid.children].forEach((cell) => {
      if (!cell.matches('.panel-grid-cell')) return;
      const panels = [...cell.children].filter((node) => node.matches('.so-panel'));
      panels.forEach((panel, index) => {
        if (panel.matches('.widget_ys-row-toggle')) {
          const heading = panel.querySelector('h1.row-title, h2.row-title, h3.row-title, h4.row-title');
          const answer = panels[index + 1];
          if (!heading || !text(heading) || !answer?.matches('.widget_siteorigin-panels-builder')) {
            throw new Error('Press-kit row toggle requires a heading and immediately paired answer');
          }
          const body = contents(answer, document);
          if (!body.length || !body.some((node) => text(node) || node.querySelector?.('img, a[href]'))) {
            throw new Error(`Press-kit row toggle has an empty answer: ${text(heading)}`);
          }
          rows.push([heading.cloneNode(true), body]);
          return;
        }
        if (panel.matches('.widget_siteorigin-panels-builder')) {
          if (!panels[index - 1]?.matches('.widget_ys-row-toggle')) {
            throw new Error('Unpaired press-kit answer panel');
          }
          return;
        }
        flush();
        output.push(...contents(panel, document, { nested }));
      });
    });
  });
  flush();
  flushTiles();
  return output;
}

export default function parse(element, { document }) {
  const layout = element.querySelector(':scope > .panel-layout');
  if (!layout) throw new Error('Press-kit article is missing SiteOrigin body content');
  const nodes = flatten(layout, document);
  if (!nodes.length) throw new Error('Press-kit article body is empty');
  layout.replaceWith(...nodes);
  element.querySelectorAll('.sa-bnr, .media-cart-actions').forEach((node) => node.remove());
}
