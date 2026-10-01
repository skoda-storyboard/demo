// "85 – 110 kW" → value "85 – 110" + unit "kW" (numbers, ranges and separators first)
const STAT_RE = /^([\d\s.,–—-]*\d)\s+(\S.*)$/;

/**
 * `stats` variant (SKODA-208 Technical Data): each cell is a key figure, authored as a bold
 * value with its unit, then a label. Split the unit off so value and unit can be sized apart.
 * @param {Element} block
 */
export function decorateStats(block) {
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    cell.classList.add('columns-stat');
    const strong = cell.querySelector('strong');
    const match = strong && !strong.children.length && STAT_RE.exec(strong.textContent.trim());
    if (!match) return;
    const [, valueText, unitText] = match;
    const value = document.createElement('span');
    value.className = 'columns-stat-value';
    value.textContent = valueText;
    const unit = document.createElement('span');
    unit.className = 'columns-stat-unit';
    unit.textContent = unitText;
    strong.replaceChildren(value, ' ', unit);
  });
}

const SPLIT_RE = /^split-([1-9]\d)$/;
const PORTRAIT_RE = /^portrait-([1-9]\d{1,2})$/;

/**
 * `split-NN` variant (SKODA-225, contract columns-split v2): an unequal 2-cell story row, the
 * first cell NN% of the row. An optional `portrait-NNN` is the authored display width of the
 * row's image (DA keeps only the file's own size); without it the image fills its cell.
 * Values are read from the authored classes, so malformed ones (`split-5`, `split-x`) are
 * ignored and the block keeps the default rendering.
 * @param {Element} block
 * @returns {boolean} whether the block is a split row
 */
export function decorateSplit(block) {
  const value = (re) => [...block.classList].map((c) => re.exec(c)).find(Boolean)?.[1];
  const split = value(SPLIT_RE);
  if (!split) return false;
  block.classList.add('split');
  block.style.setProperty('--columns-split', `${split}%`);
  const portrait = value(PORTRAIT_RE);
  if (portrait) {
    block.classList.add('portrait');
    block.style.setProperty('--columns-portrait', `${portrait}px`);
  }
  // the image cell (a portrait card: the picture, with a name and role, or a picture alone)
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    if (cell.querySelector('picture, img')) cell.classList.add('columns-portrait');
  });
  return true;
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  if (block.classList.contains('stats')) decorateStats(block);
  decorateSplit(block);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
