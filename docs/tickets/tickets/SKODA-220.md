# SKODA-220, Quote block (centred pull-quote + short rule + attribution)
- **Epic:** E02, Core Blocks
- **Type:** block + import
- **Phase:** A · **Milestone:** M1 (demo-visible)
- **GitHub issue:** [#140](https://github.com/skoda-storyboard/demo/issues/140)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-10-01):** 🟡 PRESS-KIT QUOTES BUILT on branch `skoda-220-press-kit-quotes`; press releases still held (below).
  - The importer and `blocks/quote` are on `main`, with the first-glimpse quotes measured: rule x471.4 w81.2 at 1440 and x176.5 w37 at 390, as on the source, 10px above the ink attribution.
  - **Press-kit chapter quotes:** `Quote (left)` (see "Press-kit chapter quotes" below), on 5 chapters, re-imported locally. The DA push of those 5 pages follows the PR merge.
  - **Elroq accordion quote:** fixed in `blocks/accordion` at runtime, so no re-import is needed.
  - **Press releases not done (the AC below stays open).** The 4 releases re-import with their 6 `Quote` tables, but they can't be pushed yet.
    - Each release's own PDF (`260921_…Zellmer…`, `260916_…National-Theatre…`, `260902_…Board…`, `260911_…Superb…`) has no DAM row (`dam: n/a`), so the SKODA-503 binary gate holds all four. The DAM ingest runs on a developer machine.
    - The Zellmer re-import also emits the SKODA-824 `highlight-grey` FAQ section, whose runtime isn't built (fallback `broken`).
  - ~~**Not detected yet:** the press-kit chapter quotes~~: done, see below.

## Press-kit chapter quotes (2026-10-01)
**Where they are on live.** WordPress `figure.quote > blockquote > p > em` + `figcaption > em > strong`. They're left-aligned, with no rule, and the browser's quote marks sit on their own lines.

| Page (`/en/press-kits/…`) | Quotes |
|---|---|
| `skoda-peaq-press-kit-2/the-skoda-peaq-skodas-new-flagship-expands-the-brands-electric-portfolio` | Zellmer, Jahn, Neft (consecutive, 0px apart) |
| `skoda-peaq-press-kit-2/exterior-skodas-largest-suv-with-the-modern-solid-design` | Stefani |
| `skoda-epiq-press-kit-2/skoda-epiq-the-new-all-electric-entry-model-combining-accessibilitycompact-dimensions-and-everyday-practicality` | Zellmer, Jahn |
| `skoda-epiq-press-kit-2/exterior-the-first-skoda-production-model-to-fully-incorporatethe-modern-solid-design-language` | Stefani |
| `skoda-epiq-press-kit-2/battery-and-powertrain-variants-front-wheel-drive-architectureand-efficient-electric-performance` | Neft |
| `the-all-electric-skoda-elroq-breaking-new-ground-in-the-compactsuv-segment-with-a-covered-design` | Stefani: the **centred** quote, inside the "Modern Solid design with Tech-Deck Face" accordion |

Before this fix, the 5 chapters rendered a default blockquote (green leading border) with the name as a separate paragraph. On Elroq, the nested `Quote` table stayed a raw table inside the accordion answer.

**Built.**
- `parsers/quote.js` `parseFigure()`, run by `import-press-kit-default.js`, emits `Quote (left)` with rows `[quote, attribution]`.
  - It drops the italics and the edge `<br>`/`&nbsp;` (also inside an edge `strong`, never mid-sentence), and keeps a plain-text caption bold.
  - Consecutive figures share one block, one row each. Text between two figures keeps them apart.
  - The merge moves the outer table's own rows, so a table inside a quote cell can't swallow the next quote. A centred quote run inside a figure quote stays part of that quote's text and never becomes a `Quote` of its own, since blocks can't nest (PR #245 review, P2). The 5 chapters import identically.
  - A `cite` stands in for a missing caption; beside a caption it stays quote text.
  - A figure with media (`img, picture, video, audio, iframe, svg, object, embed, canvas`), or with no quote text, is left as authored.
  - Everything else in the figure is kept, so no words are lost: several blockquotes, loose text, lists and other blocks. A block is never wrapped in a `<p>`. That includes the source's stray `</p>` in the Peaq Neft caption.
- `blocks/quote/quote.css` `.quote.left` adds the left variant.
- `blocks/accordion` rebuilds a top-level `Quote` / `Quote (variant)` table in an answer as a quote block and loads it. The section keeps its own classes. Other tables, and anything inside a table, stay as authored. A failed load is caught and leaves the answer readable.
- Contract: `quote` gets the variant `left` (`block-contracts.json`, `SKODA-PENDING-BLOCK-CONTRACTS.md`).

**Measured, live vs ours** (figure box; `cap` is the caption offset in the figure):

| Width | Peaq intro, 3 quotes (h / cap) | Peaq exterior, Stefani (h / cap) |
|---|---|---|
| 1440 (col x106 w812) | live 260/212 · 236/212 · 188/164; ours 236/212 · 236/212 · 188/164 | 188/164 = 188/164 |
| 1080 (w700) | ours 284/260 · 260/236 · 212/188 | 212/188 (spec target 212) |
| 992 (w641) | ours 284/260 · 260/236 · 212/188 | 212/188 (target 212) |
| 768 (x10 w492) | live 380/332 · 308/284 · 260/236; ours 356/332 · 308/284 · 260/236 | 260/236 = 260/236 |
| 390 (x10 w370) | live 452/404 · 404/356 · 332/284; ours 428/404 · 404/356 · 332/284 | 308/284 = 308/284 |

- At every width the quote is 16/24 italic, and the name is 600 italic in #161718. There are 20px before and after the block and 0 between quotes. There's no horizontal overflow from the quote.
- All 5 chapters were re-measured at 1440/768/390 after the review fixes, with the same numbers. Epiq intro: ours 260 · 212 vs live 284 · 212 at 1440.
- The only difference is Zellmer's caption (Peaq and Epiq), one 24px line shorter. Both source captions end in a stray `<br>&nbsp;` (an authoring artifact), which the importer trims on purpose.
- **Elroq accordion quote, ours vs live.** It is centred, 16/24 italic, 600 name, with a 2px rule 20px below the quote and 10px above the name. Its height matches at 1440 (176 = 176) and 768 (272 = 272).
  - Ours sits 24px in from the column on each side (x130 w764 vs live x106 w812 at 1440, so the rule is 76 vs 81 wide). At 390 the narrower column adds 2 lines (368 vs 320).
  - The cause is the accordion's own `padding: 24px` on every answer, which `faq-accordion.md` §3 measures as full-column (812). It isn't quote-specific (see Notes).

**Accessibility.**
- `figure > blockquote + figcaption`: the figure takes its name from the caption (e.g. "Klaus Zellmer, CEO of Škoda Auto").
- The quote marks are CSS `open-quote`/`close-quote` (announced as punctuation, as on the source).
- The nested quote has no focusable content and opens with its accordion panel (`hidden` → shown). There's no motion.

**Notes (not fixed here, no ticket raised).**
- Accordion answers are padded 24px. The source answer is full-column, so every press-kit accordion answer is 24px narrower on each side than live. Owner: the shared accordion (SKODA-807 / 805c).
- At 1080 the header's search tools overflow the viewport by 27px (`.nav-tools` right edge 1107). This happens on every page (also `/en/media-room` and `/en/press-kits`), not just these. Owner: header.
- At 390 the Epiq battery chapter's Downloads strip overflows the page (scroll width 480 vs 390, `.downloads-item`). The published page does the same, so this predates the branch. Owner: the Downloads / press-kit body (SKODA-805c).
- After the Epiq intro's quotes, the next Columns image pair starts 40px below (its own `margin-top`); live has 30px. The same spacing applies after any content before a Columns block, so it isn't quote-specific. Owner: SKODA-805c.

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
- [x] 1440: quote centred 16/400/24 italic, rule 81×2 black centred, attribution centred bold (±2px). *(first-glimpse: rule x471.4 w81.2, identical)*
- [x] 390: rule 37×2 centred; quote wraps within the 370 column. *(x176.5 w37, identical)*
- [ ] Imported on the 4 PRs + the first-glimpse kit; no stray section breaks. *(First-glimpse: 2 Quote rows, pushed and previewed. The 4 PRs: 6 rows locally; push held by the SKODA-503 binary gate, see Status.)* *(Importer emits 6 + 2 `Quote` tables in local imports; not pushed to DA.)*
- [x] Lint + unit test for the importer detection (`parsers/quote.test.mjs`, plus the press-release / press-kit-default suites).
- [x] Press-kit chapter figure quotes → `Quote (left)`, matching the live heights and gaps at 1440/768/390, with 1080/992 on target. *(5 chapters re-imported locally, no words lost; DA push after merge.)*
- [x] The Elroq accordion's nested `Quote` renders as the quote block (`accordion.test.mjs`).

## Dependencies
SKODA-607 (press-release template), SKODA-805c (press-kit body), SKODA-801 (story quote widget).

## Import contract (SKODA-603)
Contract(s) `quote` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Pinned shape: `Quote` with a single row `[quote, attribution]`; the empty attribution cell is kept and no `hr` is emitted. `Quote (left)` has the same rows, one per quote (consecutive chapter quotes share a block). The block has always rendered every row, so `quote` keeps its baseline entry with no shape bump; the variant is registered in `block-contracts.json`. The story-flatten `skoda-quote` switches from a default-content blockquote to this table in 603 W1. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
