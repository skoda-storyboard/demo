# SKODA-202, Hero block (image variant, LCP-friendly)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 2 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/hero.md`](../../ui-specs/hero.md)** (captured via Chrome DevTools, token-mapped, pixel-perfect AC). Read it before implementing.

Key facts from capture that change this ticket:
- There are **4 hero forms**, not one: (a) **story hero**, real `<img>`, title is **NOT overlaid** (sits above the image on desktop; **image-above-title flex-order swap at ≤1079px**; title 40px/600 ink → 28px mobile); (b) **archive/category banner**, fixed heights 160/200/240px (base/≥576/≥768), no scrim; (c) **landing/series**, `61.8vh` with scrim + overlaid white title 48px/300; (d) **press release**, **no hero block at all** (`h1.entry-title` 26px + inline image).
- Real `<img>` everywhere (never CSS background); `object-fit:fill` in source → **fix to `cover`**; `fetchpriority=high` + `loading=eager` + width/height already in source.
- **No CTA in any hero** (confirms model-hero-no-CTA); drop the CTA/button step for M1 unless authored.
- New tokens surfaced: `--heading-font-size-hero: 48px`, `--heading-font-size-hero-story: 40px`, `--weight-light: 300`, `--hero-vh: 61.8vh`, archive-height tokens, scrim gradients.

## Summary
Build the Hero block (`image` variant) using a real `<img>` optimized to `<picture>`, tuned for LCP.

## Description
Hero appears on story/skodapedia/page templates (1,587 pages, `SKODA-EN-BLOCK-INVENTORY.md` §2A; §7 #2). Per `SKODA-EDS-DA-ARCHITECTURE.md` §3/§5, use the Block Collection Hero pattern with a **real `<img>` → optimized `<picture>`** (not a CSS background) so it is the eager-phase LCP element. Responsiveness is CSS-only (inventory §8, straight port).

## Requirements / Spec
**DA content model (table):**
```
| Hero (image)          |
| ---                   |
| ![img](hero.jpg)      |
| # Heading             |
| Subcopy + [CTA](/x)   |
```
- Variant `image`. Image row + content row(s).

**`decorate(block)` outline:**
1. Detect image, `block.querySelector('picture')` with fallback `:scope > div > p > img` (image authored inside `<p>`).
2. Lift `<img>` to be a direct child of a `<div>`, wrap in `<picture>` so EDS emits responsive webp; keep `width`/`height` for low CLS.
3. Mark hero image `loading="eager"` / high `fetchpriority` (LCP); ensure it renders in the first (eager) section.
4. Structure heading + subcopy + CTA content cell; promote CTA link to button.
- CSS: full-bleed image + overlaid content via SKODA-106 tokens; mobile-first.

## Acceptance Criteria
Measurable gates in [`hero.md` §9](../../ui-specs/hero.md); summary:
- [ ] Real `<img>`/`<picture>` (never background-image); `object-fit:cover`.
- [ ] Story hero: title above image on desktop; **image-above-title order swap at ≤1079px**; box `16:9`; title 40px/600 ink desktop → 28px mobile.
- [ ] Archive/category banner variant: fixed height 160/200/240px at base/≥576/≥768, no scrim.
- [ ] Landing/series variant: `61.8vh`, scrim present, overlaid white title 48px/300.
- [ ] Press-release pages render **no** hero block (`h1.entry-title` + inline image), do not force one.
- [ ] No CTA rendered unless authored (no hero form carries a CTA in source).
- [ ] Image eager + measured LCP element; `width`/`height` present → low CLS.
- [ ] Works when image authored inside `<p>` (fallback path).
- [ ] Tokens-only CSS; `npm run lint` clean; heading hierarchy correct.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding image content).

## Dependencies
- Upstream: SKODA-102, SKODA-106
- Downstream: SKODA-603 (pilot pages), SKODA-702 (LCP/perf), SKODA-701 (unit tests)

## Risks / Flags
- LCP correctness is [RUNTIME-UNCONFIRMED] until measured in a browser (SKODA-702), real LCP/CLS carried as a residual unknown in arch §13.
- Background-image heroes would defeat LCP optimization, enforce real `<img>` in review.

## Import contract (SKODA-603)
Contract(s) `hero` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Status `resolve`: `blocks/hero` on `main` is only an empty boilerplate stub (0-byte `hero.js`); the project hero is `hero-image`. `parsers/hero.js` and `hero-banner.js` must emit `Hero Image (overlay)` / `Hero Image (archive)` (the parser change sits with 207/208). The check fails pages that emit `Hero`. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
