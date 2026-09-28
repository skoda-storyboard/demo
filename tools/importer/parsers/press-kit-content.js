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
      attachment.replaceWith(p);
    } else if (video && root.contains(video) && !text(video)
      && video.querySelectorAll('iframe').length === 1) {
      video.replaceWith(p);
    } else {
      frame.replaceWith(p);
    }
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
      embedUrls(widget, document);
      widget.querySelectorAll('hr').forEach((rule) => rule.remove());
      return [...widget.childNodes].filter((node) => node.nodeType === 1 || text(node));
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
