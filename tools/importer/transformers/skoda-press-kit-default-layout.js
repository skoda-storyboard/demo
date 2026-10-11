/* global WebImporter */

const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();
const marker = (document, style) => {
  const hr = document.createElement('hr');
  hr.dataset.pressKitSection = style;
  return hr;
};
const make = (document, tag, value) => {
  const node = document.createElement(tag);
  node.textContent = value;
  return node;
};

function chapters(document) {
  const source = document.querySelector('.chapter-nav');
  if (!source) return null;
  const links = [
    source.querySelector('.chapter-nav-header .link-intro[href]'),
    ...source.querySelectorAll('.chapter-nav-body a[href]'),
  ].filter((a) => a && a.getAttribute('href') !== '#');
  if (!links.length) throw new Error('Press-kit Chapters navigation has no destinations');
  const list = document.createElement('ul');
  list.id = 'chapters-links';
  const chaptersLink = document.createElement('a');
  chaptersLink.href = '#chapters-links';
  chaptersLink.textContent = text(source.querySelector('.link-chapters')) || 'Chapters';
  const chaptersItem = document.createElement('li');
  chaptersItem.append(chaptersLink);
  list.append(chaptersItem);
  links.forEach((sourceLink) => {
    const link = document.createElement('a');
    link.href = sourceLink.getAttribute('href');
    // The source labels the hub link "Introduction", like the first chapter; use its title.
    link.textContent = (sourceLink.matches('.link-intro') && sourceLink.getAttribute('title')?.trim())
      || text(sourceLink);
    const li = document.createElement('li');
    li.append(link);
    list.append(li);
  });
  return list;
}

function sidebar(document, secondary, mediaBox) {
  if (!secondary) return [];
  const nodes = [];
  [...secondary.querySelectorAll(':scope > section')].forEach((section) => {
    if (section.matches('.newsletter-subscribe-widget, .side-banner')) return;
    const heading = section.querySelector('h2, h3');
    const label = text(heading);
    if (section.matches('.images.sa-media-kit-preview')) {
      if (heading) heading.remove();
      nodes.push(make(document, 'h3', label || 'Images'), section);
      const more = section.querySelector('a.more');
      if (mediaBox && more && text(more)) {
        const link = document.createElement('a');
        link.href = '#media-box';
        link.textContent = text(more);
        const p = document.createElement('p');
        p.append(link);
        nodes.push(p);
      }
    } else if (section.matches('.tags')) {
      if (heading) heading.remove();
      nodes.push(make(document, 'h3', label || 'Tags'), section);
    } else if (section.querySelector('ul.menu')) {
      const ul = document.createElement('ul');
      section.querySelectorAll('ul.menu > li').forEach((li) => {
        const a = li.querySelector('a[href]:not([href="#"])');
        // helix-importer unwraps classless spans before transform: "Download Media Box" is then
        // the item's own text beside its icon-only cart action.
        const title = text(a) || text(li);
        if (!title || (!a && !mediaBox)) return;
        const link = document.createElement('a');
        link.href = a?.getAttribute('href') || '#media-box';
        link.textContent = title;
        const entry = document.createElement('li');
        entry.append(link);
        ul.append(entry);
      });
      if (ul.children.length) nodes.push(make(document, 'h3', label || 'Additional info'), ul);
    }
  });
  return nodes;
}

/*
 * Source <table>s in the body would become unknown blocks (a table's first cell is read as
 * the block name). Resolve them to default content, as the pinned contracts do for spec
 * tables: a one-column layout table (the resource "Texts" chapter-PDF list) becomes its
 * header as a heading plus a list; a data table (e.g. the FAQ model table, which sits inside
 * an accordion answer, where no block may nest) becomes one text line per row.
 * Any other multi-column table is layout (the Enyaq RS Race "130 years" banner): its cells
 * become content, keeping their links and images.
 */

// The widest authored image that still reads as an icon (the WhatsApp callout's is 50).
const ICON_MAX_WIDTH = 60;

// A one-row [small image | text] layout table is an icon callout (the chapters' "What's up,
// Škoda?" WhatsApp row: a 512px PNG shown at 50px beside the channel link). DA drops the width
// attribute, so it becomes `Columns (callout)`, which keeps the icon at its authored size
// (SKODA-805c review; SKODA-805b dropped the icon, which cost the row its 50px height).
function iconCallout(table, document) {
  const rows = [...table.rows];
  const cells = rows.length === 1 ? [...rows[0].cells] : [];
  if (cells.length !== 2 || text(cells[0])) return null;
  const imgs = cells[0].querySelectorAll('img');
  const width = Number(imgs[0]?.getAttribute('width'));
  if (imgs.length !== 1 || !(width > 0 && width <= ICON_MAX_WIDTH) || !text(cells[1])) return null;
  const icon = make(document, 'p', '');
  icon.append(cells[0].querySelector('a:has(img)') || imgs[0]);
  const body = make(document, 'p', '');
  body.append(...cells[1].childNodes);
  return WebImporter.DOMUtils.createTable([['Columns (callout)'], [[icon], [body]]], document);
}

