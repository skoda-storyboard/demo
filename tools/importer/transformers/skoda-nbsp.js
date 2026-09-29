/* eslint-disable */
/**
 * Transformer: keep the source's non-breaking spaces. Runs on the import config's
 * `preprocess` hook (each import-*.js calls it there): helix html2md normalises U+00A0
 * before the parsers and the beforeTransform/afterTransform hooks see the page.
 *
 * The source glues short words to the next one ("a&nbsp;roomy", "the&nbsp;strengths", Czech
 * typesetting); as plain spaces the imported copy wraps differently from the source (the
 * Octavia intro runs a line shorter at 375px).
 * Each U+00A0 between two visible characters becomes a plane-15 private-use placeholder
 * that survives html2md + md2da; `wrapPage` in tools/importer/push/push-lib.mjs turns it
 * back into U+00A0 before the DA upload. Whitespace-only runs (`<p>&nbsp;</p>` spacers)
 * are left alone, so html2md still drops them as before.
 *
 * Self-contained on purpose (loaded standalone by the transformer validator and inlined by
 * the bundler). Keep NBSP_PLACEHOLDER in sync with push-lib.mjs.
 */
const NBSP_PLACEHOLDER = '\u{F00A0}';
const GLUED_NBSP = /(?<=[^\s])\u00a0+(?=[^\s])/g;

export default function transform(hookName, element, payload) {
  if (hookName !== 'preprocess') return;
  const doc = element.ownerDocument || (payload && payload.document);
  const walker = doc.createTreeWalker(element, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeValue.includes('\u00a0')) {
      node.nodeValue = node.nodeValue.replace(GLUED_NBSP, (run) => NBSP_PLACEHOLDER.repeat(run.length));
    }
  }
}
