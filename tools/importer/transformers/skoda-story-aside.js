/* eslint-disable */
/* global WebImporter */
/**
 * Transformer: Škoda story-detail aside (secondary column) → styled section.
 * Ticket: SKODA-801. Render target: docs/ui-specs/story-detail.md §2/§3 (the
 * `.columns > .content (66.66%) + .sidebar (33.33%)` two-column shell).
 *
 * REPLACES the old flatten-to-default behaviour that DROPPED `.sidebar`. Instead of
 * discarding the secondary column, we emit it as its OWN section carrying editorial
 * content, so the grid-on-main layout (styles.css, scoped to body.story) can place it
 * beside the body:
 *   .related  ("Explore more", 3 .article-teaser)  → Cards block
 *   section.tags (ol.entry-tags)                    → Tags block
 *   .newsletter-subscribe-widget / .side-banner     → DROPPED (JS-service / external
 *       widgets with no static content; not editorial body — chrome, per story-detail
 *       §2 and SKODA-604/D7).
 * A Section Metadata block (Style: sidebar) is emitted so the section is tagged; the
 * story-scoped runtime hook (scripts.js) turns that into a `.sidebar` class because
 * the vendored decorateSections does NOT process Section Metadata (verified in-browser
 * 2026-09-24 — the standard boilerplate step is absent from scripts/aem.js).
 *
 * ⚠️ ORDERING (unchanged constraint): `.sidebar` holds `ol.entry-tags`, the tag links
 * the shared skoda-metadata.js transformer derives `tags`/facets from. This transformer
 * MUST run in afterTransform AND be registered AFTER skoda-metadata.js so the Metadata
 * block is built from the still-present entry-tags before we restructure the sidebar.
 *
 * A leading <hr> is inserted before the sidebar section so the runtime splits it into
 * its own EDS section. (We insert the break here rather than via skoda-model-sections
 * because the aside content is rebuilt in afterTransform, after that transformer runs.)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Build a Cards block from the related "Explore more" teasers.
function relatedCards(sidebar, document) {
  // The source nests `div.article-teaser > article`, so both selectors match the same
  // teaser. Keep only the OUTERMOST match (SKODA-817): otherwise 3 teasers become 6 rows,
  // and the shared <img> moves into the second row, which leaves the first image-less.
  const matched = [...sidebar.querySelectorAll('.related .article-teaser, .related article')];
  const teasers = matched
    .filter((el, i, arr) => arr.indexOf(el) === i)
    .filter((el) => !matched.some((other) => other !== el && other.contains(el)));
  if (!teasers.length) return null;

  const cells = [['Cards']];
  let emitted = 0;
  teasers.forEach((t) => {
    const img = t.querySelector('img');
    const link = t.querySelector('a[href]');
    const titleEl = t.querySelector('.title, h2, h3, h4');
    const title = (titleEl && titleEl.textContent.trim())
      || (img && img.getAttribute('alt'))
      || (link && link.textContent.trim())
      || '';
    if (!link && !img) return;
    // Cell 2 holds the title (linked when a href exists). createTable accepts a plain
    // array of nodes as one cell (see tags.js) — NOT an { elems } object (that is the
    // runtime buildBlock format and serialises to "[object Object]" here).
    const content = [];
    if (title) {
      const p = document.createElement('p');
      if (link) {
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href'));
        a.textContent = title;
        p.appendChild(a);
      } else {
        p.textContent = title;
      }
      content.push(p);
    }
    cells.push([img || '', content]);
    emitted += 1;
  });
  return emitted ? cells : null;
}

// Build a Tags block from the sidebar tag row.
function tagsCell(sidebar, document) {
  const anchors = [...sidebar.querySelectorAll('.tags a.label[href], section.tags a[href], ol.entry-tags a[href]')]
    .filter((el, i, arr) => arr.indexOf(el) === i);
  if (!anchors.length) return null;
  const cell = [];
  anchors.forEach((a) => {
    const href = a.getAttribute('href');
    const text = (a.textContent || '').trim();
    if (!href || !text) return;
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = text;
    cell.push(link);
  });
  return cell.length ? [['Tags'], [cell]] : null;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const sidebar = element.querySelector('.sidebar');
  if (!sidebar) return; // linear/plain-post story or already handled — nothing to do.

  const cards = relatedCards(sidebar, document);
  const tags = tagsCell(sidebar, document);

  // Rebuild the sidebar as a clean section: a leading break, an <aside> holding the
  // Cards + Tags blocks, then the Section Metadata (Style: sidebar).
  const frag = document.createElement('div');

  const hr = document.createElement('hr');
  frag.appendChild(hr);

  const aside = document.createElement('aside');
  const heading = sidebar.querySelector('.related .heading, .related h2, .related h3');
  if (heading) {
    const h = document.createElement('h2');
    h.textContent = (heading.textContent || 'Explore more').trim();
    aside.appendChild(h);
  }
  if (cards) aside.appendChild(WebImporter.DOMUtils.createTable(cards, document));
  if (tags) {
    // The source titles the tag row "Tags" (section.tags h3.sidebar-heading); keep it as
    // authored text above the existing Tags block (SKODA-817).
    const tagsHeading = sidebar.querySelector('section.tags .heading, section.tags h2, section.tags h3');
    if (tagsHeading && (tagsHeading.textContent || '').trim()) {
      const h = document.createElement('h2');
      h.textContent = tagsHeading.textContent.trim();
      aside.appendChild(h);
    }
    aside.appendChild(WebImporter.DOMUtils.createTable(tags, document));
  }
  frag.appendChild(aside);

  // Section Metadata: Style = sidebar (consumed by the story-scoped runtime hook).
  const metadataBlock = WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { Style: 'sidebar' },
  });
  frag.appendChild(metadataBlock);

  // If neither cards nor tags survived, don't emit an empty styled section — just drop.
  if (!cards && !tags) {
    sidebar.remove();
    return;
  }

  sidebar.replaceWith(...frag.childNodes);
}
