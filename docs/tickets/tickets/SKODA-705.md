# SKODA-705 — Confirm "Load more" button variant vs source
- **Epic:** E07 — QA / Perf / A11y / Launch
- **Type:** design-confirm / block CSS
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 0.5d *(planning estimate, not a quote)*

## Summary
The homepage "Load more" button renders as a **transparent pill with a 2px solid dark border**; the live source renders a **white-fill pill with no visible border**. Confirm the intended variant, then align `blocks/stories/stories.css`. Surfaced by QA finding **F3** (2026-09-14 homepage QA pass). **Held for design confirmation — not blind-edited** (per the operating model: do not weaken/alter acceptance criteria, and do not change brand styling without a confirmed target).

## Description
Measured (QA F3):
- **Source:** `background rgb(255,255,255)`, no border, `border-radius 50px`, `font-weight 600`, ~178×44.
- **Local:** `background transparent`, `2px solid rgb(22,23,24)` border, `border-radius 50px`, `font-weight 600`.
Collision scope is **local** — `.stories .stories-load-more` (blocks/stories/stories.css line ~126), independent of the shared `.button` token in `styles/styles.css`. Cosmetic only; does not block a demo.

## Requirements / Spec
- Confirm with the client/design whether the white-fill (source-fidelity) or the current bordered pill is intended.
- If source-fidelity is confirmed: set `.stories .stories-load-more` to `background: var(--skoda-white)`, remove the border (or match source), keep radius 50px / weight 600.
- Re-QA the rendered button at 1440 + 390 against source.

## Acceptance Criteria
- [ ] Variant decision recorded (source-fidelity vs intentional deviation).
- [ ] If aligning: local button matches source measured values (bg/border/radius/weight); `npm run lint` clean.
- [ ] QA re-verifies the rendered result at both viewports.

## Dependencies
- Upstream: SKODA-201/402 (stories block + load-more).

## Risks / Flags
- 🟢 Trivial local CSS once the variant is confirmed.
- **Blocked on a design/client answer** — QA correctly flagged "confirm intended variant"; changing brand styling on assumption would violate the operating model's "don't weaken/guess acceptance criteria" rule.
