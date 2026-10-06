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
 *   .related  ("Explore more", 3 .article-teaser)  → Cards (overlay) block
 *   section.tags (ol.entry-tags)                    → Tags block
 *   .newsletter-subscribe-widget                    → Newsletter Stub (card) block at the
 *       top of the aside (SKODA-823, docs/ui-specs/newsletter.md §7). Built on the
 *       `preprocess` hook (import-story-detail.js calls it): skoda-page-cleanup removes
 *       the widget in beforeTransform, and helix preProcess would drop its empty inputs.
 *       The heading, image, placeholder, button, consent + manage links, consent error
 *       and the list/language ids come from the source widget; the consent and manage
 *       links stay absolute source URLs (their EDS pages 404 until migrated; skoda-links
 *       leaves non-demo source links absolute). UI only: the block posts nothing (M1).
 *   .side-banner                                    → DROPPED (external banner slot,
 *       SKODA-903).
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

const NEWSLETTER_BLOCK = 'Newsletter Stub (card)';
// Strings the source widget does not carry as text (its e-mail field has no label and its
// invalid-e-mail message is set by JS); the same values as the SKODA-823 block draft.
const NEWSLETTER_DEFAULTS = {
  label: 'Email address',
  message: 'Newsletter signup is not available yet',
  error: 'Please enter a valid e-mail address.',
  'consent-error': 'Please accept the terms before continuing.',
};

const squash = (s) => (s || '').replace(/[ \t\r\n]+/g, ' ').trim();

// Inline copy of a source node (text, <br>, links) as one cell's nodes, outer whitespace
// trimmed. Links keep only their href (no target / tracking attributes).
function inlineNodes(source, document) {
  const nodes = [];
  source.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = n.nodeValue.replace(/[ \t\r\n]+/g, ' ');
      if (t) nodes.push(document.createTextNode(t));
    } else if (n.nodeName === 'BR') {
      nodes.push(document.createElement('br'));
    } else if (n.nodeName === 'A' && n.getAttribute('href')) {
      const a = document.createElement('a');
      a.setAttribute('href', n.getAttribute('href'));
      a.textContent = squash(n.textContent);
      if (a.textContent) nodes.push(a);
    } else if (n.nodeType === 1) {
      const t = squash(n.textContent);
      if (t) nodes.push(document.createTextNode(t));
    }
  });
  // trim the cell's outer whitespace (the source ends the consent label with `&nbsp; `)
  const edge = (i, re) => {
    while (nodes.length && nodes[i()].nodeType === 3) {
      const n = nodes[i()];
      n.nodeValue = n.nodeValue.replace(re, '');
      if (n.nodeValue) break;
      nodes.splice(i(), 1);
    }
  };
  edge(() => 0, /^[ \u00a0]+/);
  edge(() => nodes.length - 1, /[ \u00a0]+$/);
  return nodes.filter((n) => n.nodeType !== 3 || n.nodeValue);
}

