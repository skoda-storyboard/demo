/*
 * Footer section decorators (SKODA-304 / SKODA-305). Pure DOM helpers with no aem.js or
 * fragment dependency, so they unit-test in plain node (see footer.test.mjs).
 */

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
function decorateNav(section) {
  const list = section.querySelector('ul');
  const navEl = document.createElement('nav');
  navEl.setAttribute('aria-label', 'Footer');
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
  items.forEach((el) => {
    const isHeading = /^H[2-6]$/.test(el.tagName);
    // the pipeline's auto ids ("contacts", "company") would collide with page headings
    if (isHeading) el.removeAttribute('id');
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
 * Tags and decorates the three authored footer sections, in order: social / middle / legal.
 * The middle section is the Storyboard sitemap, or — when it carries headings — the Media Room
 * widget columns.
 * @param {Element} footer container whose children are the fragment sections
 */
export default function decorateFooterSections(footer) {
  const [social, middle, legal] = footer.children;

  if (social) {
    social.classList.add('footer-social');
    decorateSocial(social);
  }

  if (middle?.querySelector('h2, h3, h4, h5, h6')) {
    middle.classList.add('footer-widgets');
    decorateColumns(middle);
  } else if (middle) {
    middle.classList.add('footer-nav');
    decorateNav(middle);
  }

  if (legal) {
    legal.classList.add('footer-legal');
    decorateLegal(legal);
  }
}
