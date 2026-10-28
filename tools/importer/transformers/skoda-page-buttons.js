/**
 * Transformer: a generic page's pill buttons stay buttons (SKODA-843).
 *
 * The source's `a.ajax-loader-button` (its outline pill, the "Back to homepage" of
 * /en/soon-also-in-german, centred in a <center>) came out as a plain text link. Here each one
 * becomes a paragraph holding only the link in emphasis, the authored form of a secondary
 * button (scripts.js decorateButtons); the generic page styles it as the source's pill
 * (styles.css, page-body).
 *
 * beforeTransform; self-contained (no imports), as the bundles and the transformer validator
 * load it standalone.
 */

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const doc = payload?.document || element.ownerDocument;
  element.querySelectorAll('a.ajax-loader-button[href]').forEach((link) => {
    const text = link.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const a = doc.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = text;
    const em = doc.createElement('em');
    em.append(a);
    // the <center> (or paragraph) that only held the button goes with it; a button inside other
    // text stays inline, an emphasized link (never a paragraph inside a paragraph)
    const holder = link.parentElement;
    const only = holder && holder !== element && holder.matches('center, p')
      && holder.textContent.replace(/\s+/g, ' ').trim() === text;
    if (!only && holder?.closest('p')) {
      link.replaceWith(em);
      return;
    }
    const p = doc.createElement('p');
    p.append(em);
    (only ? holder : link).replaceWith(p);
  });
}
