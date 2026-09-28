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

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  if (block.classList.contains('stats')) decorateStats(block);

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
