/*
 * Footer section decorators (SKODA-304 / SKODA-305). Pure DOM helpers with no aem.js or
 * fragment dependency, so they unit-test in plain node (see footer.test.mjs).
 */

import { opensInSameTab } from '../../scripts/links.js';

// social network → accessible label + hover-tint class, keyed by icon token name
const SOCIAL_NAMES = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
};

// UI text (SKODA-1003): English names, read from the page locale's placeholders sheet as
// `footer…` (footer.js passes them in); the networks' names above are brand names
export const FOOTER_LABELS = {
  nav: 'Footer',
  appStore: 'Škoda Media Room on the App Store',
  googlePlay: 'Škoda Media Room on Google Play',
};

// app-store badge → its FOOTER_LABELS key, keyed by icon token name
const APP_BADGE_KEYS = { appstore: 'appStore', googleplay: 'googlePlay' };

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
function decorateSocial(section, labels = FOOTER_LABELS) {
  const anchors = [...section.querySelectorAll('a')];
  const socialIcons = [];
  const appBadges = [];

  anchors.forEach((a) => {
    const name = iconNameOf(a);
    if (name && SOCIAL_NAMES[name]) {
      a.classList.add('social-link', `social-${name}`);
      a.setAttribute('aria-label', SOCIAL_NAMES[name]);
      socialIcons.push(a);
    } else if (name && APP_BADGE_KEYS[name]) {
      a.classList.add('app-badge');
      a.setAttribute('aria-label', labels[APP_BADGE_KEYS[name]]);
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

  // drop the paragraphs (and wrapper) the icon links were moved out of, so they add no rhythm;
  // an authored title paragraph is kept
  section.querySelectorAll('.default-content-wrapper > p').forEach((p) => {
    if (!p.textContent.trim() && !p.children.length) p.remove();
  });
  section.querySelectorAll('.default-content-wrapper:empty').forEach((w) => w.remove());
}

/**
 * Storyboard middle section: promotes the authored sitemap list out of its default-content
 * wrapper and wraps it in a navigation landmark.
 * @param {Element} section
 */
function decorateNav(section, labels = FOOTER_LABELS) {
  const list = section.querySelector('ul');
  const navEl = document.createElement('nav');
  navEl.setAttribute('aria-label', labels.nav);
  if (list) navEl.append(list);
  section.textContent = '';
  section.append(navEl);
}

/**
 * Media Room middle section (SKODA-305): splits the authored widgets into one column per
 * heading (Contacts / Subscribe / Company). Default content and already-decorated blocks
 * (e.g. the newsletter form) keep their authored order inside their column.
 * @param {Element} section
 */
function decorateColumns(section) {
  const items = [...section.children].flatMap((wrapper) => (
    wrapper.classList.contains('default-content-wrapper') ? [...wrapper.children] : [wrapper]
  ));
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  let column;
  items.forEach((item) => {
    let el = item;
    const isHeading = /^H[2-6]$/.test(el.tagName);
    // the pipeline's auto ids ("contacts", "company") would collide with page headings
    if (isHeading) el.removeAttribute('id');
    // the source's widget titles are h3 (#275); the fragment authors them as h2
    if (el.tagName === 'H2') {
      const h3 = document.createElement('h3');
      h3.append(...el.childNodes);
      el = h3;
    }
    if (!column || isHeading) {
      column = document.createElement('div');
      column.className = 'footer-column';
      columns.append(column);
    }
    column.append(el);
  });
  section.textContent = '';
  section.append(columns);
}

/**
 * The © notice's year as the current one (the authored footers say "2026"; G-KT-10,
 * SKODA-1003): the first 4-digit year after the ©, or the end of a range that directly follows
 * it ("2019–2025" keeps its start). An open range ("2019 – present"), a later year the author
 * set on purpose and any year further on ("Founded 1991") stay as they are.
 * @param {Element} notice the copyright notice paragraph
 * @param {number} year the current year
 */
export function updateCopyrightYear(notice, year) {
  if (!Number.isInteger(year)) return;
  const texts = [];
  const collect = (node) => node.childNodes.forEach((child) => {
    if (child.nodeType === 3) texts.push(child);
    else if (child.nodeType === 1) collect(child);
  });
  collect(notice);
  const seen = texts.findIndex((t) => t.textContent.includes('©'));
  if (seen < 0) return;
  // the text after the ©, across the notice's text nodes (a year may sit in a link or <strong>)
  const parts = texts.slice(seen).map((node, i) => ({
    node, from: i === 0 ? node.textContent.indexOf('©') + 1 : 0,
  }));
  let offset = 0;
  parts.forEach((part) => {
    part.start = offset;
    offset += part.node.textContent.length - part.from;
  });
  const after = parts.map((part) => part.node.textContent.slice(part.from)).join('');
  const match = after.match(/((?:19|20)\d{2})(?:(\s*[–—-]\s*)((?:19|20)\d{2}|\p{L}+))?/u);
  if (!match) return;
  const [, first, separator, end] = match;
  let at = match.index;
  let value = first;
  if (end) {
    if (!/^\d/.test(end)) return; // an open range
    at += first.length + separator.length;
    value = end;
  }
  if (Number(value) >= year) return;
  const part = parts.findLast((p) => p.start <= at);
  const local = part.from + at - part.start;
  const text = part.node.textContent;
  // a year split across two nodes is not one the author wrote: leave it
  if (text.slice(local, local + 4) !== value) return;
  part.node.textContent = `${text.slice(0, local)}${year}${text.slice(local + 4)}`;
}

/**
 * Marks the legal section parts (copyright text / notice / feed links) so CSS can style
 * and position them, and wraps the notice + feeds in a flex row.
 * @param {Element} section
 * @param {number} [year] the current year, for the © notice
 */
function decorateLegal(section, year = new Date().getFullYear()) {
  const paras = [...section.querySelectorAll('p')];
  paras.forEach((p) => {
    const links = p.querySelectorAll('a');
    const isFeeds = links.length > 0 && [...links].every((a) => /rss|feed/i.test(`${a.href} ${a.textContent}`));
    if (isFeeds) {
      p.classList.add('feed-links');
    } else if (/©/.test(p.textContent)) {
      p.classList.add('copyright-notice');
      updateCopyrightYear(p, year);
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
 * Outbound links (the app stores, social networks and the skoda-auto.com legal pages) open in a
 * new tab, as on the source (SKODA-306). DA keeps no `target`, so it is set here. Same-site
 * links stay in the tab, and links the link policy already settled when the fragment loaded
 * (scripts/links.js: live-site links → new tab, demo listings → same site) are left as they are.
 * @param {Element} footer
 * @param {string} origin the page origin
 */
export function openOutboundLinks(footer, origin) {
  footer.querySelectorAll('a[href]').forEach((a) => {
    if (a.getAttribute('target')) return;
    let url;
    try {
      url = new URL(a.getAttribute('href'), origin);
    } catch (e) {
      return;
    }
    if (!/^https?:$/.test(url.protocol) || url.origin === origin) return;
    // the live pages the source opens in the tab (the newsletter "Manage subscription")
    if (opensInSameTab(url.href)) return;
    a.setAttribute('target', '_blank');
    const rel = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    a.setAttribute('rel', [...rel].join(' '));
  });
}

/**
 * Tags and decorates the three authored footer sections, in order: social / middle / legal (two:
 * social / legal).
 * The middle section is the Storyboard sitemap, or — when it carries headings — the Media Room
 * widget columns.
 * @param {Element} footer container whose children are the fragment sections
 * @param {string} [origin] the page origin, for the outbound-link rule
 * @param {{labels?: typeof FOOTER_LABELS, year?: number}} [options] the locale's names (English
 *   by default) and the current year (for the © notice)
 */
export default function decorateFooterSections(
  footer,
  origin = typeof window !== 'undefined' ? window.location?.origin : '',
  { labels = FOOTER_LABELS, year = new Date().getFullYear() } = {},
) {
  // a footer without the middle section (the Sustainable Offices footer, SKODA-843): social, legal
  const sections = [...footer.children];
  const [social, middle, legal] = sections.length === 2
    ? [sections[0], null, sections[1]]
    : sections;

  if (social) {
    social.classList.add('footer-social');
    decorateSocial(social, labels);
  }

  if (middle?.querySelector('h2, h3, h4, h5, h6')) {
    middle.classList.add('footer-widgets');
    decorateColumns(middle);
  } else if (middle) {
    middle.classList.add('footer-nav');
    decorateNav(middle, labels);
  }

  if (legal) {
    legal.classList.add('footer-legal');
    decorateLegal(legal, year);
  }

  if (origin) openOutboundLinks(footer, origin);
}
