/*
 * card-teaser.js — the shared Card / Teaser primitive (SKODA-201).
 *
 * ONE source of truth for the universal teaser card, consumed by every block
 * that renders cards (cards, stories, and later story-rail / listings). Lives in
 * /scripts/ because it is cross-block shared code — the only sanctioned sharing
 * path besides fragment/fragment.js (AGENTS.md). The matching visual lives in
 * styles/card-teaser.css (imported by each consuming block's CSS).
 *
 * Two entry points for the two card sources in the codebase:
 *   - decorateCardCells / classifyBody / decorateToolbar / wireCardLink:
 *       transform AUTHORED DA table cells in place (the `cards` block).
 *   - buildCardTeaser(row, opts):
 *       build a card <li> from a QUERY-INDEX ROW object (data-driven blocks like
 *       `stories`). Defensive about missing fields — an image-less row still
 *       produces an in-flow card (no zero-height collapse).
 *
 * Class contract (styled by styles/card-teaser.css):
 *   li.card-teaser[.overlay]
 *     .card-teaser-image        (media layer; <picture>)
 *     .card-teaser-body         (date/title/summary; absolute in overlay context)
 *       .card-teaser-date       time/text, small semibold
 *       .card-teaser-title      heading
 *       .card-teaser-summary    paragraph (clamped in overlay)
 *     .card-teaser-toolbar      (optional action row) > .card-teaser-button
 *   a.card-teaser-link          the single stretched card link
 */

import { createOptimizedPicture } from './aem.js';

// A date paragraph like "15. 9. 2026", "1.9.2026", "12/09/2026" or "2026-09-15".
export const DATE_RE = /^\s*\d{1,4}[.\-/]\s?\d{1,2}[.\-/]\s?\d{2,4}\.?\s*$/;

/** A cell is an image cell when its only child wraps a <picture>. */
export function isImageCell(cell) {
  return cell.children.length === 1 && !!cell.querySelector(':scope > picture, :scope > p > picture');
}

/** A cell is a toolbar cell when it has children and every child is a <p> holding an <a>. */
export function isToolbarCell(cell) {
  const kids = [...cell.children];
  return kids.length > 0 && kids.every((p) => p.tagName === 'P' && p.querySelector(':scope > a'));
}

/**
 * Lift an authored <img> out of its wrapping <p> so <picture> is a direct child
 * of the cell (EDS import wraps images in <p>), then swap in an optimized
 * <picture>. Operates on authored markup (the `cards` path).
 */
export function optimizeImages(scope) {
  scope.querySelectorAll('picture > img').forEach((img) => {
    const picture = img.closest('picture');
    const p = picture.closest('p');
    if (p && p.children.length === 1) p.replaceWith(picture);
    const optimized = createOptimizedPicture(
      img.src,
      img.alt,
      false,
      [{ media: '(min-width: 768px)', width: '750' }, { width: '500' }],
    );
    picture.replaceWith(optimized);
  });
}

/**
 * Build the action row for a toolbar cell: each authored link becomes a pill
 * button. Icon-only links (no visible text) get an aria-label from title/href.
 */
export function decorateToolbar(cell) {
  cell.classList.add('card-teaser-toolbar');
  cell.querySelectorAll(':scope > p').forEach((p) => {
    const a = p.querySelector(':scope > a');
    if (!a) return;
    a.classList.add('card-teaser-button');
    const label = a.textContent.trim();
    const iconOnly = !label && !!a.querySelector('.icon, svg, img');
    if (iconOnly && !a.getAttribute('aria-label')) {
      a.setAttribute('aria-label', a.title || a.getAttribute('href') || 'action');
    }
    cell.append(a); // flatten the <p> so buttons are direct flex children
    p.remove();
  });
}

/**
 * Classify the text pieces inside a card body so CSS can style + order them like
 * the source teaser (date -> title -> summary), regardless of authored sequence.
 */
export function classifyBody(body) {
  [...body.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      el.classList.add('card-teaser-title');
    } else if (el.tagName === 'P' && DATE_RE.test(el.textContent)) {
      el.classList.add('card-teaser-date');
    } else if (el.tagName === 'P') {
      el.classList.add('card-teaser-summary');
    }
  });
}

/**
 * Give the card ONE tab stop: the first non-toolbar link becomes a "stretched"
 * link covering the whole card (via `card-teaser-link` + a ::after in CSS). Any
 * other same-target link is made non-focusable / aria-hidden so a card exposes a
 * single accessible name. Toolbar buttons keep their own focus.
 */
