/* eslint-disable */
/* global WebImporter */

/**
 * SKODA-303a: the translated chrome fragments of a locale (`/{locale}/nav`,
 * `/{locale}/nav-newsletter`, `/{locale}/footer`), built from the source header / footer of
 * any page in that locale, in the SAME shape as the authored English fragments (`/nav`,
 * `/nav-newsletter`, `/footer`) the header and footer blocks decorate:
 *
 *   nav:        topbar (Stories | Media Room, Subscribe, locale row) --- brand --- menu --- search
 *   newsletter: one Newsletter Stub (topbar) block (label … language rows)
 *   footer:     app badges + social icons --- menu --- notice, ©, feeds
 *
 * Links keep their source targets as site paths (`/cs/category/modely-cs/`); the site's link
 * policy (scripts/links.js) sends the ones the demo doesn't carry to the live site. Sections
 * are separated by <hr> (DA section breaks). Used by import-locale-nav / -newsletter / -footer.
 */

const LIVE_HOST = /^(?:www\.)?skoda-storyboard\.com$/i;
const LOCALE_ROW = [['en', 'EN'], ['cs', 'CZ'], ['de', 'DE'], ['sk', 'SK'], ['sr', 'SR'], ['sl', 'SL']];
// the source's language codes for the newsletter list (the English fragment uses en_GB)
const NEWSLETTER_LANGUAGE = { cs: 'cs_CZ', de: 'de_DE', sk: 'sk_SK', sr: 'sr_RS', sl: 'sl_SI' };

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

/** The locale of a source URL: its first path segment. */
export function localeOfUrl(url) {
  return (new URL(url).pathname.split('/')[1] || 'en').toLowerCase();
}

/** A source href as authored: the live host's links become site paths; others stay. */
export function authoredHref(href) {
  if (!href) return '';
  if (href.startsWith('#')) return href; // in-page controls (#subscribe, #newsletter)
  try {
    const url = new URL(href, 'https://www.skoda-storyboard.com');
    if (LIVE_HOST.test(url.hostname)) return `${url.pathname}${url.search}${url.hash}`;
    return url.href;
  } catch (e) {
    return href;
  }
}

function link(document, href, label, title) {
  const a = document.createElement('a');
  a.href = authoredHref(href);
  a.textContent = label;
  if (title) a.title = title;
  return a;
}

function para(document, ...children) {
  const p = document.createElement('p');
  children.forEach((c, i) => {
    if (i) p.append(' ');
    p.append(c);
  });
  return p;
}

/** The menu list: top items with their sub-items; `keepHeading` keeps the repeated parent. */
function menuList(document, source, { keepHeading, newsletter }) {
  const ul = document.createElement('ul');
  [...source.querySelectorAll(':scope > li')].forEach((li) => {
    const top = li.querySelector(':scope > a');
    if (!top) return;
    const item = document.createElement('li');
    const href = top.getAttribute('href') || '';
    if (/^#/.test(href) || /newsletter/i.test(href)) {
      if (!newsletter) return;
      item.append(para(document, link(document, '#newsletter', text(top))));
      ul.append(item);
      return;
    }
    item.append(para(document, link(document, href, text(top))));
    const subs = [];
    li.querySelectorAll(':scope > ul > li > a, :scope > div ul > li > a').forEach((a) => {
      const sub = { href: authoredHref(a.getAttribute('href')), label: text(a), heading: a.parentElement.classList.contains('heading') };
      const prev = subs[subs.length - 1];
      if (prev && prev.href === sub.href && prev.label === sub.label) return; // desktop + mobile copies
      subs.push(sub);
    });
    const kept = subs.filter((s, i) => keepHeading || !(s.heading || (i === 0 && s.href === authoredHref(href))));
    if (subs.length > 1 && kept.length) {
      const subList = document.createElement('ul');
      kept.forEach((s) => {
        const subItem = document.createElement('li');
        subItem.append(link(document, s.href, s.label));
        subList.append(subItem);
      });
      item.append(subList);
    }
    ul.append(item);
  });
  return ul;
}

