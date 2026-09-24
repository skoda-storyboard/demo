# SKODA-203, Gallery block + lightbox modal (/modals/)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/gallery-lightbox.md`](../../ui-specs/gallery-lightbox.md)** (captured via Chrome DevTools with the lightbox opened live). Read it before implementing.

Key facts from capture that change this ticket:
- Source has **two** lightbox systems: **jQuery colorbox** on desktop press releases (opened live:
  `#cboxCurrent` counter, prev/next `61×60`, close `60×60`, `#cboxTitle` from `data-caption`),
  and custom **`sb-gallery-lightbox`** on stories (also opened live on desktop Favorit).
  **Implement one accessible viewer at all viewports**, with variant-specific presentation.
- The source's `>19→5`, `>9→4`, else 3 column algorithm controls its **optional overview mode**,
  not the Peaq press-release sidebar or the Favorit on-page thumbnail rail. The overview toggle
  was removed by stakeholder decision; do not restore it as part of this ticket.
- **Peaq press-release chrome:** opaque ink backdrop, white prev/next/counter group at bottom-right.
  Favorit's translucent desktop backdrop and green side controls belong to SKODA-216.
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
- **Media-cart integration boundary:** this ticket may render the "Add to media box" action as the
  visual/integration seam, but cart mutation and live delivery wiring belong to SKODA-505a/505b.
  The standalone gallery fixture is not required to add an item to the cart before those tickets
  are integrated.

## Acceptance Criteria
Measurable gates live in [`gallery-lightbox.md` §9](../../ui-specs/gallery-lightbox.md); summary:
- [ ] Press-release thumbnail grid uses its authored/template composition (Peaq sidebar uses two
      thumbnails across); source overview `>19→5 / >9→4 / else 3` is not required.
- [ ] Captions from `data-caption` render as `<figcaption>` (none dropped).
- [ ] One accessible lightbox at **all** viewports (retire the colorbox/sb-lightbox desktop/mobile
      split): opaque ink press-release backdrop, contain-fit stage, white bottom-right
      prev/next/counter and close; story styling follows SKODA-216.
- [ ] Lightbox a11y (hard gate): `role=dialog`, focus-trap, Escape closes, arrow keys navigate, focus returns to trigger.
- [ ] Images optimized to `<picture>`; tokens-only CSS; `npm run lint` clean.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (grid + open lightbox).

## Dependencies
- Upstream: SKODA-102, SKODA-106
- Downstream: [SKODA-216](SKODA-216.md) ([issue #106](https://github.com/skoda-storyboard/demo/issues/106); Favorit in-body story-gallery variant), SKODA-215 (gallery/lightbox share-this links), SKODA-505a/505b (media-cart state + presentation/live wiring), SKODA-603 (pilot press-release pages), SKODA-703 (a11y, modal focus-trap), SKODA-701 (unit tests)

## Risks / Flags
- [RUNTIME-UNCONFIRMED]: source lightbox focus behavior and whether it fetches larger originals (arch §13), verify in browser during SKODA-703.
- Accessibility is a hard acceptance gate (focus-trap/keyboard), the source is non-compliant; do not replicate its behavior, upgrade it.
- Import parser must carry `data-caption` (arch §7 / §10), coordinate with SKODA-601.
