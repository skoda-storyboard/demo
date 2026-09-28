let nextId = 0;

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const BLOCK_LEVEL = `p, div, ul, ol, li, blockquote, figure, table, ${HEADINGS}`;

/** Flatten block-level wrappers so only phrasing content goes into the <button>. */
function phrasing(nodes) {
  return nodes.flatMap((node, i) => {
    if (node.nodeType !== 1 || !node.matches(BLOCK_LEVEL)) return [node];
    const inner = phrasing([...node.childNodes]);
    return i ? [document.createTextNode(' '), ...inner] : inner;
  });
}

export default function decorate(block) {
  const items = [];
  [...block.children].forEach((row) => {
    const [summary, answer] = row.children;
    if (!summary || !answer || !summary.textContent.trim()
      || (!answer.textContent.trim() && !answer.querySelector('img, picture, iframe, a[href]'))) {
      // Keep incomplete authored rows readable rather than silently discarding them.
      items.push(row);
      return;
    }

    nextId += 1;
    const sourceHeading = summary.querySelector(HEADINGS);
    // Keep the authored level; an h1 would compete with the page title, so it becomes h2.
    const level = sourceHeading?.tagName.toLowerCase().replace('h1', 'h2') || 'h3';
    const heading = document.createElement(level);
    heading.className = 'accordion-heading';
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `accordion-trigger-${nextId}`;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `accordion-panel-${nextId}`);
    const label = sourceHeading ? [...sourceHeading.childNodes] : [...summary.childNodes];
    button.append(...phrasing(label));
    // Summary content beside the heading (e.g. a teaser line) stays readable in the panel.
    sourceHeading?.remove();
    const extra = sourceHeading ? [...summary.childNodes].filter((node) => node.textContent.trim()
      || node.querySelector?.('img, picture, a[href]')) : [];
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);
    heading.append(button);

    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.id = `accordion-panel-${nextId}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', button.id);
    panel.hidden = true;
    panel.append(...extra, ...answer.childNodes);
    button.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
    });
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.append(heading, panel);
    items.push(item);
  });
  block.replaceChildren(...items);
}
