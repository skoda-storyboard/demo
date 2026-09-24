import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// social network → accessible label + hover-tint class, keyed by icon token name
const SOCIAL_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
};

// app-store badge → accessible label, keyed by icon token name
const APP_BADGE_LABELS = {
  appstore: 'Škoda Media Room on the App Store',
  googleplay: 'Škoda Media Room on Google Play',
};

/**
 * Returns the icon token name (e.g. "facebook") for a link whose only content is
 * a single decorated icon span, or null if the link is not an icon link.
 * @param {HTMLAnchorElement} a
 */
function iconNameOf(a) {
  const icon = a.querySelector('span.icon');
  if (!icon || a.textContent.trim()) return null;
  const cls = [...icon.classList].find((c) => c.startsWith('icon-'));
  return cls ? cls.slice(5) : null;
}

/**
 * Decorates the social section: groups app-store badges and social icons, and adds
 * accessible labels + per-network hover classes.
 * @param {Element} section
 */
function decorateSocial(section) {
  const anchors = [...section.querySelectorAll('a')];
  const socialIcons = [];
  const appBadges = [];

  anchors.forEach((a) => {
    const name = iconNameOf(a);
    if (name && SOCIAL_LABELS[name]) {
      a.classList.add('social-link', `social-${name}`);
      a.setAttribute('aria-label', SOCIAL_LABELS[name]);
      socialIcons.push(a);
    } else if (name && APP_BADGE_LABELS[name]) {
      a.classList.add('app-badge');
      a.setAttribute('aria-label', APP_BADGE_LABELS[name]);
      appBadges.push(a);
    }
  });

  // group the icons into their own rows so CSS can lay them out independently
  if (appBadges.length) {
    const row = document.createElement('div');
    row.className = 'app-badges';
    appBadges.forEach((a) => row.append(a));
    section.append(row);
  }
  if (socialIcons.length) {
    const row = document.createElement('div');
    row.className = 'social-icons';
    socialIcons.forEach((a) => row.append(a));
    section.append(row);
  }
}

/**
 * Marks the legal section parts (copyright text / notice / feed links) so CSS can style
 * and position them, and wraps the notice + feeds in a flex row.
 * @param {Element} section
 */
function decorateLegal(section) {
  const paras = [...section.querySelectorAll('p')];
  paras.forEach((p) => {
    const links = p.querySelectorAll('a');
    const isFeeds = links.length > 0 && [...links].every((a) => /rss|feed/i.test(`${a.href} ${a.textContent}`));
    if (isFeeds) {
      p.classList.add('feed-links');
    } else if (/©/.test(p.textContent)) {
      p.classList.add('copyright-notice');
    } else if (p.textContent.trim()) {
      p.classList.add('copyright-text');
    }
  });

  const notice = section.querySelector('.copyright-notice');
  const feeds = section.querySelector('.feed-links');
  if (notice && feeds) {
    const row = document.createElement('div');
    row.className = 'legal-row';
    notice.replaceWith(row);
    row.append(notice, feeds);
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // tag the three authored sections in order: social / nav / legal
  const sections = ['footer-social', 'footer-nav', 'footer-legal'];
  sections.forEach((cls, i) => footer.children[i]?.classList.add(cls));

  const social = footer.querySelector('.footer-social');
  if (social) decorateSocial(social);

  const nav = footer.querySelector('.footer-nav');
  if (nav) {
    // promote the authored column list out of its default-content wrapper and wrap in a landmark
    const list = nav.querySelector('ul');
    const navEl = document.createElement('nav');
    navEl.setAttribute('aria-label', 'Footer');
    if (list) navEl.append(list);
    nav.textContent = '';
    nav.append(navEl);
  }

  const legal = footer.querySelector('.footer-legal');
  if (legal) decorateLegal(legal);

  block.append(footer);
  decorateIcons(block);
}