function layoutTable(table, document) {
  const callout = iconCallout(table, document);
  if (callout) return [callout];
  // Outside that callout a WhatsApp image is a 512px PNG sized only by an attribute DA drops,
  // and the channel link beside it carries the message (SKODA-805b, PR #202).
  table.querySelectorAll('img[src*="whatsapp"]').forEach((img) => {
    const link = img.closest('a');
    (link && !text(link) ? link : img).remove();
  });
  return [...table.querySelectorAll('td, th')].flatMap((cell) => {
    if (!text(cell) && !cell.querySelector('img, a[href]')) return [];
    if (cell.querySelector('p, ul, ol, h1, h2, h3, h4, h5, h6, div')) return [...cell.childNodes];
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    return [p];
  });
}

function sourceTables(content, document) {
  content.querySelectorAll('table').forEach((table) => {
    const rows = [...table.rows].filter((row) => text(row) || row.querySelector('a[href], img'));
    if (!rows.length) { table.remove(); return; }
    const cols = Math.max(...rows.map((row) => row.cells.length));
    // A data table has a header row plus label/value rows: two or more rows with 2+ text cells.
    const labelled = rows.filter((row) => [...row.cells].filter((cell) => text(cell)).length >= 2);
    if (cols > 1 && labelled.length < 2) {
      table.replaceWith(...layoutTable(table, document));
      return;
    }
    const out = [];
    if (cols === 1) {
      const [first, ...rest] = rows;
      const headed = !first.querySelector('a[href], img') && rest.length;
      if (headed) out.push(make(document, 'h3', text(first)));
      const list = document.createElement('ul');
      (headed ? rest : rows).forEach((row) => {
        const li = document.createElement('li');
        li.append(...row.cells[0].childNodes);
        list.append(li);
      });
      out.push(list);
    } else {
      const [head, ...body] = rows;
      const labels = [...head.cells].map((cell) => text(cell));
      const list = document.createElement('ul');
      body.forEach((row) => {
        const cells = [...row.cells];
        const li = document.createElement('li');
        const strong = make(document, 'strong', text(cells[0]));
        const values = cells.slice(1).map((cell, i) => [labels[i + 1], text(cell)].filter(Boolean).join(': '));
        li.append(strong, `: ${values.join(' · ')}`);
        list.append(li);
      });
      if (labels[0]) out.push(make(document, 'p', labels[0]));
      out.push(list);
    }
    table.replaceWith(...out);
  });
}

function rebuild(element, document) {
  if (!/\bpress_kit-template-default\b/.test(document.body.className)) {
    throw new Error('Not a default press-kit article (body class missing)');
  }
  const article = [...element.querySelectorAll('article.press_kit')]
    .find((node) => node.querySelector('.column-primary'));
  if (!article) throw new Error('Default press-kit article has no primary column');
  const h1 = article.querySelector('.container > header h1');
  const content = article.querySelector('.column-primary .entry-content');
  // Chapter articles end in a Media Box; resource children (Texts, FAQ, Infographics,
  // Technical data, Images, Videos; SKODA-805b) carry their media in the body instead.
  const media = article.querySelector('.search-results.media-box');
  if (!h1 || !text(h1) || !content?.querySelector(':scope > .panel-layout')) {
    throw new Error('Default press-kit article requires a title and body');
  }
  sourceTables(content, document);
  const out = [];
  const date = text(article.querySelector('.container > header .entry-published'));
  if (date) out.push(make(document, 'p', date));
  const title = h1.cloneNode(true);
  title.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  out.push(title);

  const chapterLinks = chapters(document);
  if (chapterLinks) out.push(marker(document, 'press-kit-chapters'), chapterLinks);

  out.push(marker(document, 'body-column'));
  // The article's own teaser (`.column-primary > .article-teaser`), not a gallery tile: on the
  // Images children every Media Box tile is an `article.article-teaser` inside `.search-results`,
  // so the first one used to be copied above the first section as a stray lead (SKODA-837).
  const lead = [...article.querySelectorAll('.column-primary .article-teaser-media img')]
    .find((img) => !img.closest('.search-results'));
  if (lead) {
    const img = lead.cloneNode(true);
    img.alt = (img.alt || '').replace(/<br\s*\/?>/gi, ' ');
    ['data-caption', 'data-video_title', 'data-video_src', 'srcset', 'sizes', 'itemprop']
      .forEach((attr) => img.removeAttribute(attr));
    const p = document.createElement('p');
    p.append(img);
    out.push(p);
  }
  // An article-form kit landing page (the second Elroq kit) introduces itself in the teaser
  // summary, as a press release does: one bold paragraph, as the release importer emits it.
  const summary = text(article.querySelector('.column-primary > .entry-summary'));
  if (summary) {
    const intro = make(document, 'p', '');
    intro.append(make(document, 'strong', summary));
    out.push(intro);
  }
  out.push(content);
  const side = sidebar(document, article.querySelector('.column-secondary'), !!media);
  if (side.length) out.push(marker(document, 'sidebar'), ...side);
  if (media) {
    const heading = text(media.querySelector('.search-results-heading')) || 'Media Box';
    const stats = text(media.querySelector('.search-results-stats .stats'));
    const totals = [...stats.matchAll(/\b(\d+)\s+(?:images?|videos?|PDFs?)\b/gi)];
    if (totals.length) {
      media.dataset.expectedAssets = totals.reduce((sum, match) => sum + Number(match[1]), 0);
    }
    out.push(marker(document, 'media-box, dark, full-width'), make(document, 'h2', heading));
    if (stats) out.push(make(document, 'p', stats));
    media.querySelectorAll('.search-results-header, .search-results-stats, .togglebox-opener')
      .forEach((node) => node.remove());
    out.push(media);
  }
  article.replaceChildren(...out);
  // No source site chrome or orphaned gallery/media cards outside the article.
  element.replaceChildren(article);
}

