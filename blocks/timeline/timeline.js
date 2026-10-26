// A year or short label ("1905", "2019"); a longer first text cell is the title of a row
// whose author left the year out.
const LABEL = /^\S{1,12}$/;

// year | title | image | description: the importer always writes the four columns, and a
// fifth, the space above the title in px, when the source adds some (PR #373 review)
const COLUMNS = 4;
const SPACE = /^(\d{1,3})\s*(?:px)?$/i;
const MAX_SPACE = 200;

/**
 * The parts of one authored row: year | title | image | description [| space]. In a full
 * four-cell row the columns hold their places, so a blank year or image cell is a blank value
 * (the image may sit in any of the four, the text cells keep their order). A shorter row,
 * whose author removed cells, is read by content: the image cell by its picture, the text
 * cells by order.
 * @param {Element} row
 */
function partsOf(row) {
  const cells = [...row.children];
  if (cells.length >= COLUMNS) {
    const columns = cells.slice(0, COLUMNS);
    const media = columns.find((cell) => cell.querySelector('picture, img')) || null;
    const [year, title, description] = media
      ? columns.filter((cell) => cell !== media)
      : [columns[0], columns[1], columns[3]];
    return {
      year, title, media, description, space: cells[COLUMNS] || null,
    };
  }
  const media = cells.find((cell) => cell.querySelector('picture, img')) || null;
  let [year, title, description] = cells.filter((cell) => cell !== media);
  if (year && !LABEL.test(year.textContent.trim())) {
    [title, description] = [year, title];
    year = null;
  }
  return {
    year, title, media, description,
  };
}

/** A paragraph that is all bold: the model line ("VOITURETTE A"). */
const isModel = (p) => !!p.textContent.trim()
  && [...p.childNodes].every((n) => (n.nodeType === 3 ? !n.textContent.trim() : n.matches('strong, b, br')));

/**
 * The title as the source's paragraphs (not a heading: the source widget's titles are
 * paragraphs, PR #373 review). Each keeps its role for the `xl` scheme: the all-bold model
 * line, the "(vehicle on display: …)" note, else the maker line.
 * @param {Element} cell
 */
function titleOf(cell) {
  const title = document.createElement('div');
  title.className = 'timeline-title';
  const paragraphs = [...cell.querySelectorAll(':scope > p')];
  if (!paragraphs.length) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    paragraphs.push(p);
  }
  paragraphs.filter((p) => p.textContent.trim()).forEach((p) => {
    if (isModel(p)) p.classList.add('timeline-title-model');
    else if (/^\(/.test(p.textContent.trim())) p.classList.add('timeline-title-note');
    title.append(p);
  });
  return title;
}

/**
 * The authored space above the title (the source's spacer paragraph or inline margin), as a
 * custom property on the entry; anything but a plain pixel count is ignored.
 * @param {HTMLLIElement} li
 * @param {Element|null} cell
 */
function applySpace(li, cell) {
  const match = (cell?.textContent || '').trim().match(SPACE);
  const px = match ? Math.min(Number(match[1]), MAX_SPACE) : 0;
  if (px) li.style.setProperty('--timeline-title-space', `${px}px`);
}

/**
 * One milestone: the year pill, the title, the image and the description; the line and the
 * dot are CSS (decorative).
 * @param {Element} row
 * @returns {HTMLLIElement|null} null for a row with no content
 */
function entryOf(row) {
  const {
    year, title, media, description, space,
  } = partsOf(row);
  const li = document.createElement('li');
  li.className = 'timeline-entry';
  if (year?.textContent.trim()) {
    const label = document.createElement('p');
    label.className = 'timeline-year';
    label.textContent = year.textContent.trim();
    li.append(label);
  }
  if (title?.textContent.trim()) {
    li.append(titleOf(title));
    applySpace(li, space);
  }
  // a milestone may stack more than one image; a bare img counts when it has no picture
  const pictures = media ? [...media.querySelectorAll('picture, img')]
    .filter((el) => !el.closest('picture') || el.matches('picture')) : [];
  if (pictures.length) {
    const figure = document.createElement('div');
    figure.className = 'timeline-media';
    // below the story's lead: every timeline image loads lazily
    figure.append(...pictures);
    figure.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'lazy'));
    li.append(figure);
  }
  if (description?.textContent.trim()) {
    const text = document.createElement('div');
    text.className = 'timeline-text';
    text.append(...description.childNodes);
    li.append(text);
  }
  return li.children.length ? li : null;
}

/**
 * Timeline (SKODA-815, contract `timeline` v2): the source's dated `ys-milestones`
 * timeline. Each row is one milestone, year | title | image | description [| space above the
 * title, px], rendered as an ordered list on the source's line: a left rail on phones and
 * tablets, two-sided (title and image left, description right) from 1080.
 * `Timeline (black)` is the black year pill, `Timeline (large)` the widgets authored with
 * 18pt (24px) titles, `Timeline (xl)` those with a 24pt (32px) model line under an 18pt maker.
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'timeline-list';
  [...block.children].map(entryOf).filter(Boolean).forEach((li) => list.append(li));
  // the source widget opens every milestone link in a new tab (DA keeps only the href)
  list.querySelectorAll('a[href]').forEach((a) => {
    a.target = '_blank';
    const rel = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    a.setAttribute('rel', [...rel].join(' '));
  });
  block.replaceChildren(list);
  // the source panel sits 40px below the prose before it, but at the top of the reading
  // column when it leads it (wheels, gear stick): no prose gap then (PR #373 review)
  const host = block.closest('.timeline-wrapper') || block;
  if (!host.previousElementSibling) block.dataset.position = 'leading';
}