// `.newsletter-subscribe-widget` → Newsletter Stub (card) key/value rows (newsletter.md §7).
function newsletterCard(widget, document) {
  const rows = [[NEWSLETTER_BLOCK]];
  const add = (key, value) => {
    if (Array.isArray(value) ? value.length : value) rows.push([key, value]);
  };
  const value = (sel, attr) => {
    const el = widget.querySelector(sel);
    if (!el) return '';
    return squash(attr ? el.getAttribute(attr) : el.textContent);
  };

  const src = widget.querySelector('header img');
  if (src && src.getAttribute('src')) {
    // a decorative background ("Subscription background"): the heading says it all
    const img = document.createElement('img');
    img.setAttribute('src', src.getAttribute('src'));
    img.setAttribute('alt', '');
    add('image', [img]);
  }
  const heading = widget.querySelector('header h1, header h2, header h3, header h4');
  if (heading) add('heading', inlineNodes(heading, document));
  add('label', NEWSLETTER_DEFAULTS.label);
  add('placeholder', value('input[type="email"], input.email', 'placeholder'));
  add('button', value('button[type="submit"], button'));

  const terms = widget.querySelector('.terms label, label[for]');
  if (terms) {
    const label = terms.cloneNode(true);
    label.querySelectorAll('.manage-subscription-link').forEach((n) => n.remove());
    add('consent', inlineNodes(label, document));
  }
  const manage = widget.querySelector('.manage-subscription-link a[href]');
  if (manage && squash(manage.textContent)) {
    const a = document.createElement('a');
    a.setAttribute('href', manage.getAttribute('href'));
    a.textContent = squash(manage.textContent);
    add('manage', [a]);
  }

  add('message', NEWSLETTER_DEFAULTS.message);
  add('error', NEWSLETTER_DEFAULTS.error);
  add('consent-error', value('.checkbox-error') || NEWSLETTER_DEFAULTS['consent-error']);
  add('list', value('input[name="list"]', 'value'));
  add('language', value('input[name="language"]', 'value'));
  // only a heading or a form makes a card worth emitting
  return rows.some(([k]) => k === 'heading' || k === 'button') ? rows : null;
}

const isNewsletterTable = (table) => {
  const cell = table.querySelector('tr > th, tr > td');
  return !!cell && squash(cell.textContent) === NEWSLETTER_BLOCK;
};

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

  // The source renders these as image teasers with the title over the image
  // (article-teaser overlay), so emit the overlay variant.
  const cells = [['Cards (overlay)']];
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
    // Cell 2 holds the title as a heading (linked when a href exists): the card
    // primitive reads a heading as the card title and its link as the whole-card
    // link, whereas a cell of only link paragraphs is read as a toolbar of buttons.
    // createTable accepts a plain array of nodes as one cell (see tags.js) — NOT an
    // { elems } object (that is the runtime buildBlock format and serialises to
    // "[object Object]" here).
    const content = [];
    if (title) {
      const h = document.createElement('h3');
      if (link) {
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href'));
        a.textContent = title;
        h.appendChild(a);
      } else {
        h.textContent = title;
      }
      content.push(h);
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
    // The "+N" show-more toggle (`a.show-hidden-terms href="#"`) is tag-row UI, not a tag
    // (audit 4.11); the tags it reveals are real `hidden-term` links and are kept.
    if (href === '#' || a.classList.contains('show-hidden-terms')) return;
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = text;
    cell.push(link);
  });
  return cell.length ? [['Tags'], [cell]] : null;
}

export default function transform(hookName, element, payload) {
  if (hookName === 'preprocess') {
    // The sidebar widget only (a newsletter form elsewhere is site chrome).
    const doc = element.ownerDocument || (payload && payload.document);
    element.querySelectorAll('.sidebar .newsletter-subscribe-widget').forEach((widget) => {
      const rows = newsletterCard(widget, doc);
      if (rows) widget.replaceWith(WebImporter.DOMUtils.createTable(rows, doc));
      else widget.remove();
    });
    return;
  }
  if (hookName !== TransformHook.afterTransform) return;

  const sidebar = element.querySelector('.sidebar');
  if (!sidebar) return; // linear/plain-post story or already handled — nothing to do.

  const cards = relatedCards(sidebar, document);
  const tags = tagsCell(sidebar, document);
  const newsletter = [...sidebar.querySelectorAll('table')].find(isNewsletterTable) || null;

  // Rebuild the sidebar as a clean section: a leading break, an <aside> holding the
  // Newsletter Stub (card) + Cards + Tags blocks, then the Section Metadata (Style: sidebar).
  const frag = document.createElement('div');

  const hr = document.createElement('hr');
  frag.appendChild(hr);

  const aside = document.createElement('aside');
  // the source sidebar opens with the newsletter widget, above "Explore more"
  if (newsletter) aside.appendChild(newsletter);
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

  // If nothing survived, don't emit an empty styled section — just drop.
  if (!cards && !tags && !newsletter) {
    sidebar.remove();
    return;
  }

  sidebar.replaceWith(...frag.childNodes);
}
