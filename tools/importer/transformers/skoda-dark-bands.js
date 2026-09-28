/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: homepage dark bands → their own dark sections (SKODA-218).
 *
 * The Storyboard and Media Room homes stack their content in `.cover-box`
 * bands; the accent ones are `.cover-box.dark` (Storyboard "Series", Media Room
 * "Models"; measured on the live /en/ and /en/media-room/, 2026-09-28). Each one
 * becomes its own section carrying Section Metadata `Style: cover-box, dark`, so
 * the section (not the rail inside it) owns the green band: `cover-box` is the
 * home band box, `dark` the existing green/white primitive.
 *
 * An importer can pass its own band style as `PAGE_TEMPLATE.darkBandStyle`: the
 * Media Room home adds `compact` (its bands sit 16px tighter at the top).
 *
 * Content-driven: detected by the source class, never by heading text or URL.
 * `.socials-static` is excluded: the Social media band has its own parser
 * (SKODA-217), and the shared cleanup strips it otherwise.
 *
 * Same marker pattern as skoda-model-sections.js: the section breaks and the
 * Section Metadata are placed in beforeTransform, while every band still exists.
 * The block parsers then replace the band's inner `.search-results` with their
 * table in place, so the metadata stays last in the band's section.
 */

const DARK_BAND_SELECTOR = '.cover-box.dark:not(.socials-static)';
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

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const doc = element.ownerDocument;
  const style = (payload && payload.template && payload.template.darkBandStyle) || DARK_BAND_STYLE;
  [...element.querySelectorAll(DARK_BAND_SELECTOR)].forEach((band) => {
    if (!hasContent(band)) return; // nothing left to style
    // no leading/trailing break at the page edges: that would add an empty section
    if (hasContentBeside(band, element, 'previousElementSibling')) band.before(doc.createElement('hr'));
    band.append(WebImporter.Blocks.createBlock(doc, {
      name: 'Section Metadata',
      cells: { style },
    }));
    if (hasContentBeside(band, element, 'nextElementSibling')) band.after(doc.createElement('hr'));
  });
}
