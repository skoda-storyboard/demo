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
 * Links keep their source targets as absolute live URLs (authoredHref); the importers' link rule
 * (transformers/skoda-links.js) makes the ones whose target is a demo page site-relative
 * (SKODA-1001). Sections are separated by <hr> (DA section breaks). Used by import-locale-nav /
 * -newsletter / -footer.
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

/**
 * A source href as authored, absolute: a live-host link (or a root-relative one) points at the
 * live page. The importers then run the shared link rule (transformers/skoda-links.js), which
 * makes a link site-relative only when its target is a demo page; the rest keep opening the
 * live site (SKODA-1001: decided at import, page by page as translations arrive). #… stays.
 */
export function authoredHref(href) {
  if (!href) return '';
  if (href.startsWith('#')) return href; // in-page controls (#subscribe, #newsletter)
  try {
    const url = new URL(href, 'https://www.skoda-storyboard.com');
    // the source's per-request analytics fragments (#s_aid= / #s_cid=) rotate on every fetch
    if (/^#s_[ac]id=/.test(url.hash)) url.hash = '';
    if (LIVE_HOST.test(url.hostname)) return `https://www.skoda-storyboard.com${url.pathname}${url.search}${url.hash}`;
    return url.href;
  } catch (e) {
    return href;
  }
}

/**
 * A source language link fit for a nav every page of the locale shares, else '': a locale's home
 * or Media Room home (`/cs/`, `/cs/media-room/`), or another site (the German Media Room,
 * skoda-media.de). A story's language links name that story's translations, not the locale.
 */
export function siteWideLocaleHref(href) {
  try {
    const url = new URL(href, 'https://www.skoda-storyboard.com');
    if (!/^https?:$/.test(url.protocol)) return '';
    if (!LIVE_HOST.test(url.hostname)) return url.href;
    return /^\/[a-z]{2}\/(?:media-room\/?)?$/i.test(url.pathname) ? href : '';
  } catch (e) {
    return '';
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
    const hasSubs = !!li.querySelector(':scope > ul > li > a, :scope > div ul > li > a');
    // a `#` parent with sub-items is a menu heading (the Media Room's Models, Company: text, as
    // /media-room/nav); a `#` item without them, or a newsletter link, is the Subscribe control
    if ((/^#/.test(href) && !hasSubs) || /newsletter/i.test(href)) {
      if (!newsletter) return;
      item.append(para(document, link(document, '#newsletter', text(top))));
      ul.append(item);
      return;
    }
    const subs = [];
    li.querySelectorAll(':scope > ul > li > a, :scope > div ul > li > a').forEach((a) => {
      const sub = { href: authoredHref(a.getAttribute('href')), label: text(a), heading: a.parentElement.classList.contains('heading') };
      const prev = subs[subs.length - 1];
      if (prev && prev.href === sub.href && prev.label === sub.label) return; // desktop + mobile copies
      subs.push(sub);
    });
    // a `#` parent (the German Modelle / Lifestyle) is a text heading in the nav. In the footer it
    // links to its first link, as the source's phone footer does; the footer block hides it once
    // the columns open, where that link shows first (footer-sections.js, SKODA-1001)
    if (!/^#?$/.test(href)) item.append(para(document, link(document, href, text(top))));
    else if (!keepHeading && subs.length) item.append(para(document, link(document, subs[0].href, text(top))));
    else item.append(para(document, text(top)));
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
    if (item.children.length) ul.append(item); // a footer `#` parent with no links adds nothing
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
  // the source's own locale links when it has them (the Media Room's point at each locale's Media
  // Room, German at skoda-media.de), else each locale's home (SKODA-1001)
  const sourceLocale = new Map([...(topbar ? topbar.querySelectorAll('.lang-links a[href]') : [])]
    .map((a) => [text(a).toLowerCase(), siteWideLocaleHref(a.getAttribute('href'))])
    .filter(([, href]) => href));
  LOCALE_ROW.forEach(([code, label], i) => {
    if (i) locales.append(' ');
    if (code === locale) {
      const strong = document.createElement('strong');
      strong.textContent = label;
      locales.append(strong);
    } else {
      locales.append(link(document, sourceLocale.get(label.toLowerCase()) || sourceLocale.get(code) || `/${code}/`, label));
    }
  });
  root.append(switcher);
  // some locales have no Subscribe in the topbar (DE / SK / SR): none is authored then
  if (text(subscribe)) root.append(para(document, link(document, '#subscribe', text(subscribe))));
  root.append(locales);
  root.append(document.createElement('hr'));
  // 2) brand
  const logo = document.querySelector('header a.logo');
  // the Media Room's brand, as /media-room/nav (SKODA-1001); the Storyboard's otherwise
  const mediaRoom = !!(document.body && document.body.classList.contains('media-room'));
  const brand = mediaRoom ? ['Škoda Media Room', 'Škoda Media Room, home'] : ['Škoda Storyboard', 'Škoda Storyboard'];
  root.append(para(document, link(document, logo ? logo.getAttribute('href') : `/${locale}/`, ...brand)));
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

/**
 * A section's own nav (SKODA-843: `/sustainability/nav`, the Sustainable Offices header): 3
 * sections, topbar --- brand --- search, no menu. The topbar keeps every source tab (Stories |
 * Media Room | Sustainability) and the source's own locale links (EN, CZ to the Czech page).
 * The source points its Sustainability tab and logo at `/en/?page_id=320705`, a 404 on live:
 * such a link becomes `page`, the page the header was read from.
 */
export function buildSectionNav(document, page) {
  const root = document.createElement('div');
  const pageHref = (href) => (/[?&]page_id=/.test(href || '') ? page : href);
  const switcher = document.createElement('ul');
  document.querySelectorAll('.topbar .section-nav a').forEach((a) => {
    const li = document.createElement('li');
    li.append(link(document, pageHref(a.getAttribute('href')), text(a)));
    switcher.append(li);
  });
  // the header tells this 3-row nav by its tab list (header.js): without tabs DA would drop the
  // empty list and the header would read the topbar as the brand row (#843 review)
  if (!switcher.children.length) throw new Error('buildSectionNav: the source topbar has no section tabs');
  root.append(switcher);
  const lang = document.querySelector('.topbar .lang-links');
  if (lang) {
    const locales = document.createElement('p');
    // the current language is a <span> on the source, which the import may already have dropped
    if (![...lang.children].some((el) => !el.matches('a'))) {
      const strong = document.createElement('strong');
      strong.textContent = (page.split('/')[1] || 'en').toUpperCase();
      locales.append(strong);
    }
    [...lang.children].forEach((el) => {
      if (locales.childNodes.length) locales.append(' ');
      if (el.matches('a')) {
        locales.append(link(document, el.getAttribute('href'), text(el).toUpperCase()));
      } else {
        const strong = document.createElement('strong');
        strong.textContent = text(el).toUpperCase();
        locales.append(strong);
      }
    });
    root.append(locales);
  }
  root.append(document.createElement('hr'));
  const logo = document.querySelector('header a.logo');
  root.append(para(document, link(document, pageHref(logo ? logo.getAttribute('href') : page), 'Škoda Storyboard', logo?.getAttribute('title') || 'Škoda Storyboard')));
  root.append(document.createElement('hr'));
  const form = document.querySelector('.search-bar form.search-form');
  const label = (document.querySelector('.search-bar input[type="search"]') || {}).placeholder || 'Search';
  root.append(para(document, link(document, form ? form.getAttribute('action') : '/en/search', label, label)));
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
/**
 * The Media Room footer's widgets (Contacts, Subscribe, Company), as the middle section of
 * /media-room/footer: each widget's heading as an h2, the Contacts menu as a list, the mail form
 * as a `Newsletter Stub` (its intro before it), the Company text as paragraphs (SKODA-1001).
 */
function footerWidgets(document, widgets, { locale, message }) {
  const out = [];
  // top-level widgets only: a widget can sit in another's text (the Slovak Subscribe form)
  widgets.querySelectorAll(':scope > section.widget, :scope > section.widget_text').forEach((widget) => {
    const heading = text(widget.querySelector('.heading'));
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = heading;
      out.push(h2);
    }
    const menu = widget.querySelector('ul.menu');
    if (menu) {
      const ul = document.createElement('ul');
      menu.querySelectorAll(':scope > li > a').forEach((a) => {
        const li = document.createElement('li');
        li.append(link(document, a.getAttribute('href'), text(a)));
        ul.append(li);
      });
      out.push(ul);
      return;
    }
    const form = widget.querySelector('form.mailguide-form');
    if (form) {
      // its intro is a paragraph beside the form: in the widget itself, or in the subscribe
      // section the Slovak footer nests in its text widget (#485 review: `.widget_text >
      // .textwidget > section.skoda-mailguide > p + form`)
      let intro = null;
      for (let node = form.parentElement; node && !text(intro); node = node.parentElement) {
        intro = node.querySelector(':scope > p');
        if (node === widget) break;
      }
      if (text(intro)) out.push(para(document, text(intro)));
      const consent = document.createElement('div');
      const label = form.querySelector('label[for]');
      if (label) {
        const copy = label.cloneNode(true);
        copy.querySelectorAll('input').forEach((el) => el.remove());
        copy.querySelectorAll('a').forEach((a) => {
          a.setAttribute('href', authoredHref(a.getAttribute('href')));
          ['class', 'target', 'rel'].forEach((attr) => a.removeAttribute(attr));
        });
        consent.innerHTML = copy.innerHTML.replace(/\s+/g, ' ').trim();
      }
      const manageSource = form.querySelector('.manage-subscription-link a');
      const value = (sel) => (form.querySelector(sel) || {}).value || '';
      const placeholder = (form.querySelector('input[type="email"]') || {}).placeholder || '';
      out.push(WebImporter.DOMUtils.createTable([
        ['Newsletter Stub'],
        ['label', placeholder],
        ['placeholder', placeholder],
        ['button', text(form.querySelector('button'))],
        ['consent', consent],
        ['manage', manageSource ? link(document, manageSource.getAttribute('href'), text(manageSource)) : ''],
        ['message', message || ''],
        ['list', value('input[name="list"]')],
        ['language', value('input[name="language"]') || NEWSLETTER_LANGUAGE[locale] || ''],
      ], document));
      return;
    }
    widget.querySelectorAll('.textwidget p').forEach((p) => {
      if (text(p)) out.push(para(document, text(p)));
    });
  });
  return out;
}

export function buildFooter(document, locale = 'en', { message } = {}) {
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
  // 2) menu (the repeated parent headings dropped, no Newsletter item, as /footer); the Media
  // Room's footer has its widgets there instead (Contacts, Subscribe, Company); a footer with
  // neither (the Sustainable Offices page, SKODA-843) has 2 sections
  // the `.footer-widgets` with the widget sections (the first one holds the app badges and socials)
  const widgets = [...footer.querySelectorAll('.footer-widgets')].find((w) => w.querySelector('section.widget'));
  const menu = footer.querySelector('.footer-nav ul.menu');
  if (widgets) root.append(...footerWidgets(document, widgets, { locale, message }));
  else if (menu) root.append(menuList(document, menu, { keepHeading: false, newsletter: false }));
  if (widgets || menu) root.append(document.createElement('hr'));
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
