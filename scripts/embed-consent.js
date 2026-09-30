/*
 * embed-consent.js — the consent gate for third-party embeds (SKODA-204a).
 *
 * blocks/embed asks hasEmbedConsent() before it loads a YouTube / Vimeo / Buzzsprout /
 * Spotify iframe. Without consent the block shows the source's click-to-load placeholder
 * instead, and no request reaches the provider.
 *
 * M1 is a stub: consent defaults to GRANTED, so the demo behaves exactly as before. This is
 * deliberately separate from scripts/consent-check.js, which defaults analytics to declined.
 * The two share only the test switch (consent-check.js imports consentFromQuery from here):
 *   ?consent=decline   no embed consent: placeholders instead of players (preview / QA)
 *   ?consent=accept    embed consent (same as the default)
 *
 * Hook for SKODA-704 (consent stub) and SKODA-804 (OneTrust), no CMP integration in M1:
 *   setEmbedConsent(true | false | () => boolean)   set a value or a decider function;
 *   it dispatches `embed-consent.update` ({ detail: { consented } }) on window, and
 *   granting consent loads every waiting placeholder's embed.
 */

const EVENT = 'embed-consent.update';
const YES = ['accept', 'true', '1', 'yes'];

let decider = null; // set by the CMP hook; null = the M1 default

/**
 * The query-string override, if any.
 * @param {string} [search] location.search
 * @returns {boolean|null} true / false when ?consent= is present, else null
 */
export function consentFromQuery(search = window.location.search) {
  const value = new URLSearchParams(search || '').get('consent');
  return value === null ? null : YES.includes(value.toLowerCase());
}

/**
 * Whether third-party embeds may load now. The ?consent= switch wins (preview / QA), then a
 * value or decider set through setEmbedConsent(), then the M1 default: granted.
 * @returns {boolean}
 */
export function hasEmbedConsent() {
  const fromQuery = consentFromQuery();
  if (fromQuery !== null) return fromQuery;
  if (typeof decider === 'function') return !!decider();
  if (typeof decider === 'boolean') return decider;
  return true;
}

/**
 * The hook for the consent manager: a boolean or a function returning one. Notifies the
 * embeds through the `embed-consent.update` window event.
 * @param {boolean|(() => boolean)} value
 */
export function setEmbedConsent(value) {
  decider = typeof value === 'function' || typeof value === 'boolean' ? value : null;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { consented: hasEmbedConsent() } }));
}

/**
 * Subscribes to consent changes.
 * @param {(consented: boolean) => void} callback
 * @returns {() => void} unsubscribe
 */
export function onEmbedConsentChange(callback) {
  const listener = (e) => callback(!!e.detail?.consented);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
