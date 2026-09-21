# SKODA-702 — Performance (Lighthouse≈100, RUM, LCP/CLS, 3-phase load)
- **Epic:** E07 — QA, Perf, A11y & Launch
- **Type:** QA
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*

## Summary
Validate the pilot pages hit Lighthouse ≈100 with RUM enabled, healthy LCP/CLS, and a correct three-phase (eager/lazy/delayed) load.

## Description
The static architecture should deliver near-perfect performance: buildless, three-phase load, masters-only + webp + `<picture>` with intrinsic dimensions (source already has width/height → low CLS). This ticket measures the imported pilot pages, tunes to target, and confirms all 🟠 integrations and third-party scripts load in the delayed phase so they never block the static delivery.

## Requirements / Spec
- Lighthouse ≈100 on the pilot pages (press-release article, PR listing, representative pages).
- RUM enabled and reporting field data.
- LCP within budget (hero/master image is LCP-friendly — SKODA-202); CLS near-zero using intrinsic `width`/`height`.
- Three-phase load verified: eager (LCP content), lazy (header/footer/rest), delayed (consent/analytics/embeds).
- All 🟠 services and third-party scripts (OneTrust, GTM, embeds) confined to the delayed phase.

## Acceptance Criteria
- [ ] Lighthouse ≈100 achieved on pilot pages (report attached).
- [ ] RUM is active and collecting field data.
- [ ] LCP/CLS within budget; CLS driven near-zero via image dimensions.
- [ ] Three-phase load confirmed; nothing deferred-able runs eager.
- [ ] Embeds lazy-load (native `loading="lazy"`, aspect-ratio box, no CLS).

## Dependencies
- Upstream: SKODA-603 (imported pilot). / Downstream: SKODA-704 (visual critique + sign-off).

## Risks / Flags
- Real LCP/CLS and lightbox/embed lazy-load timing are `[RUNTIME-UNCONFIRMED]` — require a browser to confirm. (`SKODA-MEDIA-DEEP-DIVE.md` §10, `SKODA-EDS-DA-ARCHITECTURE.md` §13)
- Whether the gallery lightbox fetches larger originals on click (adds delivered weight) is unconfirmed — check during measurement.
