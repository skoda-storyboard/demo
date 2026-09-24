/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda model-page section breaks + Section Metadata.
 *
 * Mirrors the repo's skoda-sections.js marker pattern. Reads the 11 sections
 * from `payload.template.sections` (model-page template) and:
 *  - inserts an <hr> break before every section except the first (10 breaks
 *    for 11 sections), so decorateSections in the runtime scripts.js splits
 *    the page into the same 11 sections;
 *  - emits a `Section Metadata` block (style: <section.style>) for any section
 *    that declares a style. On this Elroq page ALL 11 sections have style=null,
 *    so no Section Metadata is emitted — a plain <hr> break is correct per spec.
 *
 * WHY BOTH HOOKS + REVERSE ITERATION + MARKER (see generate-import-transformer.md):
 * block parsers run BETWEEN beforeTransform and afterTransform and call
 * element.replaceWith(block) on the element a section selector matches (e.g.
 * `article.skoda_model > .carousel` for the hero). If breaks were inserted in
 * afterTransform, those section elements would already be gone. So we insert
 * <hr> in beforeTransform (while every section element still exists), tagging
 * styled sections' breaks with a marker attribute, and place any Section
 * Metadata in afterTransform anchored to the surviving marker. Iterating in
 * reverse keeps every not-yet-processed section at the DOM position where
 * querySelector found it. <hr> is not a <div>, so inserting it never disturbs a
 * parser's :nth-of-type selectors.
 *
 * Selectors come straight from payload.template.sections (DOM-verified during
 * page analysis); section-1 `article.skoda_model > .carousel` and section-2
 * `.model-nav` were re-confirmed against cleaned.html.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// section.selector is an array of candidate selectors — first match wins.
function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    if (!sel) continue;
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      // First section gets no leading break and (having no style here) no metadata.
      if (i === 0 && !section.style) continue;

      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue; // no selector matched on this page — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have now run and may have replaced section elements. Anchor each
    // styled section's Section Metadata to whichever still exists: the marker
    // <hr> placed above, or (first section, no marker) the original element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue; // all null on Elroq → nothing emitted here

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue; // neither survived post-parse — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
