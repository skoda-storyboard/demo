# SKODA-713d, Analytics continuity across the cutover: baseline, path mapping, download KPI

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** analytics configuration / reporting
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). The baseline exists **before the freeze** (Q-20).
- **Estimate:** 2 SP · AI-assisted 1d / manual 2–3d, excluding client analytics time *(planning estimate, not a
  quote)*
- **GitHub issue:** [#433](https://github.com/skoda-storyboard/demo/issues/433) (created 2026-10-21, sub-issue of #420)
- Parent: SKODA-713 ([#420](https://github.com/skoda-storyboard/demo/issues/420))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KT-07, G-KO-03.

## Why
- **Every path changes form (G-KT-07, Medium, not re-verified).** 103a drops the trailing slash, so GA4 and Search
  Console page reports split into before and after. The `page.*` and `content.*` dimensions come from WordPress
  post types and categories.
- **No owner (G-KO-03, Medium, not re-verified).** 804, 905 and D10 never mention a baseline, an annotation, a
  normalised path, a report or its owner.
- **Downloads.** `/direct-download/` counted downloads server-side, and 520 removes it. Shared CDN PDF URLs carry
  `_gl` linker params for 2 of the 7 GA4 ids in GTM-M5GMBWF.

## Scope (amends SKODA-905, with 907)
- **T1 Baseline.** Receive the parent's C3 export (4 weeks per template and locale) before the freeze.
- **T2 Mapping.** Document old-to-new `page.*` and `content.*` values.
- **T3 Normalised dimension.** Add a slash-normalised page dimension; give report owners (C2) path guidance.
- **T4 Download KPI.** Record a decision: DAM delivery logs or redirect-with-event, after 103b (103e) and Q-21.
- **T5 Cross-domain.** Add the document host (Q-21) to the cross-domain list.
- **T6 Comparisons.** Compare week 1 and month 1 with the baseline, per template and locale.

## Not in scope
- The GTM and dataLayer rebuild and consent: 905, 907, 804 (D10, Q-16). The launch-day GA4 annotation: SKODA-713.

## Acceptance criteria
- [ ] The baseline exists before the freeze.
- [ ] The value mapping and the path guidance are published to the C2 report owners.
- [ ] The normalised page dimension reports the same value for `/x/` before and `/x` after the switch.
- [ ] The download-KPI decision is recorded in the register, and the document host is on the cross-domain list.
- [ ] Week-1 and month-1 comparisons per template and locale are delivered.

## Dependencies
- SKODA-905 and 907 (D10), 804, 103a, 103e, Q-21, 710 (freeze date). If 905 leaves M2 (G-H-08), this ticket is the
  vehicle. Parent: SKODA-713 (C2, C3).
