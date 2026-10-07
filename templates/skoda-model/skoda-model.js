/**
 * Model page (SKODA-208): loaded only on `template: skoda_model` pages (scripts.js
 * TEMPLATES). Render target: docs/ui-specs/template-model-page.md (+ the 2026-09-25/28
 * re-captures in SKODA-208). Built from existing blocks, no model-specific block:
 *   - hero:       `Hero Image (overlay)`; the "Models" line becomes the chip (as skoda-series)
 *   - icon nav:   the importer's same-page link list becomes a sticky <nav> with icons and
 *                 scrollspy; links to sections that are missing or collapse are dropped
 *   - Highlights: `Cards (key-facts)` (CSS variant, cards.css); the drawings open the shared
 *                 lightbox (scripts/media-lightbox.js)
 *   - Tech Data:  `Columns` + `stats` variant (CSS, columns.css) on a dark band
 *   - rails:      `Story Rail`; Derivatives → `center caption`, Images/Videos → `media caption`
 * Sections are recognised by their heading id (the importer's section headings), so the
 * already-published pages need no re-import. Runs before the blocks decorate.
 * @param {Element} main The main element
 */

import { wireImageLinks } from '../../scripts/media-lightbox.js';

// heading id (importer slug) → section role, nav icon (icons/model-*.svg) and the source's
// anchor (so old deep links such as /en/skoda-model/octavia/#keyfacts still land). The RS
// derivatives title their panels "Model introduction" and "Key Specifications" / "Key
// Highlights" (SKODA-208a): the same source panels, so the same roles.
const SECTIONS = [
  {
    test: /^model-(description|introduction)/, role: 'model-intro', icon: 'model-description', alias: 'intro',
  },
  {
    test: /^(highlights|key-facts|key-specifications|key-highlights)/, role: 'model-highlights', icon: 'model-key-facts', alias: 'keyfacts',
  },
  {
    test: /^technical-data/, role: 'model-techdata', icon: 'model-technical-data', alias: 'techdata',
  },
  {
    test: /^bodywork/, role: 'model-rail', icon: 'model-derivatives', alias: 'derivatives',
  },
  { test: /^news/, role: 'model-rail', icon: 'model-news' },
  { test: /^press-kits/, role: 'model-rail', icon: 'model-press-kits' },
  { test: /^stories/, role: 'model-rail', icon: 'model-stories' },
  { test: /^images/, role: 'model-rail', icon: 'model-images' },
  { test: /^videos/, role: 'model-rail', icon: 'model-videos' },
];

const sectionFor = (id) => SECTIONS.find((s) => s.test.test(id || ''));

/** The `template` value of a story-rail config table (before the block decorates). */
function railTemplate(rail) {
  const row = [...rail.children].find((r) => r.children[0]?.textContent.trim().toLowerCase() === 'template');
  return row?.children[1]?.textContent.trim().toLowerCase() || '';
}

function decorateHero(main) {
  const hero = main.querySelector('.hero-image.overlay');
  const h1 = hero?.querySelector('h1');
  const before = h1?.previousElementSibling;
  if (before?.matches('p') && !before.querySelector('img, picture')) {
    before.classList.add('hero-image-badge');
  }
}

