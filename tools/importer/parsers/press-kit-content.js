/* global WebImporter */

const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();

function embedUrls(root, document) {
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
    if (attachment && root.contains(attachment) && !text(attachment)
      && attachment.querySelectorAll('iframe').length === 1
      && !attachment.querySelector('img, video')) {
      // Videos chapters offer each clip's master file through an icon-only action.
      const master = attachment.querySelector('a.media-cart-action.download[href], a[data-action="download"][href]');
      const href = master?.getAttribute('href');
      if (href && href !== '#') {
        const ext = href.split(/[?#]/)[0].split('.').pop().toUpperCase();
        const download = document.createElement('p');
        const link = document.createElement('a');
        link.href = href;
        link.textContent = /^(MP4|MOV|PDF|ZIP)$/.test(ext) ? `Download ${ext}` : 'Download';
        download.append(link);
        attachment.replaceWith(p, download);
      } else {
        attachment.replaceWith(p);
      }
    } else if (video && root.contains(video) && !text(video)
      && video.querySelectorAll('iframe').length === 1) {
      video.replaceWith(p);
    } else {
      frame.replaceWith(p);
    }
  });
}

// A data table (a header row plus label/value rows, e.g. the Peaq FAQ's variant specs) cannot
// sit in an Accordion cell as a nested block, so each value column becomes a labelled list:
// "**Peaq 60**" then "Range: Over 450 km", keeping every value tied to its row and column.
function dataTable(table, document) {
  const rows = [...table.querySelectorAll('tr')].map((row) => [...row.children]);
  const width = rows[0].length;
  if (width < 2 || rows.some((cells) => cells.length !== width
    || cells.some((cell) => cell.hasAttribute('colspan') || cell.hasAttribute('rowspan')))) {
    throw new Error(`Unsupported press-kit data table: ${text(table).slice(0, 60)}`);
  }
  const [header, ...body] = rows;
  return header.slice(1).flatMap((column, index) => {
    const title = document.createElement('p');
    title.append(Object.assign(document.createElement('strong'), { textContent: text(column) }));
    const list = document.createElement('ul');
    body.forEach((cells) => {
      const value = cells[index + 1];
      if (!text(value)) return;
      const item = document.createElement('li');
      item.append(`${text(cells[0])}: `, ...value.childNodes);
      list.append(item);
    });
    return [title, list];
  });
}

// SiteOrigin editors mostly use <table> for layout (WhatsApp banner, "Find out more", the Texts
// chapter list). DA would read a table as a block, so each non-empty cell becomes content.
// The WhatsApp icon is a decorative 512px PNG sized by a width attribute DA drops; the channel
// link text beside it carries the message.
function unwrapTables(root, document) {
  root.querySelectorAll('table').forEach((layout) => {
    const labelled = [...layout.querySelectorAll('tr')]
      .filter((row) => [...row.children].filter((cell) => text(cell)).length >= 2);
    if (labelled.length >= 2) {
      layout.replaceWith(...dataTable(layout, document));
      return;
    }
    layout.querySelectorAll('img[src*="whatsapp"]').forEach((img) => {
      const link = img.closest('a');
      (link && !text(link) ? link : img).remove();
    });
    const nodes = [...layout.querySelectorAll('td, th')].flatMap((cell) => {
      if (!text(cell) && !cell.querySelector('img, a[href]')) return [];
      if (cell.querySelector('p, ul, ol, h1, h2, h3, h4, h5, h6, div')) return [...cell.childNodes];
      const p = document.createElement('p');
      p.append(...cell.childNodes);
      return [p];
    });
    layout.replaceWith(...nodes);
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

function contents(panel, document) {
  const nested = panel.querySelector(':scope > .panel-widget-style .panel-layout, :scope > .panel-layout, .panel-layout');
  // The SiteOrigin grid and answer panels recursively contain one another.
  // eslint-disable-next-line no-use-before-define
  if (nested) return flatten(nested, document);
  const widgets = panel.querySelectorAll('.textwidget');
  if (widgets.length) {
    return [...widgets].flatMap((widget) => {
      // Images resource pages title each gallery group with the widget title.
      const title = text(widget.parentElement?.querySelector(':scope > .widget-title'));
      const heading = title ? [Object.assign(document.createElement('h2'), { textContent: title })] : [];
      embedUrls(widget, document);
      inlineGalleries(widget, document);
      unwrapTables(widget, document);
      widget.querySelectorAll('hr').forEach((rule) => rule.remove());
      const items = widget.childNodes;
      return [...heading, ...[...items].filter((node) => node.nodeType === 1 || text(node))];
    });
  }
  if (!text(panel) && !panel.querySelector('img, a[href]')) return [];
  throw new Error(`Unsupported press-kit content widget: ${panel.className}`);
}

function flatten(layout, document) {
  const output = [];
  let rows = [];
  const flush = () => {
    if (rows.length) output.push(WebImporter.DOMUtils.createTable([['Accordion'], ...rows], document));
    rows = [];
  };

  [...layout.children].forEach((grid) => {
    if (!grid.matches('.panel-grid')) {
      if (text(grid) || grid.querySelector('img, a[href]')) throw new Error('Unexpected press-kit article grid');
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
        output.push(...contents(panel, document));
      });
    });
  });
  flush();
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
