/*
 * float-dock — the page-level floating action bar (SKODA-215).
 * Spec: docs/ui-specs/social-share.md (share cluster) + media-cart.md §2 (the source
 * `.sticky-buttons` bar). Import contract `floating-action-bar`: code-only, the importers emit
 * nothing. scripts.js builds this block in the delayed phase on every page except the
 * nav/footer fragments.
 *
 * Children, in source order: share cluster · media-cart slot · scroll-to-top.
 * - Share: where `navigator.share` exists the trigger opens the native share sheet;
 *   elsewhere (or if the native sheet fails) it expands the per-network intent links.
 * - Media-cart slot: an empty `[data-slot="media-cart"]` the cart button (SKODA-505a/b) is
 *   appended into. The dock owns the position, 505 owns the button.
 * - Scroll-to-top: shown after one viewport of scroll.
 */

import { decorateIcons } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { SHARE_NETWORKS, shareUrl, sharePageData } from '../../scripts/share.js';

const LIST_ID = 'float-dock-share-list';

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
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
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
  const listMode = () => {
    trigger.setAttribute('aria-controls', LIST_ID);
    setExpanded(false);
  };

  let native = typeof navigator.share === 'function';
  if (!native) listMode();

  trigger.addEventListener('click', async () => {
    if (native) {
      try {
        await navigator.share({ title: data.title, url: data.url });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // the user dismissed the sheet
        native = false; // unsupported/blocked here: fall back to the intent links for good
        listMode();
      }
    }
    setExpanded(trigger.getAttribute('aria-expanded') !== 'true');
  });

  share.addEventListener('keydown', (e) => {
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
      if (!main.hasAttribute('tabindex')) main.tabIndex = -1;
      main.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });
  return top;
}

export default async function decorate(block) {
  const ph = await fetchPlaceholders();
  const slot = document.createElement('div');
  slot.className = 'float-dock-slot';
  slot.dataset.slot = 'media-cart';
  const top = buildScrollTop(ph);

  block.replaceChildren(buildShare(ph), slot, top);
  decorateIcons(block);

  // scroll-top is revealed after one viewport of scroll; the hidden button stays in the
  // layout (only transform/opacity change), so revealing it causes no layout shift
  let ticking = false;
  const update = () => {
    ticking = false;
    const shown = window.scrollY >= window.innerHeight;
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
