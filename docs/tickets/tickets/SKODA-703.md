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
- [x] Nav ARIA verified (mobile toggle state + mega-menu keyboard operable). The desktop dropdowns' screen-reader
      semantics are a follow-up: [SKODA-703a](SKODA-703a.md).
- [x] Gallery modals (gallery / story lightbox, Media Box lightbox) trap focus, close on Escape, and return focus to the
      trigger. The glossary modal is out of M1 (SKODA-206).
- [x] Contrast passes WCAG 2.1 AA on the M1 pages, apart from the PO-accepted source greys (audit §3).
- [x] All interactive controls are fully keyboard-operable (skip link and size-menu keys added; the story slider has no pause button, so it no longer autoplays: SKODA-819, PR #456, audit §2).
- [x] Empty alts flagged / backfilled; `[RUNTIME-UNCONFIRMED]` a11y items confirmed in-browser. The human NVDA /
      VoiceOver pass (audit §6) is still open.

## Dependencies
- Upstream: SKODA-603 (imported pilot); relies on SKODA-302 (nav ARIA fix), SKODA-203 (gallery lightbox modal), SKODA-206 (Škodapedia glossary modal). / Downstream: SKODA-704 (pilot sign-off).

## Risks / Flags
- Modal focus-trap and mega-menu timing are `[RUNTIME-UNCONFIRMED]` — must be checked in a browser/AT, not assumed. (`SKODA-EDS-DA-ARCHITECTURE.md` §13, `SKODA-SYSTEM-BUILD-SPECS.md` §5/§8)

## Status (2026-10-11, M1 ticket review)
🔵 **Ready to pick up, no owner** (#43).
- **Out of M1:** the Škodapedia glossary modal. SKODA-206 (#20) is M2, and Škodapedia links to the live site. Check it when SKODA-206 lands.
- **Modals in scope:** the gallery / story lightbox (`scripts/lightbox.js`), the Media Box lightbox (#315), the header search and the mobile nav.
- **Inputs already measured:** Lighthouse accessibility 92–93 on the series and press-kit hubs (#285, #275); the axe `color-contrast` / `link-in-text-block` findings that #307 and #308 report as the same as the source; the topbar "Media Room" contrast (#299). Record each as "fixed" or "as source, accepted".
- **As source, accepted (PO, 2026-10-13, #243):** the inactive language links use the source grey `#7c7d7e`
  (3.30:1 on the topbar, 4.12:1 on white), no longer the AA-passing `#5a5b5c`. See SKODA-303.
- **As source, accepted (#272 QA, PR #352, review-approved 2026-10-14):** the header topbar "Subscribe to our
  stories" CTA (`button.nav-subscribe` and its link form `.nav-topbar-utility a`) uses the same source grey
  `#7c7d7e`, 12px / 600: 3.30:1 on the Storyboard `#e6e6e6` topbar, below AA's 4.5:1. This is **not an AA pass**;
  to restore AA, set both back to `--skoda-grey-700` (`#5a5b5c`, 5.45:1).

## Status (2026-10-15): 🟡 In review (branch `skoda-703-a11y`)
Audit and fixes: [`docs/reviews/SKODA-703-A11Y-AUDIT-2026-10-15.md`](../../reviews/SKODA-703-A11Y-AUDIT-2026-10-15.md).
- **Method:** axe-core 4.14 (WCAG 2.0 / 2.1 A + AA) at 375 / 1280: baseline on all 134 M1 pages (`main` vs the
  source); fixes verified on an 18-page coverage set holding every template, block, block variant and section style
  (390 → 15 nodes, all PO-accepted); scripted keyboard / focus / ARIA pass on the 9 template URLs.
- **Fixed:** contrast to AA (two new tokens; the PO-accepted greys kept), underlines where links were colour-only, the
  locale links' label in name (EDS-introduced), a skip link, arrow keys
  in the Media Box / gallery size menu, alts for the 9 linked images that had none (5 Classic Days chapters re-pushed).
- **Reverses for AA (PO to confirm):** SKODA-205 (tag chip grey) and SKODA-308 (footer "Manage subscription" green).
- **Open:** the human screen-reader pass (audit §6); SKODA-703a (mega-menu semantics, M2); one DA-edited Classic Days
  chapter needs its image alt set by an author.
