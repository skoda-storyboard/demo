import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import attachSuggest from '../../scripts/search-suggest.js';
import { hrefPath, pickActiveTab } from './header-switcher.js';
import {
  buildLocaleList, currentLocale, isLocaleGroup, localeEntries,
} from './header-locales.js';

// desktop >= 1080px per source ladder (SKODA-301); below is the drawer band (SKODA-302)
const isDesktop = window.matchMedia('(min-width: 1080px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    // desktop: the open dropdown, or the one shown because focus is inside it (:focus-within)
    // or the pointer is over it (:hover), which must be dismissible too (WCAG 1.4.13)
    const shown = navSectionExpanded || document.activeElement?.closest?.('.nav-drop')
      || navSections.querySelector('.nav-drop:hover');
    if (shown && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      // dismissed until focus / the pointer leaves it, so :focus-within / :hover can't keep it
      // on screen; focus only moves for a dropdown opened from the keyboard (not under the mouse)
      shown.dataset.dismissed = 'true';
      const sub = shown.querySelector(':scope > ul');
      if (sub?.contains(document.activeElement)) {
        // focus was on a link of the now hidden panel: back to its trigger, never on hidden links
        // eslint-disable-next-line no-use-before-define
        dropTrigger(shown)?.focus();
      } else if (shown === navSectionExpanded && !shown.contains(document.activeElement)) {
        shown.focus();
      }
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('.nav-hamburger button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

/**
 * Whether a desktop dropdown is on screen while focus is inside it: open, or shown by
 * :focus-within unless dismissed (see the panel rule in header.css).
 * @param {Element} li A top-level nav li
 */
const dropShown = (li) => li.getAttribute('aria-expanded') === 'true' || !li.dataset.dismissed;

/**
 * Shows / hides a focused desktop dropdown (Space, Enter on the li, a click on a text-only
 * parent): one item open at a time; hiding it while focus stays sets data-dismissed so the
 * :focus-within rule can't keep it on screen.
 * @param {Element} li A top-level nav li
 * @param {boolean} open
 */
function setDesktopDrop(li, open) {
  // eslint-disable-next-line no-use-before-define
  toggleAllNavSections(li.closest('.nav-sections'));
  li.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) delete li.dataset.dismissed;
  else li.dataset.dismissed = 'true';
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.classList.contains('nav-drop');
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    e.preventDefault(); // Space would scroll the page
    setDesktopDrop(focused, !dropShown(focused));
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    // eslint-disable-next-line no-use-before-define
    setDropState(section, String(expanded) === 'true');
  });
}

/**
 * The row link of a top-level nav item (`<p><a>` from the fragment, or a bare `<a>`).
 * @param {Element} li A top-level nav li
 * @returns {Element|null}
 */
function dropTrigger(li) {
  return li.querySelector(':scope > p > a, :scope > a');
}

/**
 * Sets a nav item's open state: on the li (the CSS keys off it) and, in the drawer, on its
 * accordion trigger too, so the button a screen reader hears reports the same state.
 * @param {Element} li A top-level nav li
 * @param {boolean} open Whether its sub-menu is open
 */
