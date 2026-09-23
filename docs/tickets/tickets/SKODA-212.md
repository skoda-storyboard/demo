# SKODA-212, Horizontal rails block (story-rail + carousel)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–5d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/carousel-rails.md`](../../ui-specs/carousel-rails.md)** (Flickity rails: `cellAlign:left, groupCells:true, pageDots:false`, arrows, drag; watchCSS activation; per-breakpoint cells-per-view ladder at 500/768/1024/1280). Home-composition context: [`template-home.md`](../../ui-specs/template-home.md). Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Gap that creates this ticket (2026-09-23): `carousel-rails.md` attributes the rails to *"SKODA-201 (rails part) + `stories`/`story-rail`"*, but **SKODA-201 shipped Cards/Teaser only** — `blocks/story-rail` and `blocks/carousel` do not exist on `main`. `template-home.md` line 56: "the rest are horizontal rails ('All' link + carousel)" — distinct from the feed (SKODA-214) and the promo-box (SKODA-213).

## Summary
Deliver the horizontal teaser rail: a scroll track wrapping `card-teaser` units with prev/next arrow controls, pointer drag, and `pageDots:false`. Implemented as `blocks/carousel` driven by `blocks/story-rail`, with Flickity-parity `watchCSS` activation — a carousel above a breakpoint, an intrinsic wrapped grid below. Rows are query-index-driven (tag/category/template filter) or author-curated cells. Reused by every home category/news rail and by the Series/Model/Press-release templates.

## Description
Confirmed live on `https://www.skoda-storyboard.com/en/` (category rails + models slider) and `/en/media-room/` (Flickity rails: Latest news / Images / Videos / Models / Press kits). Client PDF IDs: COM-10 (Slider/Carousel); STO-H03–H08; MR-H02–H07.

This ticket delivers:
- **`story-rail` + `carousel`:** a scroll track of `card-teaser` cards; `cellAlign:left`, `groupCells:true`, `pageDots:false`; prev/next arrows + pointer drag.
- **watchCSS parity:** carousel activates above a breakpoint; below it degrades to a plain intrinsic wrapped grid (no JS carousel). Per-breakpoint cells-per-view per `carousel-rails.md` cell math (~4.4 / 3.3 / 1.1 at 1280/768/mobile).
- Row source: query-index filter (tag/category/template) **or** author-curated cells; "All" link header.

Reuse-first: consumes `scripts/query-index.js` (SKODA-402) for indexed rows + `card-teaser` (SKODA-201). No new retrieval layer; no card re-implementation.

## Requirements / Spec
- **Reuse** `scripts/query-index.js` for indexed rails + `card-teaser` markup.
- watchCSS-style activation (carousel above breakpoint / wrapped grid below); prev/next controls keyboard-operable; pointer drag; respects `prefers-reduced-motion` (no auto-advance — rails have no autoPlay, arrows only per `carousel-rails.md` §149).
- Track a11y: `aria-roledescription`/`aria-label`, arrows are real labeled `<button>`s, focus visible.
- CSS scoped to `.carousel`/`.story-rail`; tokens only; fluid → intrinsic → breakpoint per `docs/guardrails/css-guidelines.md`.

## Acceptance Criteria
Measurable gates in [`carousel-rails.md`](../../ui-specs/carousel-rails.md); summary:
- [ ] `blocks/story-rail` + `blocks/carousel` exist and decorate defensively (authors omit/add cells).
- [ ] Carousel activates above the breakpoint (prev/next + drag work); degrades to an intrinsic wrapped grid below; reduced-motion respected.
- [ ] Cells-per-view ladder matches `carousel-rails.md` at 1280/768/mobile; arrows are labeled keyboard-operable buttons.
- [ ] Indexed rails reuse `scripts/query-index.js`; curated rails render authored cells; verified by grep/import (single loader).
- [ ] Output passes `npm run lint` + unit tests; visual diff vs source at 1280/768/500 ≤ 2% per-pixel.

## Dependencies
- Upstream: SKODA-201 (card-teaser), **SKODA-402 (query-index loader — reuse target)**, SKODA-401 (index schema), SKODA-106 (tokens)
- Downstream: SKODA-207 (Series hub rails), SKODA-208 (model page 5 rails), SKODA-604 (home composition), SKODA-607 (press-release related-media band)

## Risks / Flags
- **Carousel a11y (🟡 `[RUNTIME-UNCONFIRMED]`):** native scroll-snap + JS controls parity with Flickity — verify keyboard/drag/reduced-motion in a browser (shared concern with SKODA-203/702/703).
- **Curated vs indexed rows:** rails support both; confirm the authoring shape per source before locking the block config.
- **Home composition boundary:** builds the *block*; assembly into `/en/` is SKODA-604.
