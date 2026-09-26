# SKODA-209, Category / Tag archive template
- **Epic:** E02, Core Blocks
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*
- **Status (2026-09-26):** 🟡 **M1 slice done** (pulled forward from M2 by stakeholder request): 41 archive pages live,
  and every tag / category link on the site points at them. The styled term hero (240px banner) is still open here.

## M1 slice (2026-09-26): archive pages so the site doesn't link to the source
**Why:** story sidebars, hero category pills and the nav/footer linked the live source for every tag/category.

**Scope (stakeholder decisions):**
- Pages: every archive a published page or the nav/footer links to, plus the nav's model tags. That's **41**:
  26 tag (`/en/tag/<taxonomy>/<slug>`) and 15 category (`/en/category/<cat>[/<sub>]`), listed in
  [`skoda-archive-url-set.txt`](../../planning/skoda-archive-url-set.txt).
- **All 41 published**, including the 16 with no imported stories yet. Those show the Stories block's
  "Nothing to show yet." until their stories are imported: 5 model tags (Fabia, Scala, Superb, Kamiq, Karoq),
  Classic Cars, Concepts, Corporate Life, Design Eng, and the 7 sub-categories.
- Links: through the SKODA-605 allow-list (re-import), not a runtime rewrite.

**Importer (`import-category-archive`):**
- `archive-list` now emits a **Stories** block: `template: story`, 3 columns, 6 cards + Load more,
  `excludefeatured: false`. Scope comes from the canonical URL. Tag archives use `tag: <slug>` (index `tags`).
  Category and sub-category archives use `path: /en/<cat>[/<sub>]/`, because story URLs carry the sub-category and
  the index `category` column is top-level only.
  - The old path-scoped `Listing` matched no row, so every archive was empty.
  - The source pager ("4 / 19", Load more) is removed.
  - The source archives list stories only (post type `post`).
- `archive-hero` (new) replaces `hero-banner` here: the banner picture + `<h1>` from the source labels
  ("Models Peaq", as in the spec) as default content, because the `Hero` block is an empty stub on main. Title = the term.
- Tests: `parsers/archive.test.mjs` (5).

**Links:**
- The archive list is the third input to `build-link-allowlist.mjs` (160 paths).
- All 16 bundles were rebuilt.
- 51 stories were re-imported and republished. For each, the diff against DA was **href-only**: every changed href
  goes from the source archive URL to its site-relative form, and nothing else changed (checked with the hrefs
  stripped).
- Epiq (it has DA hand edits) had the importer's own `skoda-links` transformer run over its DA doc, so only its
  links changed.
- **Nav / footer (hand-authored DA docs, no importer):** 28 + 25 hrefs rewritten, and nothing else.
  - The 21 flat `/en/tag/<slug>/` links were wrong: on the source they 301 to unrelated Czech pages.
  - 11 models now point to `/en/tag/model/<slug>`.
  - The 10 Lifestyle / Škoda World sub-items are **categories** on the source, and now point to `/en/category/...`.
  - The top-level categories lost the trailing slash that EDS 404s on.

**QA (2026-09-26):**
- Preview, 1440 + 390: **82/82 renders pass**: h1 + banner, card count = the expected index count, Load more
  only when >6, the empty state on the 16, no overflow, no block 404s.
- Grid: 3/2/1 per row at 1440/768/390, 16:9 cards (403px vs the source's ~396), banner 1248x244 (source ~240 high).
  Load more goes 6 to 12.
- **Live site-wide:** 105 index rows + nav + footer scanned. **0** archive links still point at the source;
  228 site-relative archive links, all 200.
  - Exception: nav/footer **Series** and **Podcast** (`/en/category/series/`, `/en/category/podcast/`) are not
    archives and 404 on the source too. Left as authored; tracked as open below.
- Click-through: the story sidebar tag, the nav model tag and the nav sub-category all land on the archive.

**Open:**
- The styled 240px term hero and the label chips (this ticket).
- Nav/footer Series + Podcast targets: a series hub (SKODA-207) or removal.
- Kushaq tag: only the held quiz story links it (no archive page).
- New archives get added to `skoda-archive-url-set.txt` as their stories arrive.

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/template-category-archive.md`](../../ui-specs/template-category-archive.md)** (captured via Chrome DevTools on the live eMobility category + Octavia tag). Read it before implementing. Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Key facts from capture (2026-09-15) that create this ticket:
- One WordPress `archive` template serves both `/en/category/<x>/` and `/en/tag/<taxonomy>/<x>/` (Storyboard side). Resolves the stale "category template not yet assembled" note.
- **No facet panel** (unlike the MR `template-search-results` engine): it is a short term hero (`240px` desktop / `184px` mobile, title = term name; tag shows parent+term e.g. "Models Octavia") + a `.search-results-items` card grid reflowing **3 → 2 → 1** columns (1280/768/500), `16:9` cards.
- **Pagination not in static DOM**, verify live (likely a JS "Load more" or infinite scroll).

## Summary
Assemble the Storyboard category/tag archive: a term hero + a responsive card grid driven by the query-index, with accessible pagination. Distinct from the MR faceted listing (no facet panel).

## Description
Confirmed live. This ticket delivers:
- **Term hero:** short banner titled by the taxonomy term (category term; tag = parent + term).
- **Card grid:** `.search-results-items` reusing `card-teaser`; responsive 3/2/1 columns; newest-first (confirm).
- **Pagination:** accessible "Load more" over the query-index (default; confirm vs source mechanism).
- **Parser/retrieval:** query-index filtered by the term; Metadata carries template=category|tag + term.

## Requirements / Spec
- Reuse `hero` banner + `card-teaser` grid + query-index retrieval (as `story-rail`/`faceted-listing`).
- No facet panel; STO chrome; content cap 1248.
- Pagination = Load more button (or the confirmed source mechanism) with focus/aria-live on new results.

## Acceptance Criteria
Measurable gates live in [`template-category-archive.md` §10](../../ui-specs/template-category-archive.md); summary:
- [ ] STO shell; single `h1` = term name (category term; tag = parent + term).
- [ ] Hero banner ~`240px` desktop / `184px` mobile; term title from `hero.md` scale.
- [ ] Card grid flex-wrap **3-up 1280 / 2-up 768 / 1-up 500**; cards `16:9`; **no facet panel**.
- [ ] Pagination via accessible "Load more" (or confirmed source mechanism); new results announced, focus managed.
- [ ] Content cap `1248`, gutter `~16px`.
- [ ] Visual diff vs source at 1280/768/500 ≤ 2% per-pixel (hero + grid).

## Dependencies
- Upstream: SKODA-201 (cards), SKODA-202 (hero), SKODA-402 (query-index retrieval), SKODA-601 (import infra)
- Downstream: SKODA-1001 (per-locale trees)

## Risks / Flags
- **Pagination mechanism (🟡):** no static control; verify Load more vs infinite scroll live before locking.
- **Grid columns (🟡):** category rendered 3-up while the tag archive rendered 2-up at the same width, confirm whether tag archives use a narrower grid.
- Ordering (newest-first assumed) to confirm.
