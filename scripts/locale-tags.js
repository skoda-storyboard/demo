/*
 * locale-tags.js: the document language of each locale tree (SKODA-1003), with no imports, so the
 * eager path (scripts.js sets html `lang`) can use it.
 */

// The source's own `<html lang>` per locale tree (PO decision on #485, 2026-10-26: the regional
// tag, as live). The URL prefixes, the placeholders sheets and the language links stay two-letter.
const HTML_LANG = {
  en: 'en-GB', cs: 'cs-CZ', de: 'de-DE', sk: 'sk-SK', sr: 'sr-RS', sl: 'sl-SI',
};

/**
 * The document language (BCP 47) of a locale code.
 * @param {string} code a locale code (`cs`, `sr`)
 * @returns {string}
 */
export default function htmlLang(code) {
  return HTML_LANG[code] || code;
}