// The source's "download"/"share" button images carry placeholder alts (`download-de`,
// `share-de`, even on English pages) and the links have no text. Name the link (`title`, which
// survives DA; the SKODA-503 binary gate reads it) and the image by what the link does; an
// image-only link with a real alt is named by that alt.
// Older kits alt their banners with the upload file name (`ikony_sb_landscape_WA_EN_f66c79bf`).
const PLACEHOLDER_ALT = /^(?:(?:download|share)-[a-z]{2}|ikon[ay]_\S*_[0-9a-f]{8})$/i;
function bannerLabel(href) {
  if (/\.pdf(?:$|[?#])/i.test(href)) return 'Download PDF';
  // Named as on the kit hubs (import-press-kit-hub.js).
  if (/\.zip(?:$|[?#])/i.test(href)) return 'Download the press kit ZIP';
  if (/whatsapp/i.test(href)) return 'Follow Škoda Storyboard on WhatsApp';
  if (/\.mp4(?:$|[?#])/i.test(href)) return 'Download video';
  if (/^mailto:\?/i.test(href)) return 'Share by email';
  return '';
}
function labelImageLinks(article) {
  article.querySelectorAll('a[href]').forEach((a) => {
    const img = a.querySelector('img');
    if (!img || text(a) || a.title) return;
    const alt = (img.getAttribute('alt') || '').trim();
    if (alt && !PLACEHOLDER_ALT.test(alt)) {
      a.title = alt;
      return;
    }
    const href = a.getAttribute('href');
    const label = bannerLabel(href);
    if (!label) {
      if (/\.(?:pdf|mp4)(?:$|[?#])/i.test(href)) {
        throw new Error(`Press-kit PDF/MP4 link has no accessible name: ${href}`);
      }
      return;
    }
    img.alt = label;
    a.title = label;
  });
}

// The source mistypes some PDF links as `.pdff` (the Peaq five-seat infographic, the Felicia
// Kit Car chapter); that URL 404s, while the same path ending `.pdf` is the published PDF
// (SKODA-837). Fixed before the links are named, so they read "Download PDF" and the media
// step resolves them to their AEM Assets originals.
function fixPdfTypos(article) {
  article.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (/\.pdff(?=$|[?#])/i.test(href)) a.setAttribute('href', href.replace(/\.pdff(?=$|[?#])/i, '.pdf'));
  });
}

function finish(element, document) {
  const article = element.querySelector('article.press_kit');
  if (article) {
    fixPdfTypos(article);
    labelImageLinks(article);
  }
  const sidebarStart = article?.querySelector('hr[data-press-kit-section="sidebar"]');
  if (sidebarStart) {
    let node = sidebarStart.nextElementSibling;
    while (node && !node.matches('hr[data-press-kit-section]')) {
      const first = node.matches('table') && node.querySelector('tr > td, tr > th');
      if (first && text(first) === 'Gallery') first.textContent = 'Gallery (preview)';
      node = node.nextElementSibling;
    }
  }
  article?.querySelectorAll('hr[data-press-kit-section]').forEach((hr) => {
    const style = hr.dataset.pressKitSection;
    let node = hr.nextElementSibling;
    let last = hr;
    while (node && !node.matches('hr[data-press-kit-section]')) {
      last = node;
      node = node.nextElementSibling;
    }
    last.after(WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style },
    }));
    hr.removeAttribute('data-press-kit-section');
  });
  article?.querySelectorAll('a[href=""], a:not([href])').forEach((a) => a.replaceWith(...a.childNodes));
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') rebuild(element, payload.document);
  if (hookName === 'afterTransform') finish(element, payload.document);
}
