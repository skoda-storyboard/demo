# SKODA-703 — Accessibility audit (nav ARIA, modal focus-trap, contrast, keyboard)
- **Epic:** E07 — QA, Perf, A11y & Launch
- **Type:** QA
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*

## Summary
Run an accessibility audit of the pilot against WCAG 2.1 AA — nav ARIA, gallery/glossary modal focus-trap, contrast, and keyboard operation — clearing the runtime-unconfirmed items in a browser.

## Description
The source has known WCAG gaps (checkbox-hack mobile nav, auto-rotating carousels, unverified modal focus behavior). The rebuilt blocks are a deliberate a11y upgrade, not a port. This ticket verifies nav ARIA (from the SKODA-302 mobile-nav fix), modal focus management for the gallery lightbox and Škodapedia glossary, color contrast, and full keyboard navigation — several of which are `[RUNTIME-UNCONFIRMED]` and need a real browser + screen reader.

## Requirements / Spec
- Nav ARIA correct: mobile toggle exposes state (from SKODA-302); mega-menu is keyboard-operable; focus order sane.
- Modal focus-trap for gallery lightbox and glossary term detail: trap focus, Escape closes, focus returns to trigger.
- Color contrast meets WCAG 2.1 AA across pilot pages/components.
- Full keyboard operation: listing facets (labels + keyboard), load-more, embeds, downloads, nav, modals.
- Backfill/flag the ~4% empty image alts surfaced in SKODA-501.
- Clear the `[RUNTIME-UNCONFIRMED]` items in a browser (modal focus behavior, mega-menu hover/keyboard timing).

## Acceptance Criteria
- [ ] Nav ARIA verified (mobile toggle state + mega-menu keyboard operable).
- [ ] Gallery + glossary modals trap focus, close on Escape, and return focus to the trigger.
- [ ] Contrast passes WCAG 2.1 AA on pilot pages.
- [ ] All interactive controls are fully keyboard-operable.
- [ ] Empty alts flagged/backfilled; `[RUNTIME-UNCONFIRMED]` a11y items confirmed in-browser.

## Dependencies
- Upstream: SKODA-603 (imported pilot); relies on SKODA-302 (nav ARIA fix), SKODA-203 (gallery lightbox modal), SKODA-206 (Škodapedia glossary modal). / Downstream: SKODA-704 (pilot sign-off).

## Risks / Flags
- Modal focus-trap and mega-menu timing are `[RUNTIME-UNCONFIRMED]` — must be checked in a browser/AT, not assumed. (`SKODA-EDS-DA-ARCHITECTURE.md` §13, `SKODA-SYSTEM-BUILD-SPECS.md` §5/§8)
