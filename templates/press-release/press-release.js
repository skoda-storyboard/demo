import { getMetadata } from '../../scripts/aem.js';

// The source date format: "2. 9. 2026" (day. month. year, no leading zeros).
const DATE_RE = /^\s*(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})\s*$/;

/**
 * ISO date for the header: the `publisheddate` metadata, else parsed from the text.
 * @param {string} text The visible date
 * @returns {string} YYYY-MM-DD, or '' when neither is usable
 */
function isoDate(text) {
  const meta = getMetadata('publisheddate');
  if (/^\d{4}-\d{2}-\d{2}$/.test(meta)) return meta;
  const m = text.match(DATE_RE);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

/**
 * Header section: the date paragraph above the h1 becomes a <time>.
 * @param {Element} section The first section
 */
function decorateHeader(section) {
  if (!section) return;
  section.classList.add('press-release-header');
  const date = [...section.querySelectorAll('.default-content-wrapper > p')]
    .find((p) => DATE_RE.test(p.textContent));
  if (!date) return;
  date.classList.add('press-release-date');
  const datetime = isoDate(date.textContent);
  if (!datetime) return;
  const time = document.createElement('time');
  time.dateTime = datetime;
  time.textContent = date.textContent.trim();
  date.replaceChildren(time);
}

/**
 * Body column: mark the bullet list and the perex (a paragraph that is all <strong>).
 * Both are optional, so they are found by content. Only the first body part is the lead
 * (lead image, bullets, perex, podcast); a highlight callout splits the rest of the body
 * into later parts (SKODA-824), whose bold paragraphs (the FAQ questions) stay as they are.
 * @param {Element} section The first body-column section
 */
function decorateBody(section) {
  if (!section) return;
  section.classList.add('press-release-lead');
  const content = section.querySelector('.default-content-wrapper');
  if (!content) return;
  const bullets = content.querySelector(':scope > ul');
  if (bullets) bullets.classList.add('press-release-bullets');
  content.querySelectorAll(':scope > p').forEach((p) => {
    const strong = p.querySelector(':scope > strong');
    if (strong && p.children.length === 1 && p.textContent.trim() === strong.textContent.trim()) {
      p.classList.add('press-release-perex');
    }
  });
}

/**
 * Sidebar: its content becomes an <aside> (the source uses a plain div).
 * @param {Element} section The sidebar section
 */
function decorateSidebar(section) {
  if (!section) return;
  const aside = document.createElement('aside');
  aside.setAttribute('aria-label', section.querySelector('h3')?.textContent.trim() || 'Additional info');
  aside.append(...section.children);
  section.append(aside);
}

/**
 * Related bands: the "All" link authored after the heading + "Based on tags" line is a
 * plain link (the importer emits `<p><a>All</a></p>`), which decorateButtons skips because
 * it only buttonizes bold/italic links. Mark it as the band's button so the header grid
 * puts the ghost pill beside the heading, as the source .search-results-header does.
 * @param {Element} main The main element
 */
function decorateRelatedLinks(main) {
  main.querySelectorAll(':scope > .section.related .default-content-wrapper > p').forEach((p) => {
    const link = p.querySelector(':scope > a[href]');
    const onlyLink = link && p.children.length === 1
      && p.textContent.trim() === link.textContent.trim();
    if (!onlyLink) return;
    p.classList.add('button-container');
    link.classList.add('button');
  });
}

/**
 * Lays out a press release (SKODA-607): header, body column + sidebar, Media Box and
 * related bands. Sections come from the import contract `press-release-sections`.
 * @param {Element} main The main element
 */
export default function decorate(main) {
  const sections = [...main.querySelectorAll(':scope > .section')];
  decorateHeader(sections.find((s) => s.querySelector('h1')) || sections[0]);
  decorateBody(main.querySelector(':scope > .section.body-column'));
  decorateSidebar(main.querySelector(':scope > .section.sidebar'));
  decorateRelatedLinks(main);
  const mediaBox = main.querySelector(':scope > .section.media-box');
  if (mediaBox && !document.getElementById('media-box')) mediaBox.id = 'media-box';
}
