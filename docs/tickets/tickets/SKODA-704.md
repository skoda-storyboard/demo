# SKODA-704 — Visual critique vs source + consent/analytics stubs + pilot sign-off
- **Epic:** E07 — QA, Perf, A11y & Launch
- **Type:** QA
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*

## Summary
Close the pilot: visual critique of the imported pages against the source, wire OneTrust consent and GTM/`skoda-analytics` as stubs, and get pilot sign-off.

## Description
Final gate for the M1 demo. Compare the imported demo pages against the source site for visual fidelity (layout, type, spacing, block rendering) and remediate material gaps. **Consent + analytics demo scope is TBD (deck §7/§9) — may be deferred to go-live;** if in the demo, wire consent (OneTrust) and analytics (GTM incl. the bespoke `skoda-analytics` dataLayer) as **stubs only** — delayed-phase, consent-gated — so the integration seam is proven without building the full event layer (that is SKODA-804 / SKODA-905, M2). Then obtain demo sign-off confirming the architecture is proven end-to-end. Note the **dedicated ~0.5 FTE QA owner** (OVERVIEW §5b) runs this gate.

## Requirements / Spec
- Visual critique vs source for each pilot page; log and fix material discrepancies.
- OneTrust consent **stub** wired in the delayed phase; analytics (GTM / `skoda-analytics`) **stub** gated behind consent — no full event-layer build.
- Confirm all 🟠 services remain deferred (plain download links; no cart/banner/newsletter; index-only search).
- Produce a pilot sign-off summary: what the pilot proves (static architecture end-to-end), what is deferred (story flattening → Phase B; dynamic services → Phase C; localization → Phase D).

## Acceptance Criteria
- [ ] Visual critique completed vs source; material gaps fixed or ticketed.
- [ ] OneTrust consent + GTM/`skoda-analytics` present as consent-gated delayed-phase stubs.
- [ ] Deferred services confirmed absent from the pilot.
- [ ] Pilot sign-off documented (proven vs deferred scope).
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-702 (performance), SKODA-703 (accessibility). / Downstream: gates Phase B (E08 editorial at scale, incl. SKODA-804 full consent/analytics wiring).

## Risks / Flags
- Consent/analytics are stubs only for the pilot — full OneTrust + GTM + `skoda-analytics` event-layer wiring is Phase B (SKODA-804) / per-block rebuild is Phase C (SKODA-905). Do not scope-creep.
- `skoda-analytics` is a bespoke dataLayer; full per-block re-emission is a later rebuild, not part of sign-off. (`SKODA-SYSTEM-BUILD-SPECS.md` §7)
