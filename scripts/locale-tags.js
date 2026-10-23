/*
 * locale-tags.js: the BCP 47 tag of each locale tree (SKODA-1003), with no imports, so the
 * eager path (scripts.js sets html `lang`) and the header's language links share it.
 */

// The tag of a locale whose code alone names the wrong script: the source's Serbian is Latin,
// and `sr` (like the source's `sr-RS`) defaults to Cyrillic (L-SR-04).
const HTML_LANG = { sr: 'sr-Latn' };

/**
 * The BCP 47 tag for a locale code, as html `lang` and a language link's `lang`.
 * @param {string} code a locale code (`cs`, `sr`)
 * @returns {string}
 */
export default function htmlLang(code) {
  return HTML_LANG[code] || code;
}
