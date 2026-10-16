// A year or short label ("1905", "2019"); a longer first text cell is the title of a row
// whose author left the year out.
const LABEL = /^\S{1,12}$/;

/**
 * The parts of one authored row: year | title | image | description. The image cell is
 * found by content, the text cells by order, so a row may omit any cell.
 * @param {Element} row
 */
function partsOf(row) {
  const cells = [...row.children];
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
  if (title?.textContent.trim()) li.append(titleOf(title));
  const picture = media?.querySelector('picture') || media?.querySelector('img');
  if (picture) {
    const figure = document.createElement('div');
    figure.className = 'timeline-media';
    // below the story's lead: every timeline image loads lazily
    [picture, ...picture.querySelectorAll('img')].filter((img) => img.matches('img'))
      .forEach((img) => img.setAttribute('loading', 'lazy'));
    figure.append(picture);
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
 * and image left, description right) from 1080. `Timeline (black)` is the black year pill.
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'timeline-list';
  [...block.children].map(entryOf).filter(Boolean).forEach((li) => list.append(li));
  block.replaceChildren(list);
}
