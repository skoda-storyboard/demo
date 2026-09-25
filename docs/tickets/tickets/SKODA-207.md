# SKODA-207, Series template (2-level: directory + hub)
- **Epic:** E02, Core Blocks
- **Type:** template / import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/series.md`](../../ui-specs/series.md)** (captured via Chrome DevTools; mostly reuse of `card-teaser.md` + `hero.md`). Read it before implementing. Page-type context: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Key facts from capture:
- Directory grid = **2 cols ≥781px, 1 col below** (source SiteOrigin grid). Directory card = `2:1` rounded image, overlaid white title `16px`/500, excerpt below (clamp), **no date** (confirms STO-H07).
- Hub = overlay hero `61.8vh` (48px/300 white, reuse `hero.md` landing/series variant) + **2-col story grid, `1:1` square images, newest-first** (`data-publish-date` desc, no visible date).
- Near-pure reuse of `cards-*` + `hero-image`; net-new = the two grid layouts + ordering signal.
- Open: confirm target grid (source 2/1 vs a 1/2/3 responsive upgrade) and the directory ordering/membership signal.

## Summary
Assemble the **Series** page type, confirmed by the 22-URL analysis (2026-09-14) to be a real **two-level template**, not the 301-redirect the master doc previously assumed. Level 1 is a series **directory** (`/series-2/`, ~20 series cards); level 2 is a series **hub** (`/series/<slug>/`, e.g. `125-years-of-motorsport`, a curated grid of the stories in that series). Pulled into M1 (decision D18) because it reuses already-built primitives and adds visible demo breadth.

> **Update (2026-09-24, M1 gap review, [`SKODA-M1-GAP-REVIEW.md`](../../reviews/SKODA-M1-GAP-REVIEW.md)).**
>
> **M1 scope = the 5 hubs only.** The in-scope hubs are:
> - 125-years-of-motorsport
> - 130-years
> - roads-places
> - unexpected-jobs
> - minutes-from-car-production
>
> The `/en/series-2/` directory is **not** in the 43-URL set and moves to M2. Its links are handled by SKODA-609 (hide
> or link out).
>
> **Empty-hub risk.** `import-series-hub.js` turns the curated source cards into an index-driven `tags=<series>`
> listing. With only the 43 URLs imported, 125-years drops from 8 source cards to about 2–3 and the other hubs are
> about empty. For M1, pick one of:
> - **(a)** import each hub's linked stories as corpus rows (SKODA-603), or
> - **(b)** keep the curated source cards as static `cards` content
>
> Default is (b) for any hub whose linked stories aren't in the corpus.
>
> **Estimate.** About 2 SP remains.

## Description
Verified live (`.migration/plans/url-analysis-comparison.md`, Bucket C):
- **Series directory**, hero + a grid of ~20 series cards (image + series title + short description), each linking to its hub.
- **Series hub**, hero (series title + description) + a curated grid of story cards (8 on the motorsport hub); no "load more" (curated set, not a paginated feed).

Both levels reuse the existing `cards-overlay`/`cards-media` card cells, `hero-image`, and the grid layout; the only net-new bits are the two grouping layouts (directory-of-series and hub-of-stories) and the retrieval/ordering signal.

## Requirements / Spec
- Directory page: hero + series-card grid; each card links to a hub. Source/order of series TBD (same open question flagged on STO-H07).
- Hub page: hero (title + description) + curated story-card grid; membership is per-series (tag/taxonomy-driven via query-index, consistent with `story-rail`).
- Reuse `cards-*` + `hero-image`; no bespoke card markup invented.
- Parser/transformer: detect the two Series source layouts, map to DA sections + one canonical Metadata block (template=series / series-hub, title, description, image).
- Correct the stale "Series is not a template" claim wherever it appears (done in SKODA-MASTER §3, this ticket tracks the build).

## Acceptance Criteria
Measurable gates live in [`series.md` §9](../../ui-specs/series.md); summary:
- [ ] Directory: hero + series-card grid (2 cols ≥781px / 1 below); card = `2:1` image + overlaid `16px`/500 title + excerpt, **no date**; links to hubs.
- [ ] Hub: overlay hero (`61.8vh`, 48px/300) + 2-col story grid (`1:1` images), newest-first order.
- [ ] Cards/hero reuse existing variants (no new card CSS beyond the grid layout).
- [ ] Parser output for `/series-2/` + one hub matches source structure in local preview.
- [ ] Metadata block carries template/title/description/image; passes lint.
- [ ] Visual diff vs source at 1280/768 ≤ 2% per-pixel (directory + hub, per [`series.md` §9](../../ui-specs/series.md)).

## Dependencies
- Upstream: SKODA-201 (cards), SKODA-202 (hero), SKODA-402 (query-index retrieval pattern used by the hub), SKODA-601 (import infra/parser conventions)
- Downstream: SKODA-1001 (per-locale trees)

## Risks / Flags
- **Ordering/source of series** (🟡): same open question as the homepage Series slider (STO-H07), confirm sort + whether the directory is curated or index-driven.
- Series hub membership signal (tag vs explicit list) to confirm against more than one live hub before locking the retrieval rule.

## Import contract (SKODA-603)
Contract(s) `cards-tiles`, `hero` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). The series hub imports as a curated `Cards (overlay, tiles)` mosaic (size token cell first), not the `series-grid` `Listing`, whose `tags` key the listing block doesn't read. The hero → `Hero Image (overlay)`. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