export function wireCardLink(li) {
  const toolbar = li.querySelector('.card-teaser-toolbar');
  const links = [...li.querySelectorAll('a')].filter((a) => !toolbar || !toolbar.contains(a));
  if (!links.length) return;
  const primary = links.find((a) => a.textContent.trim()) || links[0];
  primary.classList.add('card-teaser-link');
  links.forEach((a) => {
    if (a === primary) return;
    if (a.getAttribute('href') === primary.getAttribute('href')) {
      a.setAttribute('tabindex', '-1');
      a.setAttribute('aria-hidden', 'true');
    }
  });
}

/**
 * Decorate one authored row's cells in place (content-sniffed, defensive) into a
 * card-teaser <li>. Used by the `cards` block for authored DA tables.
 * @param {HTMLElement} li  a <li> whose children are the row's cells
 */
export function decorateCardCells(li) {
  [...li.children].forEach((cell) => {
    if (isImageCell(cell)) cell.className = 'card-teaser-image';
    else if (isToolbarCell(cell)) decorateToolbar(cell);
    else { cell.className = 'card-teaser-body'; classifyBody(cell); }
  });
  // drop empty image cells so they don't leave a blank slot
  li.querySelectorAll('.card-teaser-image:empty').forEach((c) => c.remove());
  // no media left → same intrinsic-height fallback as the data-driven builder,
  // so an authored .overlay card without an image can't collapse (its body is
  // absolutely positioned over nothing). Mirrors buildCardTeaser's no-image flag.
  if (!li.querySelector('.card-teaser-image')) li.classList.add('card-teaser-no-image');
}

// --- data-driven path (query-index rows) -----------------------------------

/** Format an ISO/parseable date to the source's "D. M. YYYY" (e.g. 10. 9. 2026). */
export function formatCardDate(value) {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return '';
  const d = new Date(t);
  return `${d.getUTCDate()}. ${d.getUTCMonth() + 1}. ${d.getUTCFullYear()}`;
}

/**
 * Build a card-teaser <li> from a query-index row object. Data-driven blocks
 * (stories, listings, rails) use this instead of the authored-cell path, so all
 * cards share one structure + one stylesheet.
 *
 * Defensive: a row without an image still renders a full in-flow card — the media
 * layer is only created when there is an image, so an image-less overlay card
 * falls back to a solid-scrim body with intrinsic height (no zero-height collapse).
 *
 * @param {object} row   { path, title, description, image, date|publisheddate }
 * @param {object} [opts]
 * @param {boolean} [opts.eager]   first card: eager <img> + fetchpriority=high
 * @param {boolean} [opts.overlay] overlay variant (caption over the image)
 * @param {boolean} [opts.summary] include the description as a summary line
 * @returns {HTMLLIElement}
 */
export function buildCardTeaser(row, { eager = false, overlay = true, summary = false } = {}) {
  const li = document.createElement('li');
  li.className = overlay ? 'card-teaser overlay' : 'card-teaser';

  const a = document.createElement('a');
  a.className = 'card-teaser-link';
  a.href = row.path || '#';

  // media layer — only when an image exists (image is `rec.`, not required;
  // SKODA-METADATA-SCHEMA §Fields). No empty media element when absent.
  if (row.image) {
    const media = document.createElement('div');
    media.className = 'card-teaser-image';
    const pic = createOptimizedPicture(row.image, row.title || '', eager, [
      { media: '(min-width: 768px)', width: '750' }, { width: '500' },
    ]);
    if (eager) pic.querySelector('img')?.setAttribute('fetchpriority', 'high');
    media.append(pic);
    a.append(media);
  } else {
    // no image: mark the card so CSS gives the body intrinsic height
    li.classList.add('card-teaser-no-image');
  }

  const body = document.createElement('div');
  body.className = 'card-teaser-body';
  const isoDate = row.date || row.publisheddate || row.publishDate;
  const dateText = formatCardDate(isoDate);
  if (dateText) {
    const time = document.createElement('time');
    time.className = 'card-teaser-date';
    time.setAttribute('datetime', String(isoDate));
    time.textContent = dateText;
    body.append(time);
  }
  if (row.title) {
    const h = document.createElement('h3');
    h.className = 'card-teaser-title';
    h.textContent = row.title;
    body.append(h);
  }
  if (summary && row.description) {
    const p = document.createElement('p');
    p.className = 'card-teaser-summary';
    p.textContent = row.description;
    body.append(p);
  }
  a.append(body);
  li.append(a);
  return li;
}
