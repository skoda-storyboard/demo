# SKODA-211, Stories feed block (Load-more pager, query-index)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/template-home.md`](../../ui-specs/template-home.md)** (the `/en/` "Latest Stories" / "News" feed sections) with cell/typography detail in [`carousel-rails.md`](../../ui-specs/carousel-rails.md) and [`card-teaser.md`](../../ui-specs/card-teaser.md). Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Gap that creates this ticket (2026-09-23): `carousel-rails.md` attributes the home blocks to *"SKODA-201 (rails part) + `stories`/`story-rail`"*, but **SKODA-201 shipped the Cards/Teaser unit only** — `blocks/stories` does not exist on `main`. `template-home.md` is explicit (line 48): the "Latest Stories"/"News" feed **uses a Load more `<button>`, NOT a rail** — so the feed is a distinct block from the horizontal rails (SKODA-212) and the promo-box (SKODA-213).

## Summary
Deliver the `stories` feed block: the vertical "Latest Stories" / "News" list that leads each home's `.cover-box` — first `pageSize` cards + an accessible **"Load more"** button that appends the next slice from the query-index and `history.pushState`es the offset. This is the **facet-less reuse of SKODA-402's `scripts/query-index.js` loader + `listing-logic` paginate** — it must not fork that engine.

## Description
Confirmed live on `https://www.skoda-storyboard.com/en/` ("Latest Stories" `.cover-box`) and `/en/media-room/` ("News"). Per `template-home.md` §Load-more: a real `<button>` appends the next page of cards (not infinite scroll, source-confirmed).

This ticket delivers:
- **`stories` (vertical feed):** first `pageSize` `card-teaser` cards + "Load more" appending the next slice; deep-link the offset via `pushState` (same pattern as SKODA-402, without facet params); newest-first ordering.
- Query-index-driven (template/category/tag filter via block config) with a defensive empty state.

Reuse-first: consumes `scripts/query-index.js` (chunk-aware memoized loader) + `listing-logic.mjs` `paginate`/`sortRows` + `card-teaser` markup. No new retrieval layer.

## Requirements / Spec
- **Reuse** `scripts/query-index.js` and `listing-logic.mjs` `paginate`/`sortRows` (SKODA-402). If a facet-less path needs a small extract, do it in `listing-logic` and depend on it — do not duplicate the fetch/paginate logic.
- "Load more" over the query-index; new results announced (`aria-live`), focus managed to the first new card; offset deep-linked via `pushState`; `popstate` restores.
- First image LCP-friendly (`fetchpriority=high`), rest lazy; `createOptimizedPicture`.
- CSS scoped to `.stories`; tokens only; fluid → intrinsic → breakpoint per `docs/guardrails/css-guidelines.md`.

## Acceptance Criteria
Measurable gates in [`template-home.md`](../../ui-specs/template-home.md); summary:
- [ ] `blocks/stories` exists and decorates defensively (authors omit/add cells).
- [ ] Renders first `pageSize`; "Load more" appends the next slice; offset deep-links via `pushState`; `popstate` restores.
- [ ] New results announced (`aria-live`) + focus managed to first new card.
- [ ] Reuses `scripts/query-index.js` (no second index fetcher) — verified by grep/import (single loader).
- [ ] First image LCP-friendly; output passes `npm run lint` + unit tests; visual diff vs source at 1280/768/500 ≤ 2% per-pixel.

## Dependencies
- Upstream: SKODA-201 (card-teaser), **SKODA-402 (query-index loader + paginate/sort — reuse target)**, SKODA-401 (index schema), SKODA-106 (tokens)
- Downstream: SKODA-209 (archive feed reuses this pattern), SKODA-604 (home composition)

## Risks / Flags
- **Engine reuse (🟢→🟡):** must consume SKODA-402's loader/paginate, not fork it; flag if a facet-less extract requires refactoring 402's `listing-logic`.
- **Feed page size + Load more vs infinite scroll (🟡):** default Load more button (source-confirmed on `template-home.md` §108); confirm `pageSize` per source before locking.
- **Home composition boundary:** this ticket builds the *block*; assembling it into `/en/` is SKODA-604.
