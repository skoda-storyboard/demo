# SKODA-905 — skoda-analytics rebuild: dataLayer event schema + per-block wiring
- **Epic:** E09 — Dynamic Services
- **Type:** integration
- **Phase:** C  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual 6–10d *(planning estimate, not a quote)*

## Summary
Rebuild the bespoke 140KB `skoda-analytics` instrumentation layer as an EDS module that pushes the same structured `dataLayer` event schema, and wire every rebuilt interactive block to re-emit its events. A hidden cross-cutting dependency of nearly every block.

## Description
`skoda-analytics` is a **custom 140KB tracking layer** (mu-plugin) that sits on top of GTM and pushes a **structured event schema to `window.dataLayer`** — not a thin GTM snippet. It explicitly instruments **forms (34 refs), downloads (23), share (14), banner (11), media-cart (8), video/Vimeo+YouTube (65), and the AjaxLoader/load-more** hooks. It is therefore a **dependency of nearly every interactive block**, not a standalone feature — this is the **hidden cost multiplier**: "rebuild the banner / media-cart / gallery / forms" each implicitly includes re-wiring its analytics events, or Škoda loses its established measurement taxonomy.

Rebuild = an EDS **instrumentation module** that reproduces the event schema and dimensions (`page.*`, `content.Type`, `content.CategoryL`, `form.Type`, `form.Place`, `cta.Type`, `hit.ClickURL`; events `pageView`, `trackEvent`, `trackEcEvent`), loaded in the **delayed phase** and consent-gated, plus **per-block wiring** into each rebuilt block's `decorate()` (banners 903, media-cart 902, newsletter 904, search 901, plus Phase A blocks: gallery, downloads, embeds/video, faceted-listing load-more, share). Builds on the dataLayer bootstrap from SKODA-804.

## Requirements / Spec
- Instrumentation module reproducing the `skoda-analytics` event + dimension schema 1:1 (`pageView`, `trackEvent`, `trackEcEvent`).
- Per-block event wiring for: forms, downloads, share, banner, media-cart, video (Vimeo/YouTube), load-more/listing, and pageView dimensions.
- Loaded in delayed phase, consent-gated; pushes to `window.dataLayer` → GTM → server-side sync.
- A shared helper API so each block's `decorate()` emits events without duplicating logic.
- Documented mapping from each block interaction → dataLayer event/dimension.

## Acceptance Criteria
- [ ] The event schema and dimensions match Škoda's GTM/dataLayer spec 1:1 (verified against the obtained spec).
- [ ] Each interactive block (forms, downloads, share, banner, media-cart, video, load-more) emits its events on interaction.
- [ ] Events fire only after consent and only in the delayed phase; no pre-consent tracking.
- [ ] `trackEcEvent` ecommerce-style events fire where the source emits them (campaign/lead measurement).
- [ ] A block-interaction → dataLayer mapping is documented for maintenance.

## Dependencies
- Upstream: SKODA-804 (consent + GTM/dataLayer bootstrap), E02 (core blocks to instrument), E04 (listings/search/load-more to instrument) / Downstream: SKODA-901/902/903/904 blocks re-emit via this module

## Risks / Flags
- **High (hidden):** cost multiplier — every rebuilt interactive block must re-emit events; scope hides inside other tickets if not tracked here.
- **Open (key input):** obtain the full **GTM container + `dataLayer` event/dimension spec** from Škoda's analytics team so the taxonomy is preserved 1:1.
- `trackEcEvent` ecommerce schema exists even on this non-commerce site (likely campaign/lead measurement) — confirm intended usage.
