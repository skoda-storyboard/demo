# EN Home — Promo box auto-populate + Latest Stories offset (plan)

**Status:** PLAN — no block code changed yet (per decision 2026-09-24). Author-review this
before implementation.
**Scope:** the EN Storyboard home (`/en/`, template `page`), two adjacent sections:
`promo-box` (featured tiles) and `stories` ("Latest Stories" feed).
**Related:** SKODA-214 (`stories` feed block), SKODA-213 (promo-box mosaic / auto-rotate),
T1 in `SKODA-TEMPLATE-CONTENT-MODELS.md`.

## Current state (verified against origin/main @ aff9f34, live `/en/`)

- **`stories` block (SKODA-214)** exists (`blocks/stories/`). Config keys it reads:
  `index, path, template, category, tag(s), heading, sort, initial, perpage, columns,
  excludefeatured`. **There is NO `offset` config row.** The only mechanism to avoid
  repeating the promo picks is `excludeFeatured` (default on), which drops index rows
  carrying a `featured`/`promo`/`carousel` flag (`isFeatured()`).
- **The live `/en/` `stories` block** is authored as just `| heading | Latest Stories |`
  + `| template | story |` — no offset, no exclusion configured.
- **The query-index (`/en/query-index.json`) has NO `featured`/`promo`/`carousel` column**
  (columns are path,title,description,image,template,date,category,model,tags,+facets).
  0 rows are flagged → **`excludeFeatured` currently no-ops.**
- **There is NO `promo-box` block** on main. The live promo box is **pure authored
  content**: 3 hard-coded rows of `[image] [linked title]`.

### The gap
The T1 model text ("`stories` promo offset 0 limit 3 · `stories` latest offset 3") describes
an offset the code never implemented — it was meant to be the `featured`-flag exclusion, which
is not wired up (no index flag). So today nothing stops the feed from repeating the promo
stories, and the promo box cannot auto-populate (no block, no source field).

## Decisions taken
- **Promo source:** newest 3 `template=story` tiles from the query-index (offset 0, limit 3).
- **Feed:** must skip those same 3 so tiles never duplicate.
- **Implementation approach:** add a real `offset` to the `stories` block (chosen over the
  featured-flag route — no index-schema change, keeps promo+feed chronologically in sync).

## Design

### 1. `promo-box` block (NEW) — auto-populated, query-index-driven
- New `blocks/promo-box/{promo-box.js,promo-box.css}`. Reuses `scripts/query-index.js`
  (`loadQueryIndex`/`defaultIndexUrl`) + `listing-logic.mjs` (`scopeRows`/`sortRows`/
  `paginate`) + `scripts/card-teaser.js` — same retrieval stack as `stories`, no fork.
- Config (authored on the home): `| promo-box |` then rows
  `| template | story |`, `| limit | 3 |`, optional `| sort | newest |`, `| category | … |`.
  Default limit 3, sort newest.
- Render: newest `limit` rows → the measured promo mosaic (SKODA-213 / carousel-rails.md
  §3/§5): ≥768 a 1 big + 2 small static mosaic; <768 a 1-up auto-rotate. **This pass = tiles
  render (image + linked title) from the index**; the auto-rotate/mosaic polish tracks
  SKODA-213 and can land with it.
- Decorate defensively (authors may omit rows → sensible defaults; empty index → render
  nothing, no error), per repo block rules.

### 2. `stories` block — add `offset` config (small, additive)
- `parseFeedConfig`: read `offset` → `Math.max(0, Number(cfg.offset) || 0)`.
- Apply after scope+filter+sort, before the load-more `paginate`: drop the first `offset`
  rows of the sorted set (`sorted.slice(offset)`), so the feed's first `initial` cards begin
  at row `offset`. Load-more paging math is unchanged (operates on the post-offset set).
- Keep `excludeFeatured` as-is (harmless; a no-op until/unless a `featured` flag exists).
- Home authoring: `stories` gets `| offset | 3 |` (+ existing heading/template).
- Unit tests: extend `blocks/stories/stories.test.mjs` — offset=3 skips the 3 newest;
  offset=0 unchanged; offset ≥ len → empty + no-results state; load-more still terminates.

### 3. Home content (`/en/`)
Re-author two blocks in the DA source for `/en/`:
- `promo-box` → config block (`template=story`, `limit=3`) replacing the 3 authored rows.
- `stories` → add `| offset | 3 |`.
Then preview + publish `/en/` (DA source needs a full HTML doc, not a `.plain.html` fragment —
see the publish note). Verify against the live query-index that promo shows rows 0–2 and the
feed starts at row 3 with no overlap.

### Coupling note
"Promo = newest 3, feed = offset 3" keeps them in sync **only while promo is newest-3**. If
promo later becomes editorially curated, revisit with the `featured`-flag approach (add a
`featured` index column + per-story metadata; promo renders featured rows, feed excludes them)
— captured here as the M2 alternative so the coupling is a conscious choice, not a trap.

## Checklist
- [ ] Review/confirm this plan (esp. offset-vs-featured-flag choice).
- [ ] `blocks/stories`: add `offset` to `parseFeedConfig` + apply pre-paginate; tests.
- [ ] `blocks/promo-box`: new query-index-driven block (newest N `template=story`), defensive decorate, CSS; tests.
- [ ] Re-author `/en/` promo-box (config) + stories (`offset 3`) in DA; preview + publish.
- [ ] Verify live: promo = newest 3 stories; feed starts at #4; no duplicate tiles; `npm run lint` + `npm test` green.
- [ ] PR with a `{branch}--demo--skoda-storyboard.aem.page/en` preview link.

**Execution note:** block code changes land on `main` (ship code) and are collision-sensitive
with SKODA-213/214 per `AGENTS-TEAM.md` — serialize with any in-flight work on those blocks.
