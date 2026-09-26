/* eslint-disable */
/* global WebImporter */
/**
 * Parser: model section nav, contract `in-page-nav` v2 (resolved to default content, SKODA-208).
 * Source: .model-nav > .model-nav-content > ul.nav > li > a[href="#intro|#keyfacts|…"]
 *   (icon SVG + label). The source links dangle on several pages (Peaq/Epiq point at
 *   missing #keyfacts/#techdata; Fabia hides News/Stories; Superb iV / Enyaq RS sections
 *   have no ids), and `in-page-nav` is not a block on main.
 *
 * ⚠️ RUNS LAST (it is the last entry in the model-page template's block list): the other
 * model parsers have already emitted their section headings, tagged
 * `data-model-key="<source anchor>"`. Each source link resolves to that heading; a link
 * whose section was not emitted is dropped (no dangling anchors). The Model Description
 * heading is not parsed, so `#intro` resolves to the first SiteOrigin editor widget's h2.
 *
 * Output: default content `<ul><li><a href="#<heading id>">Label</a></li>…</ul>`. The
 * href is the id the EDS pipeline gives that heading: github-slugger over every heading
 * in document order (lowercase, punctuation stripped, spaces → '-', repeats get -1, -2).
 * Icons, stickiness and the mobile form are the UI half of SKODA-208.
 */
const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

// github-slugger: drop everything but letters, marks, numbers, connectors, space and '-'.
const STRIP = /[^\p{L}\p{M}\p{N}\p{Pc} -]/gu;

function headingIds(document) {
  const ids = new Map();
  const seen = new Map();
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    const base = (h.textContent || '').toLowerCase().replace(STRIP, '').replace(/ /g, '-');
    let id = base;
    let n = seen.get(base) || 0;
    while (seen.has(id)) { n += 1; id = `${base}-${n}`; }
    seen.set(base, n);
    seen.set(id, 0);
    ids.set(h, id);
  });
  return ids;
}

function target(document, key) {
  const tagged = document.querySelector(`[data-model-key="${key}"]`);
  if (tagged) return tagged;
  if (key === 'intro') {
    return document.querySelector('.so-widget-sow-editor h2, .widget_sow-editor h2');
  }
  return null;
}

export default function parse(element, { document }) {
  const links = Array.from(element.querySelectorAll('ul.nav > li > a[href^="#"], a[href^="#"]'));
  const ids = headingIds(document);

  const ul = document.createElement('ul');
  const used = new Set();
  links.forEach((a) => {
    const key = (a.getAttribute('href') || '').slice(1);
    const label = clean(a.textContent);
    if (!key || !label || used.has(key)) return;
    const heading = target(document, key);
    const id = heading && ids.get(heading);
    if (!id) return;
    used.add(key);
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.setAttribute('href', `#${id}`);
    link.textContent = label;
    li.append(link);
    ul.append(li);
  });

  if (!ul.children.length) {
    element.remove();
    return;
  }
  element.replaceWith(ul);
}
