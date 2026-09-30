/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: homepage bands → their own sections (SKODA-218, SKODA-611a).
 *
 * The Storyboard and Media Room homes stack their content in `.cover-box`
 * bands; the accent ones are `.cover-box.dark` (Storyboard "Series", Media Room
 * "Models"; measured on the live /en/ and /en/media-room/, 2026-09-28). Each dark
 * band becomes its own section carrying Section Metadata `Style: cover-box, dark`,
 * so the section (not the rail inside it) owns the green band: `cover-box` is the
 * home band box, `dark` the existing green/white primitive.
 *
 * An importer can pass its own band styles on PAGE_TEMPLATE:
 *   - `darkBandStyle`: the Media Room home adds `compact` (its bands sit 16px
 *     tighter at the top);
 *   - `lightBandStyle`: when set, every light `.cover-box` becomes its own section
 *     with that Style too (Storyboard home: `cover-box`, SKODA-611a: one section
 *     per source band). Unset, light bands stay in their neighbours' sections.
 *
 * Content-driven: detected by the source class, never by heading text or URL.
 * `.socials-static` is excluded: the Social media band has its own parser
 * (SKODA-217, which emits its own breaks), and the shared cleanup strips it otherwise.
 *
 * Same marker pattern as skoda-model-sections.js: the section breaks and the
 * Section Metadata are placed in beforeTransform, while every band still exists.
 * The block parsers then replace the band's inner `.search-results` with their
 * table in place, so the metadata stays last in the band's section.
 */

const DARK_BAND_STYLE = 'cover-box, dark';

// real content (text or media), not just whitespace or an empty wrapper
function hasContent(el) {
  return !!el && ((el.textContent || '').trim() !== '' || !!el.querySelector('img, picture, iframe, table'));
}

// Any content before / after the band in page order, not only among its siblings:
// a band that is the first child of a wrapper can still follow content elsewhere,
// and without its break its `Style` would paint that content's section too.
function hasContentBeside(band, root, step) {
  for (let el = band; el && el !== root; el = el.parentElement) {
    for (let n = el[step]; n; n = n[step]) if (hasContent(n)) return true;
  }
  return false;
}

// adjacent bands (or the social parser's own breaks) must share one break:
// two <hr> in a row would author an empty section
const isBreak = (el) => !!el && el.tagName === 'HR';

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const doc = element.ownerDocument;
  const template = (payload && payload.template) || {};
  const darkStyle = template.darkBandStyle || DARK_BAND_STYLE;
  const lightStyle = template.lightBandStyle || '';
  const selector = lightStyle ? '.cover-box:not(.socials-static)' : '.cover-box.dark:not(.socials-static)';
  [...element.querySelectorAll(selector)].forEach((band) => {
    if (!hasContent(band)) return; // nothing left to style
    // no leading/trailing break at the page edges: that would add an empty section
    if (!isBreak(band.previousElementSibling) && hasContentBeside(band, element, 'previousElementSibling')) {
      band.before(doc.createElement('hr'));
    }
    band.append(WebImporter.Blocks.createBlock(doc, {
      name: 'Section Metadata',
      cells: { style: band.classList.contains('dark') ? darkStyle : lightStyle },
    }));
    if (!isBreak(band.nextElementSibling) && hasContentBeside(band, element, 'nextElementSibling')) {
      band.after(doc.createElement('hr'));
    }
  });
}
