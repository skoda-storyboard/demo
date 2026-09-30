import { consentFromQuery } from './embed-consent.js';

let consentedLoaded = false;

/**
 * Dummy consent implementation.
 *
 * By default consent is declined, so consented scripts (analytics, martech, etc.)
 * are not loaded. This stands in for a real CMP (OneTrust, etc.) and can be
 * swapped out later.
 *
 * The default can be overridden with a query parameter for testing:
 *   ?consent=accept   grant consent (loads consented.js)
 *   ?consent=decline  decline consent (default behavior)
 *
 * The ?consent= parsing is shared with the embed gate (scripts/embed-consent.js), so one URL
 * means the same thing for analytics and embeds; only the defaults differ.
 *
 * @returns {boolean} true if the user has consented
 */
function hasConsent() {
  const fromQuery = consentFromQuery();
  if (fromQuery !== null) return fromQuery;
  // default: decline
  return false;
}

/**
 * Loads consented scripts once consent is available.
 */
function loadConsented() {
  if (consentedLoaded) return;
  consentedLoaded = true;
  import('./consented.js');
}

/**
 * Notifies listeners of the current consent state and loads consented
 * scripts if consent has been granted.
 */
function onConsentUpdate() {
  const consented = hasConsent();
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
  if (consented) {
    loadConsented();
  }
}

onConsentUpdate();
