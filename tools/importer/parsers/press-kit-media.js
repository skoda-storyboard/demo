/* global WebImporter */

const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();

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

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.search-results-item')];
  if (!items.length) throw new Error('Press-kit Media Box has no assets');
  const expected = Number(element.dataset.expectedAssets);
  if (expected && items.length !== expected) {
    throw new Error(`Press-kit Media Box expected ${expected} assets, found ${items.length}`);
  }
  const output = [];
  let rows = [];
  let files = [];
  const flush = () => {
    if (rows.length) output.push(WebImporter.DOMUtils.createTable([['Downloads'], ...rows], document));
    if (files.length) {
      const list = document.createElement('ul');
      list.className = 'press-kit-files';
      list.append(...files);
      output.push(list);
    }
    rows = [];
    files = [];
  };
  items.forEach((wrapper) => {
    const item = wrapper.querySelector('article.media-cart-item');
    if (!item) throw new Error('Malformed press-kit Media Box asset');
    const links = downloads(item, document);
    if (!links.length) throw new Error(`Press-kit asset has no download URL: ${text(item.querySelector('.entry-title'))}`);
    const img = item.querySelector('.article-teaser-media img');
    const title = text(item.querySelector('.entry-title')) || img?.getAttribute('alt') || '';
    if (!title) throw new Error('Press-kit Media Box asset has no title');
    if (!img) {
      if (rows.length) flush();
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = title;
      li.append(strong, ' — ');
      links.forEach((link, index) => {
        if (index) li.append(' · ');
        li.append(link);
      });
      files.push(li);
      return;
    }
    if (files.length) flush();
    if (!img.getAttribute('alt')?.trim()) img.alt = img.getAttribute('title')?.replace(/^Video\s*\|\s*/i, '') || title;
    const src = img.getAttribute('src') || '';
    if (/^https:\/\/i\.vimeocdn\.com\//.test(src)) {
      img.src = src.replace(/-d_\d+x\d+(\.[a-z]+)?(\?.*)?$/i, '-d_1280x720.jpg');
    }
    ['data-caption', 'data-video_title', 'data-video_src', 'srcset', 'sizes', 'itemprop', 'title']
      .forEach((attr) => img.removeAttribute(attr));
    const paragraphs = links.map((link) => {
      const p = document.createElement('p');
      p.append(link);
      return p;
    });
    rows.push([img, title, paragraphs]);
  });
  flush();
  element.replaceWith(...output);
}