function setDropState(li, open) {
  li.setAttribute('aria-expanded', open ? 'true' : 'false');
  const trigger = dropTrigger(li);
  if (trigger?.dataset.drawerTrigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
}

let subMenuCount = 0;

/**
 * Drawer band (SKODA-302): each dropdown parent's row link is an accordion button that
 * controls its sub-menu (`role="button"`, `aria-expanded`, `aria-controls`). From 1080 the
 * link goes back to its desktop form (SKODA-301 hover/keyboard dropdown), including the
 * `role="button"` a text-only parent already had (linkDropLabel).
 * @param {Element} navSections The nav sections container
 * @param {boolean} drawer Whether the drawer band is active
 */
function setDropTriggers(navSections, drawer) {
  navSections?.querySelectorAll('.nav-drop').forEach((li) => {
    const trigger = dropTrigger(li);
    const sub = li.querySelector(':scope > ul');
    if (!trigger || !sub) return;
    if (!('desktopRole' in trigger.dataset)) trigger.dataset.desktopRole = trigger.getAttribute('role') || '';
    if (drawer) {
      if (!sub.id) {
        subMenuCount += 1;
        sub.id = `nav-sub-${subMenuCount}`;
      }
      trigger.dataset.drawerTrigger = 'true';
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-controls', sub.id);
      trigger.setAttribute('aria-expanded', li.getAttribute('aria-expanded') === 'true' ? 'true' : 'false');
    } else {
      delete trigger.dataset.drawerTrigger;
      if (trigger.dataset.desktopRole) trigger.setAttribute('role', trigger.dataset.desktopRole);
      else trigger.removeAttribute('role');
      trigger.removeAttribute('aria-controls');
      trigger.removeAttribute('aria-expanded');
    }
  });
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]';

/**
 * What Tab can reach while the drawer is open: the visible controls of the nav and of the
 * section switcher above it (the topbar is outside <nav> but stays on screen).
 * @param {Element} nav The nav element
 * @returns {Element[]}
 */
function drawerFocusables(nav) {
  const scope = nav.closest('.nav-wrapper') || nav;
  // checkVisibility also drops the links of a collapsed sub-menu (visibility: hidden)
  const shown = (el) => (el.checkVisibility
    ? el.checkVisibility({ visibilityProperty: true })
    : el.getClientRects().length > 0);
  return [...scope.querySelectorAll(FOCUSABLE)].filter((el) => el.tabIndex >= 0 && shown(el));
}

/**
 * Focus trap of the open drawer: Tab / Shift+Tab cycle inside it (SKODA-302 §6).
 * @param {KeyboardEvent} e
 */
function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const nav = document.getElementById('nav');
  if (!nav || isDesktop.matches || nav.getAttribute('aria-expanded') !== 'true') return;
  const focusables = drawerFocusables(nav);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const inside = focusables.includes(document.activeElement);
  if (e.shiftKey && (document.activeElement === first || !inside)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * A tap or click outside the open drawer (its blurred backdrop) closes it and returns focus
 * to the hamburger. The focus trap keeps focus inside, so focusout can't do this any more.
 * `click` (not pointerdown): it fires after the browser has moved focus for the press, so
 * the hamburger keeps it.
 * @param {MouseEvent} e
 */
function closeOnPointerOutside(e) {
  const nav = document.getElementById('nav');
  if (!nav || isDesktop.matches || nav.getAttribute('aria-expanded') !== 'true') return;
  const topbar = nav.closest('.nav-wrapper')?.querySelector('.nav-topbar');
  if (nav.contains(e.target) || topbar?.contains(e.target)) return;
  // eslint-disable-next-line no-use-before-define
  toggleMenu(nav, nav.querySelector('.nav-sections'), false);
  nav.querySelector('.nav-hamburger button')?.focus();
}

/**
 * Keep the header search input in the tab order only while it is visible:
 * the desktop pill when expanded, or always inside the open mobile drawer
 * (where CSS shows the field open regardless of the pill's state).
 * @param {Element} nav The container element
 */
function syncSearchTabbable(nav) {
  const bar = nav.querySelector('.nav-search');
  const input = bar?.querySelector('.nav-search-input');
  if (!input) return;
  const drawerOpen = !isDesktop.matches && nav.getAttribute('aria-expanded') === 'true';
  const open = bar.classList.contains('nav-search-open');
  input.tabIndex = (drawerOpen || open) ? 0 : -1;
  // the scope select is desktop-only (the drawer row is the field alone, as on the source)
  const scope = bar.querySelector('.nav-search-type');
  if (scope) scope.tabIndex = (open && !drawerOpen) ? 0 : -1;
}

// search scopes of the source header form (value = its `search_type`)
export const SEARCH_SCOPES = [
  ['', 'All'],
  ['post', 'Stories'],
  ['press_release', 'News'],
  ['press_kit', 'Press Kits'],
  ['image', 'Images'],
  ['video', 'Videos'],
];

/**
 * The search scope select (source custom select: All / Stories / News / Press Kits / Images /
 * Videos). A native select, styled as the source's, inside a wrapper that draws its chevron.
 * @param {string} selected The pre-selected scope value
 * @returns {{ wrapper: HTMLElement, select: HTMLSelectElement }}
 */
export function buildSearchScope(selected) {
  const select = document.createElement('select');
  select.className = 'nav-search-type';
  select.setAttribute('aria-label', 'Search in');
  select.tabIndex = -1;
  SEARCH_SCOPES.forEach(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    if (value === selected) option.selected = true;
    select.append(option);
  });
  const wrapper = document.createElement('span');
  wrapper.className = 'nav-search-scope';
  wrapper.append(select);
  return { wrapper, select };
}

/**
 * Whether an authored link resolves to a web page (http / https), so it can be navigated to.
 * @param {string} href
 * @param {string} origin The page origin, for relative hrefs
 * @returns {boolean}
 */
export function isWebUrl(href, origin) {
  try {
    return /^https?:$/.test(new URL(href, origin).protocol);
  } catch {
    return false;
  }
}

/**
 * The results URL: the search page with the query (`filter[search]`, read by SKODA-403) and,
 * as on the source form, the chosen scope (`search_type`, omitted for All).
 * @param {string} path The search page path
 * @param {string} query The trimmed query
 * @param {string} scope The scope value ('' = All)
 * @param {string} origin The page origin
 * @returns {string}
 */
export function searchUrl(path, query, scope, origin) {
  const url = new URL(path, origin);
  url.searchParams.set('filter[search]', query);
  if (scope) url.searchParams.set('search_type', scope);
  return url.href;
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  const drawerOpen = !expanded && !isDesktop.matches;
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  // drawer band: accordion buttons; desktop: the SKODA-301 dropdown links
  setDropTriggers(navSections, !isDesktop.matches);
  // always collapse the accordion sub-menus when opening/closing the drawer
  // (mobile accordions start collapsed; user taps a parent to expand)
  toggleAllNavSections(navSections, 'false');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // the hamburger reports the drawer state itself (SKODA-302 AC), not only the <nav>
  button.setAttribute('aria-expanded', drawerOpen ? 'true' : 'false');
  // the drawer shows the search field, so it must be tabbable while open
  syncSearchTabbable(nav);
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // Escape closes; the open drawer also traps focus and closes on a tap outside (focus
  // can't leave it, so focusout no longer fires there); desktop keeps focusout-close
  window.removeEventListener('keydown', trapFocus);
  document.removeEventListener('click', closeOnPointerOutside);
  if (drawerOpen) {
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('keydown', trapFocus);
    document.addEventListener('click', closeOnPointerOutside);
    nav.removeEventListener('focusout', closeOnFocusLost);
  } else if (isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * Topbar newsletter panel (SKODA-308): the source's "Subscribe to our stories" dropdown. Its
 * form is the `Newsletter Stub (topbar)` block (SKODA-305 / 823: UI only, it posts nothing) of
 * the nav's companion fragment (`{nav}-newsletter`, e.g. /nav-newsletter). Null when the
 * fragment has none: the Subscribe link then stays a plain link.
 * @param {Element|null} fragment The loaded companion fragment
 * @returns {HTMLElement|null}
 */
export function takeNewsletterPanel(fragment) {
  const stub = fragment?.querySelector('.newsletter-stub');
  if (!stub) return null;
  stub.remove();
  const panel = document.createElement('div');
  panel.id = 'nav-newsletter';
  panel.className = 'nav-newsletter-panel';
  panel.hidden = true;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-newsletter-close';
  close.setAttribute('aria-label', 'Close newsletter subscription');
  panel.append(close, stub);
  return panel;
}

/**
 * Replaces a Subscribe link with the panel's disclosure button, keeping its content, class
 * and accessible name.
 * @param {HTMLAnchorElement} link
 * @param {HTMLElement} panel
 * @returns {HTMLButtonElement}
 */
export function toPanelButton(link, panel) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = link.className;
  const name = link.getAttribute('aria-label');
  if (name) button.setAttribute('aria-label', name);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', panel.id);
  const hadFocus = document.activeElement === link;
  button.append(...link.childNodes);
  link.replaceWith(button);
  if (hadFocus) button.focus(); // the panel loads late: don't drop keyboard focus to <body>
  return button;
}

/**
 * Opens / closes the newsletter panel from its triggers: opening moves focus to the e-mail
 * field; the close button and Escape (in the panel or on a trigger) close it and return focus
 * to the trigger that opened it. Focus or a click moving elsewhere also closes it, so it never
 * stays over the menu.
 * @param {HTMLElement} panel
 * @param {HTMLButtonElement[]} triggers
 * @returns {(open: boolean) => void} sets the panel state (e.g. closed when the drawer opens)
 */
export function wireNewsletterPanel(panel, triggers) {
  let opener = null;
  const ours = (node) => !!node && (panel.contains(node) || triggers.includes(node));
  const setOpen = (open, from = null) => {
    panel.hidden = !open;
    triggers.forEach((t) => t.setAttribute('aria-expanded', open ? 'true' : 'false'));
    if (open) {
      opener = from;
      panel.querySelector('input[type="email"]')?.focus();
    } else if (opener && panel.contains(document.activeElement)) {
      opener.focus();
    }
  };
  triggers.forEach((t) => {
    t.addEventListener('click', () => setOpen(panel.hidden, t));
    t.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && !panel.hidden) setOpen(false);
    });
  });
  panel.querySelector('.nav-newsletter-close')?.addEventListener('click', () => {
    opener?.focus();
    setOpen(false);
  });
  panel.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    e.stopPropagation(); // the nav's own Escape handling is not for this panel
    setOpen(false);
  });
  // focus moving on to another control closes it (a click on the panel's own text, which
  // moves focus nowhere, does not)
  panel.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !ours(e.relatedTarget)) setOpen(false);
  });
  document.addEventListener('click', (e) => {
    const onTrigger = triggers.some((t) => t.contains(e.target));
    if (!panel.hidden && !ours(e.target) && !onTrigger) setOpen(false);
  });
  return setOpen;
}