/** Tag each content section with its role; mark rail variants and lead-in lines. */
function decorateSections(main) {
  main.querySelectorAll(':scope > .section').forEach((section) => {
    const heading = section.querySelector(':scope > .default-content-wrapper > h2[id]');
    const match = sectionFor(heading?.id);
    if (!match) return;
    section.classList.add(match.role);
    if (match.alias && !document.getElementById(match.alias)) section.id = match.alias;

    if (match.role === 'model-techdata') {
      section.querySelector('.columns')?.classList.add('stats');
      const pdf = [...section.querySelectorAll('.default-content-wrapper > p')]
        .find((p) => p.querySelector('a[href$=".pdf" i]') && p.children.length === 1);
      pdf?.classList.add('model-techdata-download');
      // Fabia: a banner image authored before the heading
      section.querySelector('.default-content-wrapper > p > picture')?.parentElement
        .classList.add('model-techdata-banner');
    }

    if (match.role === 'model-highlights') {
      // technical drawings (Liftback / Combi): an h3 + a linked full-size image, opened in
      // the source's single-image lightbox (title + file details, close ✕)
      const drawings = [...section.querySelectorAll('.default-content-wrapper > p > a > picture')];
      drawings.forEach((pic) => pic.closest('p').classList.add('model-drawing'));
      wireImageLinks(drawings.map((pic) => pic.parentElement));
    }

    if (match.role === 'model-rail') {
      const lead = heading.nextElementSibling;
      if (lead?.matches('p') && /^based on tags/i.test(lead.textContent.trim())) {
        lead.classList.add('model-rail-subheading');
      }
      const rail = section.querySelector('.story-rail');
      const template = rail ? railTemplate(rail) : '';
      if (template === 'skoda_model') rail.classList.add('center', 'caption');
      if (template === 'image' || template === 'video') rail.classList.add('media', 'caption', template);
    }
  });
}

/** Turn the importer's same-page link list into the sticky icon nav. */
function decorateNav(main) {
  const list = [...main.querySelectorAll(':scope > .section > .default-content-wrapper > ul')]
    .find((ul) => ul.children.length && [...ul.querySelectorAll('a')].every((a) => a.getAttribute('href')?.startsWith('#')));
  if (!list) return;
  const section = list.closest('.section');
  const nav = document.createElement('nav');
  nav.className = 'model-nav';
  nav.setAttribute('aria-label', 'On this page');
  list.className = 'model-nav-list';

  [...list.querySelectorAll(':scope > li')].forEach((li) => {
    const a = li.querySelector('a');
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const target = document.getElementById(id);
    if (!target) { li.remove(); return; } // never a dangling link (source bug)
    const icon = document.createElement('span');
    icon.className = `model-nav-icon icon-${sectionFor(id)?.icon || 'model-description'}`;
    icon.setAttribute('aria-hidden', 'true');
    a.prepend(icon);
    li.dataset.target = id;
  });

  list.replaceWith(nav);
  nav.append(list);
  section.classList.add('model-nav-section');

  // a rail that turns out empty removes its section; drop its link too
  main.addEventListener('story-rail:empty', (e) => {
    const id = e.target.querySelector?.('h2[id]')?.id;
    if (id) list.querySelector(`li[data-target="${CSS.escape(id)}"]`)?.remove();
  });

  // scrollspy: the current section is the last one whose top has passed under the nav (as
  // the source: nothing is current at the top of the page, before the nav sticks). A nav
  // jump lands the heading under the nav and its section starts above it, so it counts.
  let raf = 0;
  const spy = () => {
    raf = 0;
    const offset = nav.getBoundingClientRect().bottom - 1;
    let current = null;
    list.querySelectorAll(':scope > li').forEach((li) => {
      const el = document.getElementById(li.dataset.target);
      const top = el?.closest('.section')?.getBoundingClientRect().top;
      if (top !== undefined && top < offset) current = li;
    });
    list.querySelectorAll(':scope > li').forEach((li) => {
      const a = li.querySelector('a');
      if (li === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(spy); }, { passive: true });
  // the template runs before scripts.js shows the page (body.appear): hidden sections all
  // measure top 0, so the first state is taken once the page is laid out, and again on load
  const initial = () => requestAnimationFrame(spy);
  if (document.body.classList.contains('appear')) initial();
  else {
    const shown = new window.MutationObserver(() => {
      if (!document.body.classList.contains('appear')) return;
      shown.disconnect();
      initial();
    });
    shown.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  window.addEventListener('load', initial, { once: true });
}

export default function decorate(main) {
  decorateHero(main);
  decorateSections(main);
  // short model pages (Peaq, Epiq: description + rails only) get the source's extra spacer
  if (!main.querySelector('.model-highlights, .model-techdata')) document.body.classList.add('model-short');
  decorateNav(main);
}
