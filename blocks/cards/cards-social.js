/*
 * Cards (social) — SKODA-217: the homepage "Social media" follow-profile cards.
 *
 * Authored as one row per profile, one cell holding a link whose text is the
 * visible handle, so DA authors edit only the destination and the handle:
 *
 *   | Cards (social)                                            |
 *   | [@skodaglobal](https://www.facebook.com/skodaglobal/)     |
 *   | [@skodagram](https://www.instagram.com/skodagram/)        |
 *   | [@skoda](https://www.youtube.com/@skoda)                  |
 *
 * The network (icon + accessible name) is read FROM the link's host, never the
 * other way round, and nothing is fetched from social APIs. A link to an
 * unknown host still renders a labelled card, just without an icon; a row
 * without an http(s) link is skipped (authors omit and add cells).
 *
 * Loaded on demand by cards.js only for `.cards.social`, so ordinary card
 * grids don't pay for the icon data.
 */

// i18n: the single translation point for this variant's control text
const LABELS = {
  newTab: 'opens in a new tab',
};

// Icons are the source's square profile tiles (logo knocked out of a filled
// square, 242.667 viewBox), drawn in currentColor so the CSS owns the colour.
const NETWORKS = {
  facebook: {
    name: 'Facebook',
    hosts: ['facebook.com', 'fb.com'],
    path: 'M0,0v242.667h242.667V0H0z M154.969,117.424H129.07v86.493h-28.342v-86.493H81.833V98.041h19.058V67.08 c0-15.646,12.684-28.33,28.33-28.33h27.377v24.596h-19.722c-4.311,0-7.806,3.495-7.806,7.806v26.889h31.763L154.969,117.424z',
  },
  instagram: {
    name: 'Instagram',
    hosts: ['instagram.com'],
    path: 'M168.496,111.025h15.219v65.454c0,3.996-3.24,7.236-7.236,7.236H66.188c-3.996,0-7.236-3.24-7.236-7.236v-65.454h15.219 c-0.723,3.323-1.115,6.769-1.115,10.308c0,26.663,21.614,48.277,48.277,48.277c26.663,0,48.277-21.614,48.277-48.277 C169.61,117.794,169.219,114.347,168.496,111.025z M121.333,153.852c17.959,0,32.518-14.559,32.518-32.518 c0-17.959-14.559-32.518-32.518-32.518c-17.959,0-32.518,14.559-32.518,32.518C88.815,139.293,103.374,153.852,121.333,153.852z M160.293,87.937h12.385c3.631,0,6.575-2.944,6.575-6.575V68.978c0-3.631-2.943-6.574-6.575-6.574h-12.385 c-3.631,0-6.574,2.943-6.574,6.574v12.385C153.719,84.994,156.662,87.937,160.293,87.937z M242.667,0v242.667H0V0H242.667z M198.623,63.539c0-10.766-8.728-19.494-19.494-19.494H63.539c-10.766,0-19.494,8.728-19.494,19.494v115.59 c0,10.766,8.728,19.494,19.494,19.494h115.59c10.766,0,19.494-8.728,19.494-19.494V63.539z',
  },
  youtube: {
    name: 'YouTube',
    hosts: ['youtube.com', 'youtu.be'],
    path: 'M106.955,94.325l39.161,27.008l-39.161,27.008V94.325z M242.667,0v242.667H0V0H242.667z M190.25,101.494 c0-16.378-13.277-29.655-29.655-29.655H82.072c-16.378,0-29.655,13.277-29.655,29.655v39.679c0,16.378,13.277,29.655,29.655,29.655 h78.523c16.378,0,29.655-13.277,29.655-29.655V101.494z',
  },
};

/**
 * The social network a profile URL points at, from its host (www. and
 * sub-domains such as m.facebook.com included).
 * @param {string} href the authored link
 * @returns {string|null} a NETWORKS key, or null for any other host / bad URL
 */
export function networkOf(href) {
  let host;
  try {
    host = new URL(href, 'https://example.invalid').hostname.toLowerCase();
  } catch {
    return null;
  }
  return Object.keys(NETWORKS).find((key) => NETWORKS[key].hosts
    .some((h) => host === h || host.endsWith(`.${h}`))) || null;
}

/**
 * The authored link as an absolute external http(s) URL; anything else
 * (javascript:, mailto:, relative, malformed) is not a profile link.
 * @param {string} href the authored link
 * @returns {URL|null}
 */
export function profileUrl(href) {
  try {
    const url = new URL(href);
    return /^https?:$/.test(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

/**
 * Accessible name for a profile link. It contains the visible handle (label in
 * name, WCAG 2.5.3), the network, and that the link opens a new tab.
 * @param {string|null} network a NETWORKS key
 * @param {string} handle the visible handle, e.g. "@skodaglobal"
 * @returns {string}
 */
export function socialLabel(network, handle) {
  const name = network ? NETWORKS[network].name : '';
  return `${[name, handle].filter(Boolean).join(' ')} (${LABELS.newTab})`;
}

function socialIcon(network) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'card-teaser-social-icon');
  svg.setAttribute('viewBox', '0 0 242.667 242.667');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', NETWORKS[network].path);
  svg.append(path);
  return svg;
}

/**
 * Turn the authored rows into social profile cards: one card per row, each a
 * single external link (icon + handle) that opens in a new tab safely.
 * @param {Element} block the `.cards.social` block
 */
export default function decorateSocialCards(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const authored = row.querySelector('a[href]');
    const url = authored && profileUrl(authored.getAttribute('href'));
    if (!url) return;
    // an empty link text still gets a visible, nameable handle: the host
    const handle = authored.textContent.trim() || url.hostname.replace(/^www\./, '');
    const network = networkOf(url.href);

    const li = document.createElement('li');
    li.className = 'card-teaser social';
    const link = document.createElement('a');
    link.className = 'card-teaser-social-link';
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', socialLabel(network, handle));
    if (network) link.append(socialIcon(network));
    const text = document.createElement('span');
    text.className = 'card-teaser-social-handle';
    text.textContent = handle;
    link.append(text);
    li.append(link);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
