/*
 * Exec Bio (SKODA-810a, docs/ui-specs/company-pages.md, sub-spec A): the Board of Management
 * members, two to a row from 781px, one below (the source's SiteOrigin row).
 *
 * One row per member, two cells:
 *   1. the card, kept as authored (scripts/person-card.js): the name and roles (bold, the
 *      name the first bold run), then the portrait;
 *   2. the "show more" panel: its first paragraph is the toggle's label, then one paragraph
 *      per photo (the set), then the links (CV, photo set, press release, LinkedIn).
 * The label is the source's row-toggle title, an h2, here a button inside it that slides the
 * panel open and shut (the source's 400ms slideToggle). Each photo opens the shared lightbox
 * (scripts/lightbox.js, loaded on the first click) over the member's set. The authored
 * pictures move into their thumbnails, optimized in place (DA Layout-mode editability,
 * SKODA-EDS-DA-ARCHITECTURE.md). A row without a panel cell is a plain card; a panel without
 * photos keeps its links.
 */

import { optimizeImages } from '../../scripts/card-teaser.js';
import decoratePersonCard, { decorateCardLinks } from '../../scripts/person-card.js';

const LABELS = {
  toggle: 'show more',
  openPhoto: (n, total, name) => `Open photo ${n} of ${total}${name ? `: ${name}` : ''}`,
};

// the thumbnails are at most a third of the 574px card: a 750px rendition covers 2x
const THUMB_WIDTH = '750';

/*
 * The source slides a panel open and shut: jQuery slideToggle, 400ms, its "swing" easing,
 * the height only, clipped (measured on the live board: 15 → 378px over ~400ms). Reduced
 * motion, or a browser without Web Animations, toggles at once.
 */
const SLIDE_MS = 400;
const SWING = 'cubic-bezier(0.37, 0, 0.63, 1)'; // jQuery's swing: 0.5 - cos(pπ) / 2
const reducedMotion = (view) => !!view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

let nextId = 0;

function slide(panel, open) {
  const from = panel.hidden ? 0 : panel.getBoundingClientRect().height;
  panel.getAnimations?.().forEach((animation) => animation.cancel());
  panel.hidden = false;
  const full = panel.getBoundingClientRect().height;
  const to = open ? full : 0;
  const view = panel.ownerDocument.defaultView;
  if (typeof panel.animate !== 'function' || reducedMotion(view) || !full || from === to) {
    panel.hidden = !open;
    return;
  }
  // the panel's insets and margins (10px under the bar) slide with its height, as jQuery's
  // slideToggle does on the source
  const {
    paddingTop, paddingBottom, marginTop, marginBottom,
  } = view.getComputedStyle(panel);
  const frame = (height) => {
    const share = height / full;
    return {
      boxSizing: 'border-box',
      overflow: 'hidden',
      height: `${height}px`,
      paddingTop: `${parseFloat(paddingTop) * share}px`,
      paddingBottom: `${parseFloat(paddingBottom) * share}px`,
      marginTop: `${parseFloat(marginTop) * share}px`,
      marginBottom: `${parseFloat(marginBottom) * share}px`,
    };
  };
  const animation = panel.animate([frame(from), frame(to)], {
    duration: SLIDE_MS * (Math.abs(to - from) / full),
    easing: SWING,
  });
  // a cancelled slide (the next toggle took over) leaves the panel to that one
  if (!open) animation.onfinish = () => { panel.hidden = true; };
}

// a photo's crop, written after it when it isn't its orientation's default (the importer
// carries the source's `snap-top` / `snap-center`): "top" or "center"
const POSITION = /^(top|center)$/i;

/** Whether a paragraph holds only a picture (a photo of the set), and at most its crop word. */
const isPhoto = (node) => node.matches?.('p') && !!node.querySelector('img')
  && (!node.textContent.trim() || POSITION.test(node.textContent.trim()));

/**
 * A photo's crop in its 16:9 tile: the authored word, else from the top for a portrait photo
 * (taller than wide: the source's `snap-top`, heads kept) and centred for a landscape one.
 * @param {Element} p the photo paragraph
 * @returns {'top'|'center'}
 */
