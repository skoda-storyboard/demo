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

/*
 * Blocks can't nest in DA: a Quote inside an answer arrives as a plain table whose first row
 * names it ("Quote", "Quote (left)"). Rebuild it as a quote block in its own wrapper, so the
 * answer reads as on the source (the Elroq press kit's toggled pull-quote, SKODA-220). Only a
 * top-level Quote is rebuilt; any other table, and anything inside a table, stays as authored.
 */
const NESTED_QUOTE = /^quote(?:\s*\(([^)]*)\))?$/i;
const className = (value) => value.trim().toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');

function nestedQuotes(panel) {
  const built = [];
  [...panel.querySelectorAll('table')].forEach((table) => {
    if (table.parentElement.closest('table')) return;
    const [head, ...rows] = [...table.rows];
    const match = head?.cells.length === 1 && head.textContent.trim().match(NESTED_QUOTE);
    if (!match || !rows.length) return;
    const quote = document.createElement('div');
    quote.className = ['quote', ...(match[1] || '').split(',').map(className).filter(Boolean)].join(' ');
    rows.forEach((tr) => {
      const row = document.createElement('div');
      [...tr.cells].forEach((td) => {
        const cell = document.createElement('div');
        cell.append(...td.childNodes);
        row.append(cell);
      });
      quote.append(row);
    });
    const wrapper = document.createElement('div');
    wrapper.append(quote);
    table.replaceWith(wrapper);
    built.push(quote);
  });
  if (!built.length) return;
  // The page has aem.js loaded already; importing it lazily keeps the accordion's own module
  // free of it (and loadable without a page window, as in the unit tests).
  import('../../scripts/aem.js').then(({ decorateBlock, loadBlock }) => {
    built.forEach((quote) => {
      // decorateBlock also marks the section `quote-container`: that describes the section's
      // own blocks, which a quote inside an answer isn't
      const section = quote.closest('.section');
      const marked = section?.classList.contains('quote-container');
      decorateBlock(quote);
      if (!marked) section?.classList.remove('quote-container');
      loadBlock(quote);
    });
  }).catch((e) => {
    // eslint-disable-next-line no-console
    console.error('accordion: nested quote not loaded', e);
  });
}

/*
 * `Accordion (faq)` (SKODA-807): the press-kit FAQ chapters also describe their Q/A pairs as
 * schema.org FAQPage structured data, which the source lacks. Every FAQ accordion on the page
 * feeds one JSON-LD script in the head. Its text is set through textContent, a Trusted Types
 * script sink that the page's default policy (scripts.js) passes.
 */
const FAQ_SCRIPT = 'script[type="application/ld+json"][data-accordion-faq]';
// text with a space between block-level parts (paragraphs, list items, table cells and rows,
// line breaks), so `Variant | Range` over `Peaq 90 | 640 km` reads "Variant Range Peaq 90 640 km"
function plain(node) {
  const copy = node.cloneNode(true);
  copy.querySelectorAll(`${BLOCK_LEVEL}, tr, th, td, br`).forEach((el) => el.after(' '));
  return copy.textContent.replace(/\s+/g, ' ').trim();
}
const faqEntries = new Map();
// blocks seen on the page: only these drop out once they leave it (see addFaq)
const mounted = new WeakSet();

function addFaq(block, items) {
  const entries = items.filter((item) => item.matches('.accordion-item')).map((item) => {
    const label = item.querySelector('.accordion-heading button').cloneNode(true);
    label.querySelector('.accordion-icon')?.remove();
    return { question: plain(label), answer: plain(item.querySelector('.accordion-panel')) };
  }).filter(({ question, answer }) => question && answer);
  if (!entries.length) return;
  faqEntries.set(block, entries);
  // A block decorated off the page counts until it's mounted: blocks/fragment decorates a
  // fragment's detached <main> before inserting its children (PR #263 review). A block that was
  // on the page and has left it, or one from another document, drops out.
  [...faqEntries.keys()].forEach((key) => {
    if (key.ownerDocument !== document) faqEntries.delete(key);
    else if (key.isConnected) mounted.add(key);
    else if (mounted.has(key)) faqEntries.delete(key);
  });
  let script = document.head.querySelector(FAQ_SCRIPT);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.accordionFaq = '';
    document.head.append(script);
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [...faqEntries.values()].flat().map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
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
    nestedQuotes(panel);
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
  if (block.classList.contains('faq')) addFaq(block, items);
}