/**
 * A dropdown parent authored as plain text (`<p>Models</p>`, the Media Room nav) gets the
 * same trigger link as a linked parent (`#`, as on the source), so it takes focus (the
 * drawer then stays open on tap) and picks up the nav-item styles. The click never
 * navigates; the li's handler toggles the dropdown.
 * @param {Element} navSection A top-level nav li with a sub-list
 */
export function linkDropLabel(navSection) {
  const label = navSection.querySelector(':scope > p');
  if (!label || label.querySelector('a') || !label.textContent.trim()) return;
  const trigger = document.createElement('a');
  trigger.href = '#';
  trigger.setAttribute('role', 'button');
  trigger.textContent = label.textContent.trim();
  trigger.addEventListener('click', (e) => e.preventDefault());
  label.replaceChildren(trigger);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  if (!fragment) {
    // a missing/unpublished nav fragment leaves an empty header, never a broken page (SKODA-307)
    // eslint-disable-next-line no-console
    console.warn(`header: nav fragment ${navPath} could not be loaded`);
    return;
  }
  // Media Room pages set `section: media-room` (bulk metadata, SKODA-309): active tab + topbar
  const siteSection = getMetadata('section');
  if (siteSection) block.dataset.section = siteSection;
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // 4-row fragment (topbar + brand + sections + tools) vs 3-row (brand + sections + tools)
  const hasTopbar = nav.children.length >= 4;
  const classes = hasTopbar
    ? ['topbar', 'brand', 'sections', 'tools']
    : ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // topbar: section switcher (COM-04) + subscribe/locales group, lifted above <nav>
  const navTopbar = nav.querySelector('.nav-topbar');
  let hasSubscribe = false;
  let subscribeLink = null;
  if (navTopbar) {
    const switcher = navTopbar.querySelector(':scope .default-content-wrapper > ul, :scope > ul');
    if (switcher) {
      switcher.classList.add('nav-section-switcher');
      // mark the active section tab: the `section` metadata tab, else the longest
      // path-segment match of the current URL, else the first tab. Decorate
      // defensively: authors may omit the href (header-switcher.js).
      const items = [...switcher.querySelectorAll(':scope > li')];
      const paths = items.map((li) => hrefPath(li.querySelector('a')?.getAttribute('href'), window.location.href));
      const active = items[pickActiveTab(paths, window.location.pathname, siteSection)];
      if (active) active.classList.add('active');
    }
    // group Subscribe + locales so they can float right on desktop / drop into drawer on mobile
    const utility = navTopbar.querySelectorAll(':scope .default-content-wrapper > p');
    utility.forEach((p) => p.classList.add('nav-topbar-utility'));
    // prefix the Subscribe CTA with a mail icon (injected here; DA strips authored tokens)
    subscribeLink = navTopbar.querySelector('a[href*="#subscribe"]');
    hasSubscribe = !!subscribeLink;
    if (subscribeLink && !subscribeLink.querySelector('.icon')) {
      subscribeLink.classList.add('nav-subscribe');
      const mail = document.createElement('span');
      mail.className = 'icon icon-mail';
      subscribeLink.prepend(mail);
    }
    // Language switcher (SKODA-303): the authored locale paragraph becomes a labelled list
    // with the page's locale (from the URL) as the current one (header-locales.js). The
    // topbar is lifted OUT of <nav>, so it can't appear inside the mobile drawer: a copy of
    // the list goes into a drawer footer (CSS shows it only in the open drawer; the topbar
    // one is the desktop instance).
    const base = window.location.href;
    const localeGroup = [...utility].find((p) => isLocaleGroup(p, base));
    const locales = localeGroup && buildLocaleList(
      localeEntries(localeGroup, base),
      currentLocale(window.location.pathname),
      document,
      window.location.pathname, // each locale links this page in that locale
    );
    if (locales) {
      // a list can't live in a <p>: the group becomes a <div> in the same place
      const group = document.createElement('div');
      group.className = 'nav-topbar-utility nav-topbar-locales';
      group.append(locales);
      localeGroup.replaceWith(group);
      const localeFooter = document.createElement('div');
      localeFooter.className = 'nav-locales';
      localeFooter.append(locales.cloneNode(true));
      nav.append(localeFooter);
    }
  }

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      // strip any button decoration EDS may have added
      brandLink.className = '';
      const btnContainer = brandLink.closest('.button-container');
      if (btnContainer) btnContainer.className = '';
      // render the wordmark as the logo icon. Authoring the SVG via an icon
      // token in the DA fragment is unreliable (DA sanitizes empty-anchor icon
      // spans), so inject it here from the brand link's text.
      brandLink.setAttribute('aria-label', brandLink.textContent.trim() || 'Škoda Storyboard, home');
      brandLink.textContent = '';
      brandLink.classList.add('nav-brand-logo');
      const logo = document.createElement('span');
      logo.className = 'icon icon-skoda-storyboard-logo';
      brandLink.append(logo);
    }
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        linkDropLabel(navSection);
      }
      // Newsletter is drawer-only on desktop (server strips the authored class; re-tag by href)
      if (navSection.querySelector('a[href*="#newsletter"]')) {
        navSection.classList.add('nav-newsletter');
      }
      const isDrop = navSection.classList.contains('nav-drop')
        || navSection.querySelector('ul');
      navSection.addEventListener('click', (e) => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          if (isDrop) {
            // toggles what is on screen (a text-only parent: click or Enter), as Space does
            setDesktopDrop(navSection, !dropShown(navSection));
          } else {
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        } else if (isDrop) {
          // drawer: tapping a parent row toggles its accordion instead of
          // navigating; only intercept taps on the parent row itself, not on
          // an already-revealed child link
          const parentLink = dropTrigger(navSection);
          if (e.target.closest('a') === parentLink) {
            e.preventDefault();
            setDropState(navSection, navSection.getAttribute('aria-expanded') !== 'true');
          }
        }
      });
      // drawer accordion buttons toggle on Enter and Space (Space would otherwise scroll,
      // Enter follow the category link); on desktop Enter follows the link (SKODA-301) and
      // Space shows / hides the dropdown instead of scrolling the page (SKODA-308)
      const trigger = isDrop ? dropTrigger(navSection) : null;
      trigger?.addEventListener('keydown', (e) => {
        const drawer = !!trigger.dataset.drawerTrigger;
        if (e.key !== ' ' && !(drawer && e.key === 'Enter')) return;
        e.preventDefault();
        if (drawer) {
          setDropState(navSection, navSection.getAttribute('aria-expanded') !== 'true');
        } else {
          // the focused trigger already shows its panel (:focus-within): Space hides it first
          setDesktopDrop(navSection, !dropShown(navSection));
        }
      });
      if (isDrop) {
        // desktop: focus moving on closes the dropdown (one open at a time, as on hover) and
        // forgets a dismissal (Escape), so it shows again on the next visit
        navSection.addEventListener('focusout', (e) => {
          if (navSection.contains(e.relatedTarget)) return;
          delete navSection.dataset.dismissed;
          if (isDesktop.matches) navSection.setAttribute('aria-expanded', 'false');
        });
        // the pointer coming back shows it again (also after a click closed it while focused)
        navSection.addEventListener('pointerenter', () => { delete navSection.dataset.dismissed; });
      }
    });
  }

  // tools row: render the search link as the source's search control (SKODA-308): a search
  // button that opens a bar (scope select + pill field) over the menu and then is the bar's
  // invisible submit (a query searches, none closes). DA strips authored icon tokens, so the
  // icons are CSS masks.
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const searchLink = navTools.querySelector('a[href*="#search"], a');
    if (searchLink) {
      const label = searchLink.textContent.trim() || 'Search';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-search-toggle';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'nav-search-bar');
      const input = document.createElement('input');
      input.type = 'search';
      input.id = 'nav-search-input';
      input.className = 'nav-search-input';
      input.placeholder = label;
      input.setAttribute('aria-label', label);
      input.setAttribute('autocomplete', 'off');
      input.tabIndex = -1;
      // the scope select; Storyboard pages default to Stories, the Media Room to All (source)
      const scope = buildSearchScope(siteSection === 'media-room' ? '' : 'post');

      // pill field: decorative leading icon + input
      const field = document.createElement('div');
      field.className = 'nav-search-field';
      const icon = document.createElement('span');
      icon.className = 'nav-search-icon';
      field.append(icon, input);

      const bar = document.createElement('div');
      bar.id = 'nav-search-bar';
      bar.className = 'nav-search-bar';
      bar.setAttribute('role', 'search');
      bar.append(scope.wrapper, field);

      const searchBar = document.createElement('div');
      searchBar.className = 'nav-search';
      searchBar.append(bar, toggle);

      // open, the button is the source's submit: it searches with a query, closes without one
      const syncToggleLabel = () => {
        const open = searchBar.classList.contains('nav-search-open');
        toggle.setAttribute('aria-label', open && !input.value.trim() ? 'Close search' : label);
      };
      const setOpen = (open) => {
        searchBar.classList.toggle('nav-search-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        syncToggleLabel();
        syncSearchTabbable(nav);
        if (open) input.focus();
        else delete bar.dataset.keyboard;
      };
      input.addEventListener('input', syncToggleLabel);
      // the field's focus ring is for keyboard use only (the source shows none): set by any Tab
      // in the nav (also tabbing into the drawer's field) or a keyboard press of the button,
      // cleared by the pointer
      nav.addEventListener('keydown', (e) => { if (e.key === 'Tab') bar.dataset.keyboard = 'true'; });
      document.addEventListener('pointerdown', () => { delete bar.dataset.keyboard; });
      // Submit the query to the search results page (the SKODA-403 block reads
      // ?filter[search]= from the URL). Target: the authored search link's href
      // if it points to a real page, else the locale's /search (mirrors the live
      // header form → /{locale}/search/?filter[search]=…).
      const authoredHref = searchLink.getAttribute('href') || '';
      const localeMatch = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
      const locale = localeMatch ? localeMatch[1] : 'en';
      const searchPath = authoredHref && !authoredHref.startsWith('#')
        && isWebUrl(authoredHref, window.location.origin)
        ? authoredHref
        : `/${locale}/search`;
      const submitSearch = (value) => {
        const q = String(value || '').trim();
        if (!q) { input.focus(); return; }
        const { origin } = window.location;
        window.location.assign(searchUrl(searchPath, q, scope.select.value, origin));
      };
      // live suggestions (index-driven) + Enter → results page. The shared
      // helper owns the dropdown, arrow-key nav, and Enter; onSubmit fires when
      // Enter is pressed with no suggestion highlighted (submits the raw query).
      // Append the dropdown to .nav-search (positioned, not overflow:hidden) —
      // the .nav-search-bar clips its overflow for the width animation.
      attachSuggest(input, { container: searchBar, onSubmit: submitSearch });

      // the search button opens the bar; while open it is the source's (invisible) submit at the
      // pill's end: it searches with a query and closes the bar without one. No focus move on
      // press: Safari / Firefox on macOS don't focus a clicked button, so the field's focusout
      // would close the bar and the click re-open it
      toggle.addEventListener('mousedown', (e) => e.preventDefault());
      toggle.addEventListener('click', (e) => {
        const keyboard = e.detail === 0; // Enter / Space on the button
        if (!searchBar.classList.contains('nav-search-open')) {
          if (keyboard) bar.dataset.keyboard = 'true';
          setOpen(true);
        } else if (input.value.trim()) {
          submitSearch(input.value);
        } else {
          setOpen(false);
          // a pointer close leaves focus nowhere (no ring, as on the source), not on a hidden
          // bar control; from the keyboard it stays on the button
          if (!keyboard && bar.contains(document.activeElement)) document.activeElement.blur();
        }
      });
      // Escape closes the whole search bar (the suggest helper also closes its
      // own dropdown on Escape; this additionally collapses the field).
      bar.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') { setOpen(false); toggle.focus(); }
      });
      // focus moving on to another control, or a click elsewhere, closes the bar (the query is
      // kept), so it never stays over the menu; a click on the bar's own text moves focus nowhere
      searchBar.addEventListener('focusout', (e) => {
        if (e.relatedTarget && !searchBar.contains(e.relatedTarget)) setOpen(false);
      });
      document.addEventListener('click', (e) => {
        if (searchBar.classList.contains('nav-search-open') && !searchBar.contains(e.target)) setOpen(false);
      });

      searchLink.replaceWith(searchBar);
    }
  }

  // mobile action cluster: mail shortcut + hamburger (mail sits before the
  // hamburger, mobile-only). With the newsletter panel it becomes the panel's
  // button (below). Only a nav that authors the Subscribe CTA gets it: the
  // Media Room nav has none (SKODA-309).
  let mail;
  if (hasSubscribe) {
    mail = document.createElement('a');
    mail.className = 'nav-mail';
    mail.href = '#subscribe';
    mail.setAttribute('aria-label', 'Subscribe to our stories');
    mail.innerHTML = '<span class="icon icon-mail"></span>';
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  // the newsletter panel (loaded later, below) closes when the drawer opens
  let setNewsletterOpen = null;
  hamburger.addEventListener('click', () => {
    setNewsletterOpen?.(false);
    toggleMenu(nav, navSections);
  });

  const mobileTools = document.createElement('div');
  mobileTools.className = 'nav-mobile-tools';
  if (mail) mobileTools.append(mail);
  mobileTools.append(hamburger);
  nav.prepend(mobileTools);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  decorateIcons(nav);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  // lift the topbar to full-width (grey utility bar), above the main nav row
  if (navTopbar) navWrapper.append(navTopbar);
  navWrapper.append(nav);

  block.append(navWrapper);

  // the Subscribe CTA (topbar) and the mail shortcut (phones) open the newsletter panel once
  // its fragment has loaded (not awaited: the header never waits for it; until then, or
  // without it, they stay plain links)
  const panelTriggers = [subscribeLink, mail].filter(Boolean);
  if (panelTriggers.length) {
    const newsletterPath = `${navPath}-newsletter`;
    loadFragment(newsletterPath).then((newsletter) => {
      const panel = takeNewsletterPanel(newsletter);
      if (!panel) return;
      // in the DOM right after the topbar CTA, so Tab moves from it into the panel (the panel
      // is positioned on .nav-wrapper wherever it sits)
      const anchor = subscribeLink?.closest('.nav-topbar-utility');
      if (anchor) anchor.after(panel);
      else navWrapper.append(panel);
      const buttons = panelTriggers.map((t) => toPanelButton(t, panel));
      setNewsletterOpen = wireNewsletterPanel(panel, buttons);
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.warn(`header: newsletter fragment ${newsletterPath} could not be loaded`, error);
    });
  }
}
