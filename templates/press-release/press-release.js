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
 * Both are optional, so they are found by content.
 * @param {Element} section The body-column section
 */
function decorateBody(section) {
  if (!section) return;
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
 * Media Box file links (fallback until SKODA-510). The Downloads block drops rows without
 * an image, so the release PDF (and any other file-only row) would be unreachable. Read those
 * rows from the authored table before the block decorates it, then, once the block has
 * loaded, list every file it didn't render as a plain download link under the grid. When the
 * block renders file tiles itself (SKODA-510), nothing is added.
 * @param {Element} section The media-box section
 */
function decorateMediaBoxFiles(section) {
  const block = section?.querySelector('.downloads');
  if (!block) return;
  const files = [...block.querySelectorAll(':scope > div')]
    .filter((row) => !row.querySelector('img'))
    .map((row) => {
      const link = row.querySelector('a[href]');
      const title = [...row.children].find((cell) => !cell.querySelector('a') && cell.textContent.trim());
      return link && {
        href: link.getAttribute('href'),
        label: link.textContent.trim(),
        title: title ? title.textContent.trim() : link.textContent.trim(),
      };
    })
    .filter(Boolean);
  if (!files.length) return;

  const render = () => {
    const missing = files.filter(({ href }) => !block.querySelector(`a[href="${CSS.escape(href)}"]`));
    if (!missing.length) return;
    const list = document.createElement('ul');
    list.className = 'press-release-files';
    missing.forEach(({ href, label, title }) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.setAttribute('download', '');
      a.textContent = `${title} (${label})`;
      li.append(a);
      list.append(li);
    });
    block.closest('.downloads-wrapper')?.after(list);
  };

  const observer = new MutationObserver(() => {
    if (block.dataset.blockStatus !== 'loaded') return;
    observer.disconnect();
    render();
  });
  observer.observe(block, { attributes: true, attributeFilter: ['data-block-status'] });
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
  const mediaBox = main.querySelector(':scope > .section.media-box');
  if (mediaBox && !document.getElementById('media-box')) mediaBox.id = 'media-box';
  decorateMediaBoxFiles(mediaBox);
}