export function photoPosition(p) {
  const word = p.textContent.trim().toLowerCase();
  if (POSITION.test(word)) return word;
  const img = p.querySelector('img');
  const w = Number(img?.getAttribute('width'));
  const h = Number(img?.getAttribute('height'));
  return w > 0 && h > w ? 'top' : 'center';
}

/** The photo grid: a button per photo (its authored picture), opening the lightbox on the set. */
function photoGrid(photos, name) {
  const items = photos.map((p) => {
    const img = p.querySelector('img');
    return {
      src: img.src,
      alt: img.getAttribute('alt') || name,
      picture: img.closest('picture') || img,
      top: photoPosition(p) === 'top',
    };
  });
  const list = document.createElement('ul');
  list.className = 'exec-bio-photos';
  let lightbox = null;
  const open = async (index, trigger) => {
    if (!lightbox) {
      const { buildLightbox } = await import('../../scripts/lightbox.js');
      lightbox = buildLightbox(document.body, items.map((item) => {
        const caption = document.createElement('div');
        const title = document.createElement('p');
        title.textContent = item.alt;
        caption.append(title);
        return { src: item.src, alt: item.alt, caption };
      }));
    }
    lightbox.open(index, trigger);
  };
  items.forEach((item, i) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = item.top ? 'exec-bio-photo is-top' : 'exec-bio-photo';
    button.setAttribute('aria-label', LABELS.openPhoto(i + 1, items.length, item.alt));
    button.append(item.picture);
    button.addEventListener('click', () => {
      open(i, button).catch((e) => {
        // eslint-disable-next-line no-console
        console.error('exec-bio: lightbox not loaded', e);
      });
    });
    li.append(button);
    list.append(li);
  });
  // the moved pictures keep their <img>; only their renditions change (thumbnail-sized, lazy)
  optimizeImages(list, { selector: '.exec-bio-photo img', desktopWidth: THUMB_WIDTH, mobileWidth: THUMB_WIDTH });
  photos.forEach((p) => p.remove());
  return list;
}

/** The toggle (an h2 holding a button) and its panel, built from the panel cell. */
function panelOf(cell, name) {
  const nodes = [...cell.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
  const first = nodes[0];
  const hasLabel = first && !isPhoto(first) && !first.querySelector?.('a[href]');
  const label = hasLabel ? first.textContent.replace(/\s+/g, ' ').trim() : '';
  const rest = hasLabel ? nodes.slice(1) : nodes;
  const photos = rest.filter(isPhoto);
  const content = rest.filter((n) => !photos.includes(n));
  if (!photos.length && !content.some((n) => n.textContent.trim())) return [];

  nextId += 1;
  const heading = document.createElement('h2');
  heading.className = 'exec-bio-heading';
  const button = document.createElement('button');
  button.type = 'button';
  button.id = `exec-bio-trigger-${nextId}`;
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `exec-bio-panel-${nextId}`);
  button.append(label || LABELS.toggle);
  const icon = document.createElement('span');
  icon.className = 'exec-bio-icon';
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);
  heading.append(button);

  const panel = document.createElement('div');
  panel.className = 'exec-bio-panel';
  panel.id = `exec-bio-panel-${nextId}`;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', button.id);
  panel.hidden = true;
  if (photos.length) panel.append(photoGrid(photos, name));
  panel.append(...content);
  decorateCardLinks(panel);

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    button.closest('.exec-bio-card')?.classList.toggle('is-open', open);
    slide(panel, open);
  });
  return [heading, panel];
}

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'exec-bio-list';
  [...block.children].forEach((row) => {
    const [cardCell, panelCell] = row.children;
    if (!cardCell || (!cardCell.textContent.trim() && !cardCell.querySelector('picture, img'))) return;
    const item = document.createElement('li');
    item.append(...cardCell.childNodes);
    const { identity } = decoratePersonCard(item, 'exec-bio');
    const name = identity?.querySelector('.exec-bio-name')?.textContent.trim() || '';
    if (panelCell) item.append(...panelOf(panelCell, name));
    list.append(item);
  });
  block.replaceChildren(list);
}