/** `/{locale}/nav` (4 sections, as `/nav`). */
export function buildNav(document, locale) {
  const root = document.createElement('div');
  const topbar = document.querySelector('.topbar');
  // 1) topbar: section switcher, Subscribe, locale row
  const switcher = document.createElement('ul');
  [...(topbar ? topbar.querySelectorAll('a') : [])]
    .filter((a) => !a.closest('.lang-links') && !a.classList.contains('topbar__newsletter') && !a.closest('.topbar__dropdown'))
    .slice(0, 2)
    .forEach((a) => {
      const li = document.createElement('li');
      li.append(link(document, a.getAttribute('href'), text(a)));
      switcher.append(li);
    });
  const subscribe = document.querySelector('.topbar__newsletter');
  const locales = document.createElement('p');
  LOCALE_ROW.forEach(([code, label], i) => {
    if (i) locales.append(' ');
    if (code === locale) {
      const strong = document.createElement('strong');
      strong.textContent = label;
      locales.append(strong);
    } else {
      locales.append(link(document, `/${code}/`, label));
    }
  });
  root.append(switcher);
  // some locales have no Subscribe in the topbar (DE / SK / SR): none is authored then
  if (text(subscribe)) root.append(para(document, link(document, '#subscribe', text(subscribe))));
  root.append(locales);
  root.append(document.createElement('hr'));
  // 2) brand
  const logo = document.querySelector('header a.logo');
  root.append(para(document, link(document, logo ? logo.getAttribute('href') : `/${locale}/`, 'Škoda Storyboard', 'Škoda Storyboard')));
  root.append(document.createElement('hr'));
  // 3) menu
  const menu = document.querySelector('nav.topnav > ul, nav.topnav ul');
  if (menu) root.append(menuList(document, menu, { keepHeading: true, newsletter: true }));
  root.append(document.createElement('hr'));
  // 4) search: the source form's action, its placeholder as the label
  const form = document.querySelector('.search-bar form.search-form');
  const label = (document.querySelector('.search-bar input[type="search"]') || {}).placeholder || 'Search';
  root.append(para(document, link(document, form ? form.getAttribute('action') : `/${locale}/search`, label, label)));
  return root;
}

/** `/{locale}/nav-newsletter`: the Newsletter Stub (topbar) rows, as `/nav-newsletter`. */
export function buildNewsletter(document, locale, { message } = {}) {
  const form = document.querySelector('.topbar__dropdown__newsletter form');
  const root = document.createElement('div');
  if (!form) return root;
  const consentLabel = form.querySelector('.terms label');
  const consent = document.createElement('div');
  if (consentLabel) {
    const copy = consentLabel.cloneNode(true);
    copy.querySelectorAll('.manage-subscription-link, input').forEach((el) => el.remove());
    copy.querySelectorAll('a').forEach((a) => {
      a.setAttribute('href', authoredHref(a.getAttribute('href')));
      ['class', 'target', 'rel'].forEach((attr) => a.removeAttribute(attr));
    });
    consent.innerHTML = copy.innerHTML.replace(/\s+/g, ' ').trim();
  }
  const manageSource = form.querySelector('.manage-subscription-link a');
  const manage = manageSource ? link(document, manageSource.getAttribute('href'), text(manageSource)) : '';
  const value = (sel) => (form.querySelector(sel) || {}).value || '';
  const cells = [
    ['Newsletter Stub (topbar)'],
    ['label', text(form.querySelector('label[for]'))],
    ['placeholder', (form.querySelector('input[type="email"]') || {}).placeholder || ''],
    ['button', text(form.querySelector('.topbar__dropdown__newsletter-form button'))],
    ['consent', consent],
    ['manage', manage],
    ['message', message || ''],
    ['list', value('input[name="list"]')],
    ['language', value('input[name="language"]') || NEWSLETTER_LANGUAGE[locale] || ''],
  ];
  root.append(WebImporter.DOMUtils.createTable(cells, document));
  return root;
}

/** `/{locale}/footer` (3 sections, as `/footer`). */
export function buildFooter(document) {
  const footer = document.querySelector('footer');
  const root = document.createElement('div');
  if (!footer) return root;
  // 1) app badges + social icons (the site icons; `:name:` becomes the icon on EDS)
  const iconLink = (href, name) => {
    const a = document.createElement('a');
    a.href = authoredHref(href);
    a.title = name;
    a.textContent = `:${name}:`;
    return a;
  };
  const badges = [...footer.querySelectorAll('.app-download-buttons a')].map((a) => iconLink(
    a.getAttribute('href'),
    /apple/i.test(a.getAttribute('href') || '') ? 'appstore' : 'googleplay',
  ));
  const socials = [...footer.querySelectorAll('.social-links a')].map((a) => iconLink(
    a.getAttribute('href'),
    ((a.className.match(/icon-([a-z]+)/) || [])[1] || text(a)).toLowerCase(),
  ));
  root.append(para(document, ...badges), para(document, ...socials));
  root.append(document.createElement('hr'));
  // 2) menu (the repeated parent headings dropped, no Newsletter item, as /footer)
  const menu = footer.querySelector('.footer-nav ul.menu');
  if (menu) root.append(menuList(document, menu, { keepHeading: false, newsletter: false }));
  root.append(document.createElement('hr'));
  // 3) the notice with its links, ©, feeds
  const notice = footer.querySelector('.copyright-text p');
  if (notice) {
    const p = document.createElement('p');
    p.innerHTML = notice.innerHTML.replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').trim();
    p.querySelectorAll('a').forEach((a) => {
      a.setAttribute('href', authoredHref(a.getAttribute('href')));
      ['class', 'target', 'rel'].forEach((attr) => a.removeAttribute(attr));
    });
    root.append(p);
  }
  root.append(para(document, text(footer.querySelector('.copyright-notice'))));
  const feeds = [...footer.querySelectorAll('.feed-links a')].map((a) => link(document, a.getAttribute('href'), text(a)));
  if (feeds.length) root.append(para(document, ...feeds));
  return root;
}
