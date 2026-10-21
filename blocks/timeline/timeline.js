// A year or short label ("1905", "2019"); a longer first text cell is the title of a row
// whose author left the year out.
const LABEL = /^\S{1,12}$/;

// year | title | image | description: the importer always writes the four columns
const COLUMNS = 4;

/**
 * The parts of one authored row: year | title | image | description. In a full four-cell
 * row the columns hold their places, so a blank year or image cell is a blank value (the
 * image may sit in any cell, the text cells keep their order). A shorter row, whose author
 * removed cells, is read by content: the image cell by its picture, the text cells by order.
 * @param {Element} row
 */
function partsOf(row) {
  const cells = [...row.children];
  const media = cells.find((cell) => cell.querySelector('picture, img')) || null;
  if (cells.length >= COLUMNS) {
    const [year, title, description] = media
      ? cells.filter((cell) => cell !== media)
      : [cells[0], cells[1], cells[3]];
    return {
      year, title, media, description,
    };
  }
  let [year, title, description] = cells.filter((cell) => cell !== media);
  if (year && !LABEL.test(year.textContent.trim())) {
    [title, description] = [year, title];
    year = null;
  }
  return {
    year, title, media, description,
  };
}

/**
 * The title as one heading: the cell's paragraphs (the maker, the bold model, "(vehicle on
 * display: …)") become lines of the heading.
 * @param {Element} cell
 */
function titleOf(cell) {
  const heading = document.createElement('h3');
  heading.className = 'timeline-title';
  const paragraphs = cell.querySelectorAll(':scope > p');
  if (!paragraphs.length) {
    heading.append(...cell.childNodes);
    return heading;
  }
  paragraphs.forEach((p, i) => {
    if (i) heading.append(document.createElement('br'));
    heading.append(...p.childNodes);
  });
  return heading;
}

/**
 * A `<br>` adds no separator to the accessible name ("Laurin & KlementVOITURETTE A"): a space
 * before each line break keeps the words apart, and collapses on screen.
 * @param {Element} heading
 */
function spaceLines(heading) {
  heading.querySelectorAll('br').forEach((br) => {
    const before = br.previousSibling;
    if (before?.nodeName === '#text' && /\s$/.test(before.textContent)) return;
    br.before(' ');
  });
  return heading;
}

/**
 * One milestone: the year pill, the title, the image and the description; the line and the
 * dot are CSS (decorative).
 * @param {Element} row
 * @returns {HTMLLIElement|null} null for a row with no content
 */
function entryOf(row) {
  const {
    year, title, media, description,
  } = partsOf(row);
  const li = document.createElement('li');
  li.className = 'timeline-entry';
  if (year?.textContent.trim()) {
    const label = document.createElement('p');
    label.className = 'timeline-year';
    label.textContent = year.textContent.trim();
    li.append(label);
  }
  if (title?.textContent.trim()) li.append(spaceLines(titleOf(title)));
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
 * Timeline (SKODA-815, contract `timeline` v1): the source's dated `ys-milestones`
 * timeline. Each row is one milestone, year | title | image | description, rendered as an
 * ordered list on the source's line: a left rail on phones and tablets, two-sided (title
 * and image left, description right) from 1080. `Timeline (black)` is the black year pill,
 * `Timeline (large)` the widgets authored with 18pt (24px) titles.
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
}
