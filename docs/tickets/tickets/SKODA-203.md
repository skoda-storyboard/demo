# SKODA-203, Gallery block + lightbox modal (/modals/)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/gallery-lightbox.md`](../../ui-specs/gallery-lightbox.md)** (captured via Chrome DevTools with the lightbox opened live). Read it before implementing.

Key facts from capture that change this ticket:
- Source has **two** lightbox systems: **jQuery colorbox** on desktop (opened live: `#cboxCurrent` counter, prev/next `61×60`, close `60×60`, `#cboxTitle` from `data-caption`) and the custom **`sb-gallery-lightbox`** gated at `width()<=767` on mobile. **Recommend one accessible lightbox at all viewports** (retire the desktop/mobile split).
- Column algo **confirmed in CSS**: overview grid `flex:0 0 33.33%` (3) / `25%` (4) / `20%` (5), JS thresholds `>19→5`, `>9→4`, else 3.
- Lightbox chrome: overlay `rgba(0,0,0,.95)` z-99999, stage `calc(100vh − 93px − 56px)` contain-fit, green `#419468` prev/next discs.
- New tokens: `--gallery-accent:#419468`, `--gallery-divider:#5a5b5c`.

## Summary
Build the Gallery block (responsive grid + "show more") with an accessible full-screen lightbox modal via the `/modals/` convention.

## Description
Gallery appears on 50% of pages, predominantly press releases (`SKODA-EN-BLOCK-INVENTORY.md` §2A; §7 #3). It is the standout JS-driven block (§8): the source computes **column count by width** (`>19 items → 5 cols; >9 → 4; else 3`) and ships a **lightbox** overlay (`sb-gallery-lightbox`) gated at `width()<=767`. The EDS port rebuilds vanilla (no Owl/Isotope) with a proper accessible modal via `/modals/` (`SKODA-EDS-DA-ARCHITECTURE.md` §5; Block Collection modal `autoLinkModals()`). The source has WCAG gaps, this is a deliberate a11y upgrade, not a port.

## Requirements / Spec
**DA content model (table):**
```
| Gallery                          |
| ---                              |
| ![img](1.jpg) | Caption 1        |
| ![img](2.jpg) | Caption 2        |
```
- Each row = one gallery item (image + optional caption). Import carries `alt` + `data-caption` (53% of source captions live in `data-caption`, arch §7; must not be lost).

**`decorate(block)` outline:**
1. Build responsive grid; compute column count by item count/viewport (reproduce 5/4/3 branch as CSS grid + minimal JS), no library.
2. Lift `<img>` out of `<p>`, wrap `<picture>`; render caption into `<figcaption>` from `data-caption`.
3. Optional "show more" expand for large sets.
4. Lightbox: link items via `/modals/` convention → accessible overlay with **focus-trap, Escape to close, arrow-key navigation between items, focus return on close**.
- CSS: mobile-first grid + overlay via SKODA-106 tokens.

## Acceptance Criteria
Measurable gates live in [`gallery-lightbox.md` §9](../../ui-specs/gallery-lightbox.md); summary:
- [ ] Grid column count reproduces `>19→5 / >9→4 / else 3` (`flex` 20% / 25% / 33.33%) with token gap.
- [ ] Captions from `data-caption` render as `<figcaption>` (none dropped).
- [ ] One accessible lightbox at **all** viewports (retire the colorbox/sb-lightbox desktop/mobile split): overlay `rgba(0,0,0,.95)`, contain-fit stage, prev/next/close + `aria-live` counter.
- [ ] Lightbox a11y (hard gate): `role=dialog`, focus-trap, Escape closes, arrow keys navigate, focus returns to trigger.
- [ ] Images optimized to `<picture>`; tokens-only CSS; `npm run lint` clean.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (grid + open lightbox).

## Dependencies
- Upstream: SKODA-102, SKODA-106
- Downstream: SKODA-603 (pilot press-release pages), SKODA-703 (a11y, modal focus-trap), SKODA-701 (unit tests)

## Risks / Flags
- [RUNTIME-UNCONFIRMED]: source lightbox focus behavior and whether it fetches larger originals (arch §13), verify in browser during SKODA-703.
- Accessibility is a hard acceptance gate (focus-trap/keyboard), the source is non-compliant; do not replicate its behavior, upgrade it.
- Import parser must carry `data-caption` (arch §7 / §10), coordinate with SKODA-601.
