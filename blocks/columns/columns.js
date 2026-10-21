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
 * `centered`: an equal story row of centred image cards (the Miss Peaches profiles), the
 * images at their own size; `portrait-NNN` there is each card's first image (`captioned`,
 * its caption under it, is CSS only).
 * Values are read from the authored classes, so malformed ones (`split-5`, `split-x`) are
 * ignored and the block keeps the default rendering.
 * @param {Element} block
 * @returns {boolean} whether the block is a split or centered row
 */
export function decorateSplit(block) {
  const value = (re) => [...block.classList].map((c) => re.exec(c)).find(Boolean)?.[1];
  const split = value(SPLIT_RE);
  const centered = block.classList.contains('centered');
  if (!split && !centered) return false;
  if (split) {
    block.classList.add('split');
    block.style.setProperty('--columns-split', `${split}%`);
  }
  const portrait = value(PORTRAIT_RE);
  if (portrait) {
    block.classList.add('portrait');
    block.style.setProperty('--columns-portrait', `${portrait}px`);
  }
  // the image cell (a portrait card: the picture, with a name and role, or a picture alone)
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const img = cell.querySelector('img');
    if (!img) return;
    cell.classList.add('columns-portrait');
    img.classList.add('columns-portrait-img');
  });
  return true;
}

/**
 * A per-cell px token (`<name>-A-B…`, one number per cell, in order): each cell with a value
 * gets `--columns-<name>`, the block the `<name>` class.
 * @returns {boolean} whether the block has the token
 */
function decorateCellToken(block, name) {
  const re = new RegExp(`^${name}((?:-\\d{1,3}){1,6})$`);
  const token = [...block.classList].map((c) => re.exec(c)).find(Boolean);
  if (!token) return false;
  const values = token[1].slice(1).split('-').map(Number);
  const cells = [...block.querySelectorAll(':scope > div:first-child > div')];
  block.classList.add(name);
  cells.forEach((cell, i) => {
    if (values[i] > 0) cell.style.setProperty(`--columns-${name}`, `${values[i]}px`);
  });
  return true;
}

/**
 * `offset-A-B…` (story rows): the source's spacer widgets leading each cell (`skoda-offset`), in
 * px per cell, in order (`offset-48-24`: the 4×4 quote 48px down, the portrait 24px). Each cell
 * gets its `--columns-offset`; columns.css applies it from 720px, as the source shows them.
 * @param {Element} block
 * @returns {boolean} whether the block has offsets
 */
export const decorateOffsets = (block) => decorateCellToken(block, 'offset');

/**
 * `lead-A-B…` (story rows, #380 review): the blank editor lines leading each cell's text, in px
 * per cell (`lead-44-0`: the Peaq comfort quote one 44px line down). Unlike `offset`, the source
 * shows them at every width.
 * @param {Element} block
 * @returns {boolean} whether the block has leading lines
 */
export const decorateLeads = (block) => decorateCellToken(block, 'lead');

const PAD_RE = /^pad(-m)?-(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,3})$/;

/**
 * `pad-T-R-B-L` / `pad-m-T-R-B-L` (story rows, #380 review): the source row's own padding, in px,
 * on desktop / up to 780px (the Miss Peaches profile rows: `pad-m-15-15-15-15`, so the
 * portraits sit 25px in on a phone, as the source's). A missing one is no padding there.
 * @param {Element} block
 * @returns {boolean} whether the block has a row padding
 */
export function decorateRowPadding(block) {
  let found = false;
  [...block.classList].forEach((c) => {
    const m = PAD_RE.exec(c);
    if (!m) return;
    const [, mobile, ...box] = m;
    block.style.setProperty(mobile ? '--columns-pad-m' : '--columns-pad-d', box.map((v) => `${Number(v)}px`).join(' '));
    found = true;
  });
  if (found) block.classList.add('padded');
  return found;
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  if (block.classList.contains('stats')) decorateStats(block);
  decorateSplit(block);
  decorateOffsets(block);
  decorateLeads(block);
  decorateRowPadding(block);

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
