# SKODA-220, Quote block (centred pull-quote + short rule + attribution)
- **Epic:** E02, Core Blocks
- **Type:** block + import
- **Phase:** A · **Milestone:** M1 (demo-visible)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
Demo URL/block sweep, 2026-09-25 (report §5). Raised by the press-release and press-kit groups. The follow-up
check confirmed that no ticket covers it (SKODA-801's `skoda-quote` row is a different, story-only widget).

## Problem (measured)
- Inline quotes in `.entry-content` / `sow-editor`: a centred `em` quote 16px/400/24, then a **centred 81×2px black
  rule** (37×2 at 390, `margin-bottom 10px`), then a centred bold attribution.
- Found on 4 of 5 demo press releases (not Peaq) and twice on the "first glimpse" press kit (Zellmer, Stefani). At 1440
  the rule sits at x=471; at 390 at x=177.
- EDS today: left-aligned at x=96, and the rule is dropped (a bare `hr` in DA would also split sections).

## Scope
- `blocks/quote`: 2 cells (quote | attribution). Renders the centred quote, the ~10%-width rule and the attribution.
- Importer (press-release cleanup + press-kit importer): detect `p[style*=center] > em` + following `hr` +
  centred `strong` and emit a `Quote` table. Never emit the bare `hr`.
- Reuse it for the story `skoda-quote` blockquote (SKODA-801) where the shape matches.

## Acceptance Criteria
- [ ] 1440: quote centred 16/400/24 italic, rule 81×2 black centred, attribution centred bold (±2px).
- [ ] 390: rule 37×2 centred; quote wraps within the 370 column.
- [ ] Imported on the 4 PRs + the first-glimpse kit; no stray section breaks.
- [ ] Lint + unit test for the importer detection.

## Dependencies
SKODA-607 (press-release template), SKODA-805c (press-kit body), SKODA-801 (story quote widget).

## Import contract (SKODA-603)
Contract(s) `quote` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Pinned shape: `Quote` with a single row `[quote, attribution]`; the empty attribution cell is kept and no `hr` is emitted. The story-flatten `skoda-quote` switches from a default-content blockquote to this table in 603 W1. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
