# SKODA-201, Cards/Teaser block (overlay, media, toolbar variants)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 5–7d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/card-teaser.md`](../../ui-specs/card-teaser.md)** (source values captured via Chrome DevTools at 375/768/1024/1280, mapped to tokens, with pixel-perfect acceptance criteria). Read it before implementing.

Key facts from capture that change this ticket:
- Source `.article-teaser` is **one composite card** (layers `-media` image / `-overlay` caption / `-toolbar` actions), **not** three independent variants. EDS decomposes it into `cards-overlay` / `cards-media` / `cards-toolbar`; a single source teaser maps to a *combination*.
- Card radius `8px` (`--card-radius`) and shadow match `--card-shadow` exactly.
- The **only** title breakpoint is **768px** (promo first-item title `29.6px` at ≥768, `18px` below); standard title `18px`/`21.6`/weight 400. Adopt the source 768 ladder, not the boilerplate `900px`.
- New tokens surfaced: `--pill-radius: 50px`, `--skoda-green-emerald-hover: #a8ffcc` (toolbar-button hover), scrim gradients, and define the missing `--skoda-grey-500`.
- **Homepage/MR `.promo-box` featured grid (verified live 2026-09-15, was under-specified):** it is a card-based showcase, **not** the ad banner (`promo-banner`/SKODA-903). `>=768` it's a **static mosaic** (1 big card `66.66%` + 2 small `33.33%` stacked); `<768` it **auto-rotates**, Flickity boots via `watchCSS` into a 1-up carousel with `autoPlay:10000` (10s), `pauseAutoPlayOnHover`, no arrows (dots only). See [`carousel-rails.md`](../../ui-specs/carousel-rails.md) §3/§5.
- **Image zoom on hover:** the `.image-holder img` scale-transition system (`scale .5s cubic-bezier`) is real, but on listing/rail/promo cards rest and hover are **both `scale:1.02`** = no net zoom (the icon-fade is the visible affordance); a true `scale(1.1)` hover zoom exists **only on model-page cards**. Don't add a zoom to generic cards.

## Summary
Build the Cards/Teaser block, the universal card unit (91% page coverage), with `overlay`, `media`, and `toolbar` variants as compound classes.

## Description
Highest-priority build: the teaser card appears on nearly every source page (related-content rails, listings, home), per `SKODA-EN-BLOCK-INVENTORY.md` §2A (3,191 pages) and §7 (#1 build priority). Three co-occurring variants, `media` (image+text), `toolbar` (action row), `overlay` (styled hero-card form). Reuse Block Collection *Cards*, extend with variants; vanilla `decorate()`, re-derived CSS (`SKODA-EDS-DA-ARCHITECTURE.md` §5). Responsiveness is CSS-only grid reflow (inventory §8, straight port). Also the render target for the E04 faceted listing.

## Requirements / Spec
**DA content model (table):**
```
| Cards (overlay) |            |
| ---             | ---        |
| ![img](img.jpg) | ### Title  |
|                 | Summary…   |
|                 | [Link](/x) |
```
- First cell names block + variant: `Cards`, `Cards (media)`, `Cards (toolbar)`, `Cards (overlay)`.
- Each row = one card; cells map to image / title / summary / CTA(s).

**`decorate(block)` outline:**
1. Read variant from block classlist (`overlay`/`media`/`toolbar`).
2. For each row, build a card: lift `<img>` out of `<p>` so it is a direct child of a `<div>` (EDS `<picture>` wrapping gotcha), wrap in `<picture>`.
3. Add semantic region classes: `cards-card-image` + `cards-card-body` (both sides classified, no positional `:not()` chains).
4. `toolbar` → render action row; `overlay` → absolute-positioned text over image.
5. Decorate links as buttons where authored (`<strong>`/`<em>` wrappers).
- CSS: mobile-first grid reflow using SKODA-106 tokens; variants via compound selectors (`.cards.overlay`).

## Acceptance Criteria
Measurable gates live in [`card-teaser.md` §9](../../ui-specs/card-teaser.md); summary:
- [ ] All three variants render from their DA tables (`Cards (overlay|media|toolbar)`).
- [ ] Images render as optimized `<picture>` even when authored inside `<p>`; `object-fit:cover` on a `16/9` box (source uses `fill`, a distortion to fix).
- [ ] Card radius = `8px` (`--card-radius`); box-shadow = `--card-shadow` exactly.
- [ ] Overlay scrim = dual gradient (270deg→`rgb(0 0 0 /.25)` + vertical→`.1`); title contrast ≥ 4.5:1.
- [ ] Standard title `18px`/`21.6`/weight 400; **promo first card `29.6px` at ≥768px, `18px` below** (the 768 breakpoint, not 900).
- [ ] Toolbar flex/space-between/center; base bg white, overlay context transparent; pill buttons radius `50px`; hover bg `#a8ffcc`.
- [ ] `cards-card-image`/`cards-card-body` classes present (content-sniffed, no positional `:not()` chains).
- [ ] Uses tokens only; `npm run lint` clean.
- [ ] A11y: one tab stop per card; visible `:focus-visible` ring; icon buttons have `aria-label`; non-empty `alt`.
- [ ] Image hover: icon overlay fades in over `.3s`; base image `scale:1.02` overscan + `.5s` scale transition present; **no** `1.1` zoom on listing/rail/promo cards (that zoom is model-page-only).
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding image content).

## Dependencies
- Upstream: SKODA-102, SKODA-106
- Downstream: SKODA-402 (faceted listing renders Cards), SKODA-603 (pilot pages), SKODA-701 (unit tests)

## Risks / Flags
- Image-in-`<p>` extraction must be robust (import content default), missing it breaks `<picture>` optimization and LCP.
- Three variants co-occur on a page; ensure variant CSS is scoped so overlay doesn't bleed into media/toolbar.
