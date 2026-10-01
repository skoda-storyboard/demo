/*
 * float-dock — the page-level floating action bar (SKODA-215).
 * Spec: docs/ui-specs/social-share.md (share cluster) + media-cart.md §2 (the source
 * `.sticky-buttons` bar). Import contract `floating-action-bar`: code-only, the importers emit
 * nothing. scripts.js builds this block in the delayed phase on every page except the
 * nav/footer fragments.
 *
 * Children, in source order: share cluster · media-cart slot · scroll-to-top.
 * - Share: the trigger always expands the per-network intent links, as on the source
 *   (no native `navigator.share` sheet; product decision 2026-09-29, review of the branch preview).
 * - Media-cart slot `[data-slot="media-cart"]`: the cart badge (SKODA-505b, media-cart.md §2/§3),
 *   a link to the cart page with the item count, kept in sync with /scripts/media-cart.js
 *   (loaded here, in the delayed phase). If the cart can't load, the slot stays empty.
 * - Scroll-to-top: shown after 300px of scroll (source parity).
 */

import { decorateIcons } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { SHARE_NETWORKS, shareUrl, sharePageData } from '../../scripts/share.js';

const LIST_ID = 'float-dock-share-list';
// source (main.js / media-room.js): the scroll-top slot un-collapses once scrollTop > 300
const SCROLL_TOP_THRESHOLD = 300;

function icon(name) {
  const span = document.createElement('span');
  span.className = `icon icon-${name}`;
  return span;
}

function button(className, label, iconName) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `float-dock-button ${className}`;
  btn.setAttribute('aria-label', label);
  btn.append(icon(iconName));
  return btn;
}

function buildShare(ph) {
  const data = sharePageData(document);
  const share = document.createElement('div');
  share.className = 'float-dock-share';

  const trigger = button('float-dock-trigger', ph.shareThisPage || 'Share this page', 'share');
  const list = document.createElement('ul');
  list.id = LIST_ID;
  list.className = 'float-dock-share-list';
  list.inert = true;

  SHARE_NETWORKS.forEach(({ id, label }) => {
    const li = document.createElement('li');
    li.className = `float-dock-share-item-${id}`;
    const a = document.createElement('a');
    a.className = `float-dock-network float-dock-network-${id}`;
    a.href = shareUrl(id, data);
    // web intents open in a new tab; whatsapp:// hands off to the app (a new tab would stay
    // blank), as on the source
    if (id !== 'whatsapp') {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    a.setAttribute('aria-label', `${ph.shareOn || 'Share on'} ${label}`);
    // white glyph on WhatsApp green is ~1.7:1; the ink glyph passes (social-share.md §6)
    a.append(icon(id === 'whatsapp' ? 'whatsapp-ink' : id));
    li.append(a);
    list.append(li);
  });

  const setExpanded = (expanded) => {
    trigger.setAttribute('aria-expanded', expanded);
    share.classList.toggle('expanded', expanded);
    list.inert = !expanded;
  };
  trigger.setAttribute('aria-controls', LIST_ID);
  setExpanded(false);

  trigger.addEventListener('click', () => {
    setExpanded(trigger.getAttribute('aria-expanded') !== 'true');
  });

  // document-level: a mouse click doesn't focus the trigger in Safari, so Esc must work
  // wherever focus is while the list is open
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && share.classList.contains('expanded')) {
      setExpanded(false);
      trigger.focus();
    }
  });

  // trigger first, so Tab moves from it into the open list (the list is positioned beside it)
  share.append(trigger, list);
  return share;
}

function buildScrollTop(ph) {
  const top = button('float-dock-top', ph.scrollToTop || 'Scroll to top', 'chevron-up');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  top.addEventListener('click', () => {
    const main = document.querySelector('main');
    if (main) {
      // temporary focus target: dropped again on blur so main doesn't stay focusable
      if (!main.hasAttribute('tabindex')) {
        main.tabIndex = -1;
        main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
      }
      main.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });
  return top;
}

/**
 * The media-cart badge: the source a.media-cart-icon (cart glyph, red count bubble when not
 * empty), linking to the cart page. The count changes are announced politely.
 * @param {Element} slot
 * @param {Record<string,string>} ph placeholders
 * @param {function(): Promise<Array>} [load] the cart + its UI module (injectable for tests)
 */
export async function buildCartBadge(slot, ph, load = () => Promise.all([
  import('../../scripts/media-cart.js'), import('../../scripts/media-cart-ui.js'),
])) {
  const [cart, ui] = await load();
  const labels = ui.cartLabels(ph);
  const link = document.createElement('a');
  link.className = 'float-dock-button float-dock-cart';
  link.href = ui.cartHref();
  if (window.location.pathname.replace(/\/$/, '') === link.getAttribute('href')) {
    link.setAttribute('aria-current', 'page');
  }
  const count = document.createElement('span');
  count.className = 'float-dock-cart-count';
  count.setAttribute('aria-hidden', 'true');
  link.append(icon('media-cart'), count);
  const status = document.createElement('span');
  status.className = 'float-dock-cart-status';
  status.setAttribute('role', 'status');

  const render = ({ count: n }, announce) => {
    count.textContent = n ? String(n) : '';
    count.hidden = !n;
    link.setAttribute('aria-label', n ? ui.plural(labels, 'badgeCount', n) : labels.badge);
    if (announce) status.textContent = ui.plural(labels, 'countChanged', n);
  };
  render(cart.getCart(), false);
  cart.onChange((c) => render(c, true));
  slot.append(link, status);
  return link;
}

export default async function decorate(block) {
  const ph = await fetchPlaceholders();
  const slot = document.createElement('div');
  slot.className = 'float-dock-slot';
  slot.dataset.slot = 'media-cart';
  const top = buildScrollTop(ph);
  // in place before the bar shows, so the share cluster doesn't jump when it arrives
  try {
    await buildCartBadge(slot, ph);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('float-dock: media cart unavailable', e);
  }

  block.replaceChildren(buildShare(ph), slot, top);
  decorateIcons(block);
  // decorateIcons makes lazy <img>s, which wouldn't fetch while the bar is display:none;
  // eager, so the glyphs are there when the bar appears
  block.querySelectorAll('.icon img').forEach((img) => { img.loading = 'eager'; });

  // scroll-top is revealed past 300px of scroll, as on the source; the hidden button stays in
  // the layout (only transform/opacity change), so revealing it causes no layout shift
  let ticking = false;
  let shown;
  const update = () => {
    ticking = false;
    const next = window.scrollY > SCROLL_TOP_THRESHOLD;
    if (next === shown) return; // only touch the DOM when the threshold is crossed
    shown = next;
    // don't strand keyboard focus on <body>: hand it to the share trigger before hiding
    if (!shown && document.activeElement === top) block.querySelector('.float-dock-trigger').focus();
    block.classList.toggle('scrolled', shown);
    top.inert = !shown;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}
