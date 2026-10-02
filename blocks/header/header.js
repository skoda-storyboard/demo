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
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
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

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
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
    section.setAttribute('aria-expanded', expanded);
  });
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
  input.tabIndex = (drawerOpen || bar.classList.contains('nav-search-open')) ? 0 : -1;
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
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  // always collapse the accordion sub-menus when opening/closing the drawer
  // (mobile accordions start collapsed; user taps a parent to expand)
  toggleAllNavSections(navSections, 'false');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
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

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
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
    const subscribeLink = navTopbar.querySelector('a[href*="#subscribe"]');
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
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        } else if (isDrop) {
          // drawer: tapping a parent row toggles its accordion instead of
          // navigating; only intercept taps on the parent row itself, not on
          // an already-revealed child link
          const parentLink = navSection.querySelector(':scope > p > a, :scope > a');
          if (e.target.closest('a') === parentLink) {
            e.preventDefault();
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        }
      });
    });
  }

  // tools row: render the search link as a click-to-expand search control.
  // DA strips authored icon tokens, so build the icon + input here.
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const searchLink = navTools.querySelector('a[href*="#search"], a');
    if (searchLink) {
      const label = searchLink.textContent.trim() || 'Search';
      // toggle button (the search icon)
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-search-toggle';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span class="icon icon-search"></span>';
      // search input (collapsed by default)
      const input = document.createElement('input');
      input.type = 'search';
      input.id = 'nav-search-input';
      input.className = 'nav-search-input';
      input.placeholder = label;
      input.setAttribute('aria-label', label);
      input.setAttribute('autocomplete', 'off');
      input.tabIndex = -1;

      // pill field holds the leading icon + input; icon sits before the
      // placeholder when open, input fills the rest
      const field = document.createElement('div');
      field.className = 'nav-search-field';
      field.append(toggle, input);

      const searchBar = document.createElement('div');
      searchBar.className = 'nav-search';
      searchBar.append(field);

      const setOpen = (open) => {
        searchBar.classList.toggle('nav-search-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        syncSearchTabbable(nav);
        if (open) input.focus();
      };
      // Submit the query to the search results page (the SKODA-403 block reads
      // ?filter[search]= from the URL). Target: the authored search link's href
      // if it points to a real page, else the locale's /search (mirrors the live
      // header form → /{locale}/search/?filter[search]=…).
      const authoredHref = searchLink.getAttribute('href') || '';
      const localeMatch = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
      const locale = localeMatch ? localeMatch[1] : 'en';
      const searchPath = authoredHref && !authoredHref.startsWith('#')
        ? authoredHref
        : `/${locale}/search`;
      const submitSearch = (value) => {
        const q = String(value || '').trim();
        if (!q) { input.focus(); return; }
        const url = new URL(searchPath, window.location.origin);
        url.searchParams.set('filter[search]', q);
        window.location.assign(url.href);
      };
      // live suggestions (index-driven) + Enter → results page. The shared
      // helper owns the dropdown, arrow-key nav, and Enter; onSubmit fires when
      // Enter is pressed with no suggestion highlighted (submits the raw query).
      // Append the dropdown to .nav-search (positioned, not overflow:hidden) —
      // the .nav-search-field pill clips its overflow for the collapse anim.
      attachSuggest(input, { container: searchBar, onSubmit: submitSearch });

      toggle.addEventListener('click', () => {
        // when already open with a query, the icon acts as submit; else toggle
        if (searchBar.classList.contains('nav-search-open') && input.value.trim()) {
          submitSearch(input.value);
        } else {
          setOpen(!searchBar.classList.contains('nav-search-open'));
        }
      });
      // Escape closes the whole search bar (the suggest helper also closes its
      // own dropdown on Escape; this additionally collapses the field).
      input.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') { setOpen(false); toggle.focus(); }
      });
      // close when focus leaves the search control (if input is empty)
      searchBar.addEventListener('focusout', (e) => {
        if (!searchBar.contains(e.relatedTarget) && !input.value) setOpen(false);
      });

      searchLink.replaceWith(searchBar);
    }
  }

  // mobile action cluster: mail shortcut + hamburger (mail sits before the
  // hamburger, mobile-only). Mail is an anchor so it is not picked up by the
  // nav's `querySelector('button')` focus/close logic. Only a nav that authors
  // the Subscribe CTA gets it: the Media Room nav has none (SKODA-309).
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
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));

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
}
