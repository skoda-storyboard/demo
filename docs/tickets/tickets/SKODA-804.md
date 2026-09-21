# SKODA-804 — Consent + analytics wiring (OneTrust, GTM incl. skoda-analytics event layer)
- **Epic:** E08 — Editorial at Scale
- **Type:** integration
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## Summary
Re-integrate the vendor consent/analytics stack — OneTrust consent, GTM (with server-side sync), Hotjar — loaded in the delayed phase, and bootstrap the `window.dataLayer` foundation the bespoke `skoda-analytics` layer needs.

## Description
The source uses OneTrust (+ `geolocation.onetrust.com` for country detection, which also feeds banner geo-blocking), GTM (`GTM-M5GMBWF`) **with a server-side sync endpoint** (`…cloudfunctions.net`), and Hotjar. These are third-party scripts with no content to migrate — they load in EDS's **delayed phase** (`delayed.js`) and must be **consent-gated**.

This ticket establishes the consent gate and GTM/dataLayer bootstrap and pushes the baseline `pageView` event with the `skoda-analytics` page-level dimensions (`page.Section`, `page.Group`, `page.Name`, `page.LanguageVersion`, `page.ResponsiveLayout`, `page.Orientation`). It is the **foundation** for analytics; the full per-block event *re-emission* (forms/downloads/share/banner/media-cart/video/load-more) is the separate SKODA-905 rebuild in Phase C. Zero cookies are set on anonymous load — the consent gate must preserve that.

## Requirements / Spec
- OneTrust consent banner + geolocation loaded in delayed phase; analytics/Hotjar fire only after consent.
- GTM container (`GTM-M5GMBWF` or its replacement) + server-side sync configured; `window.dataLayer` initialized before GTM.
- Baseline `pageView` event pushed with the page-level `skoda-analytics` dimension schema.
- No cookies / no third-party network calls on anonymous, pre-consent load (preserve cacheability).
- Documented dataLayer contract stub for downstream blocks to extend (hand-off to SKODA-905).

## Acceptance Criteria
- [ ] Anonymous, pre-consent page load sets zero cookies and makes no analytics/vendor calls.
- [ ] After consent, GTM + OneTrust + Hotjar load in the delayed phase and a `pageView` fires with correct page-level dimensions.
- [ ] `window.dataLayer` is initialized and the page dimension schema matches the source taxonomy.
- [ ] Lighthouse is unaffected (all vendor scripts deferred to delayed phase).
- [ ] A documented dataLayer event-contract stub exists for SKODA-905 to build on.

## Dependencies
- Upstream: SKODA-603 (pilot pages to instrument) / Downstream: SKODA-905 (skoda-analytics per-block event wiring builds on this foundation)

## Risks / Flags
- **Open (High, hidden):** the full GTM container + `dataLayer` event/dimension spec must be obtained from Škoda's analytics team so the taxonomy is preserved 1:1 — key input for scoping SKODA-905.
- Consent-modal gating behavior is `[RUNTIME-UNCONFIRMED]` — verify in a browser.
- Server-side GTM sync endpoint ownership/credentials to confirm with Škoda.
