/**
 * Split article body (SKODA-824). A highlight panel (Section Metadata `Style: body-column,
 * highlight-dark|grey`) splits the body column into consecutive `body-column` sections. The
 * two-column grids (story in styles.css, press release in its template CSS) would then
 * auto-place the sidebar beside the last part only. This counts the run so the CSS can span
 * the sidebar over every part from the first one. Layout stays in CSS: the custom
 * properties are only read inside those grids, and a page with a single body section gets
 * none, so its layout is unchanged.
 *
 * Every section before the run takes one grid row of its own (the full-width header), so
 * the first body part sits on row `index + 1`.
 * @param {Element} main The main element, after the section styles are applied
 */
// eslint-disable-next-line import/prefer-default-export
export function spanSidebar(main) {
  const sections = [...main.querySelectorAll(':scope > .section')];
  const first = sections.findIndex((section) => section.classList.contains('body-column'));
  if (first < 0) return;
  let count = 0;
  while (sections[first + count]?.classList.contains('body-column')) count += 1;
  if (count < 2 || !sections[first + count]?.classList.contains('sidebar')) return;
  main.style.setProperty('--body-row-start', first + 1);
  main.style.setProperty('--body-rows', count);
  main.style.setProperty('--body-rows-before-last', first + count - 1);
}
