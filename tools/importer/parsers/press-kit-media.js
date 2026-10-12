/* global WebImporter */

const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();

// the tile's source date ("23. 3. 2026"), or '' when it isn't one
const SOURCE_DATE = /^\d{1,2}\.\s?\d{1,2}\.\s?\d{4}$/;
export const tileDate = (item) => {
  const date = text(item.querySelector('.entry-meta .entry-published, .entry-published'));
  return SOURCE_DATE.test(date) ? date : '';
};

function downloads(item, document) {
  const candidates = [...item.querySelectorAll('.media-cart-action-multi.download a[href]')];
  if (!candidates.length) {
    const single = item.querySelector('a.media-cart-action.download[href], a[data-action="download"][href]')
      || item.querySelector('a[href*="direct-download"]');
    if (single) candidates.push(single);
  }
  const seen = new Set();
  return candidates.flatMap((a) => {
    const href = a.getAttribute('href');
    if (!href || href === '#' || seen.has(href)) return [];
    seen.add(href);
    const ext = href.split(/[?#]/)[0].split('.').pop().toUpperCase();
    const label = text(a) && text(a) !== 'Download' ? text(a) : ext;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    return [link];
  });
}

// Regulatory consumption / CO₂ text (WLTP), as on stories (SKODA-830 D5): a WLTP mention, or a
// consumption figure together with a CO₂ figure. Plain lightbox captions don't match.
const REGULATORY = /\bWLTP\b|(?=.*\b\d[\d.,\s–-]*(?:kWh|l)\s*\/\s*100\s*km)(?=.*(?:CO[₂2]|g\s*\/\s*km))/i;

export default function parse(element, { document }) {
  // An Images-child gallery shows the regulatory disclaimer only in each image's lightbox
  // (`data-caption`); the user decided it stays visible (SKODA-837 / 830 D5). It repeats on
  // nearly every image, so each distinct text is kept once, as a note under its group.
  const gallery = element.matches('.search-results-gallery');
  const notes = gallery ? [...new Set([...element.querySelectorAll('.article-teaser-media img[data-caption]')]
    .map((img) => text(Object.assign(document.createElement('div'), { innerHTML: img.getAttribute('data-caption') })))
    .filter((caption) => caption && REGULATORY.test(caption)))] : [];
  const items = [...element.querySelectorAll('.search-results-item')];
  if (!items.length) throw new Error('Press-kit Media Box has no assets');
  const expected = Number(element.dataset.expectedAssets);
  if (expected && items.length !== expected) {
    throw new Error(`Press-kit Media Box expected ${expected} assets, found ${items.length}`);
  }
  // One Downloads table in source order (contract `downloads-file-rows`: [<picture> or empty,
  // (date,) title, links]). File-only assets (PDF, MP4 without a poster) keep an empty picture
  // cell, which the Downloads block renders as a file tile (SKODA-510). Used for the Media Box and
  // for the inline asset grids of resource "Images" children (SKODA-805b). A Media Box tile keeps
  // its source date in a cell before the title (#275); the gallery tiles show none.
  const rows = [];
  items.forEach((wrapper) => {
    const item = wrapper.querySelector('article.media-cart-item');
    if (!item) throw new Error('Malformed press-kit Media Box asset');
    const links = downloads(item, document);
    if (!links.length) throw new Error(`Press-kit asset has no download URL: ${text(item.querySelector('.entry-title'))}`);
    const img = item.querySelector('.article-teaser-media img');
    const title = text(item.querySelector('.entry-title')) || img?.getAttribute('alt') || '';
    if (!title) throw new Error('Press-kit Media Box asset has no title');
    const paragraphs = links.map((link) => {
      const p = document.createElement('p');
      p.append(link);
      return p;
    });
    const date = gallery ? '' : tileDate(item);
    const named = date ? [date, title] : [title];
    if (!img) {
      rows.push(['', ...named, paragraphs]);
      return;
    }
    if (!img.getAttribute('alt')?.trim()) img.alt = img.getAttribute('title')?.replace(/^Video\s*\|\s*/i, '') || title;
    const src = img.getAttribute('src') || '';
    if (/^https:\/\/i\.vimeocdn\.com\//.test(src)) {
      img.src = src.replace(/-d_\d+x\d+(\.[a-z]+)?(\?.*)?$/i, '-d_1280x720.jpg');
    }
    ['data-caption', 'data-video_title', 'data-video_src', 'srcset', 'sizes', 'itemprop', 'title']
      .forEach((attr) => img.removeAttribute(attr));
    rows.push([img, ...named, paragraphs]);
  });
  // A gallery group sits in the article column, where the Downloads block would show every tile;
  // the source's togglebox shows two rows first, which is the block's `collapse auto` (SKODA-510).
  // It is `Downloads (gallery)`: the Images-chapter tile, grid and group pills (SKODA-806); without
  // the variant it still reads as a collapsed Downloads grid. A gallery group's regulatory notes
  // follow the table (SKODA-837).
  const config = gallery ? [['collapse', 'auto']] : [];
  const name = gallery ? 'Downloads (gallery)' : 'Downloads';
  const table = WebImporter.DOMUtils.createTable([[name], ...config, ...rows], document);
  element.replaceWith(table, ...notes.map((note) => Object.assign(document.createElement('p'), { textContent: note })));
}
