# SKODA-209, Category / Tag archive template
- **Epic:** E02, Core Blocks
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*
- **Status (2026-10-22):** 🟡 **In review** (branch `skoda-209-archive-closeout`): every acceptance criterion
  measured against the source on all 41 archives; the 13 company / crew / derivative / environment / people /
  years tag archives moved to the Media Room chrome, as on the source (see "Close-out" below).
- **Status (2026-09-26):** 🟡 **M1 slice done** (pulled forward from M2 by stakeholder request): 41 archive pages live,
  and every tag / category link on the site points at them. The styled term hero (240px banner) **moved to
  [SKODA-828](SKODA-828.md) ([#196](https://github.com/skoda-storyboard/demo/issues/196)) F3** on 2026-09-28, including the `archive-hero` → `Hero Image (archive)` re-import.

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
  - **Superseded (SKODA-831, 2026-10-05):** story URLs do not carry the sub-category (`/en/skoda-world/<slug>`), so
    the 7 sub-category archives stayed empty. Category archives now use `categories: <term slug>`; the index
    `categories` column holds each story's WP categories plus their ancestors (`SKODA-METADATA-SCHEMA.md`).
  - The old path-scoped `Listing` matched no row, so every archive was empty.
  - The source pager ("4 / 19", Load more) is removed. The `stories` block rebuilds the count row
    and the Load more spacing: SKODA-209a (#330).
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
- ~~The styled 240px term hero and the label chips (this ticket).~~ Moved to SKODA-828 F3 (2026-09-28).
- Nav/footer Series + Podcast targets: a series hub (SKODA-207) or removal. *(2026-10-22: Series now goes to the
  SKODA-207 hub `/en/series-2`; Podcast still links the source's `category/podcast-en/`, out of this close-out.)*
- Kushaq tag: only the held quiz story links it (no archive page).
- New archives get added to `skoda-archive-url-set.txt` as their stories arrive.
- **Featured model card** ("Explore the Epiq", 11 model tag archives): the **import is done here**. `archive-list`
  emits a `feature` row (contract `stories-feature`, pinned, readable), and the 11 pages carry it in DA. The
  **UI representation** (rendering, responsive placement, collapsible mobile title) is
  **[SKODA-222](SKODA-222.md)**. It was split out because it spans two areas (stakeholder decision 2026-09-26).

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
- **Term hero:** short banner titled by the taxonomy term (category term; tag = parent + term). *(UI and the
  `Hero Image (archive)` re-import: SKODA-828.)*
- **Card grid:** `.search-results-items` reusing `card-teaser`; responsive 3/2/1 columns; newest-first (confirm).
- **Pagination:** accessible "Load more" over the query-index (default; confirm vs source mechanism).
- **Parser/retrieval:** query-index filtered by the term; Metadata carries template=category|tag + term.

## Requirements / Spec
- Reuse `hero` banner + `card-teaser` grid + query-index retrieval (as `story-rail`/`faceted-listing`).
- No facet panel; STO chrome; content cap 1248.
- Pagination = Load more button (or the confirmed source mechanism) with focus/aria-live on new results.

## Acceptance Criteria
Measurable gates live in [`template-category-archive.md` §10](../../ui-specs/template-category-archive.md); summary
(measured 2026-10-22 on all 41 archives, source vs EDS, 1280 / 768 / 500 plus 1440 / 992 / 375 for the ending):
- [x] Chrome as the source: Storyboard for the 15 categories and 13 model tags, **Media Room for the 13
      company / crew / derivative / environment / people / years tags** (corrected 2026-10-22, see below). Single
      `h1` = the term (category term; tag = parent + term, e.g. "Models Octavia") on 41 / 41. The source has no
      `h1` there (its term title isn't a heading): a deliberate accessibility gain.
- *(Hero banner criterion moved to SKODA-828 F3, 2026-09-28. Resolved 2026-10-05: both figures were right. The
  band is 184px at 375 (224 at 576–767, 240 from 768); 160px is its image row, with the 24px label row under it.)*
- [x] Card grid **3-up 1280 / 2-up 768 / 1-up 500**, the same on category and tag archives; visible 16:9 frame
      396 × 222.8 / 364 × 204.8 / 480 × 270 at x 26 / 10 / 10, equal to the source on 118 / 120 page × widths;
      **no facet panel** (41 / 41). The 2 others are the source's Kylaq / Slavia quirk (no featured card, yet the
      model-tag layout leaves column 3 / full width), not copied.
- [x] Pagination via the accessible "Load more" and the "6 / N" count row (SKODA-209a): the count row is the
      polite live region, focus moves to the first new card.
- [x] Content right edge equal to the source (cap `1248`, gutter `~16px`) on 123 / 123.
- [x] **Measured geometry replaces the ≤ 2% pixel diff** (decision 2026-10-22: review evidence is measured values,
      no screenshots): frames, ratio, order, cap, count row and every gap to the footer as above. Load more →
      footer equal on 81 / 81 (32, and 64 on the Media Room tags); last card → footer equal where everything fits.

## Dependencies
- Upstream: SKODA-201 (cards), SKODA-202 (hero), SKODA-402 (query-index retrieval), SKODA-601 (import infra)
- Downstream: SKODA-1001 (per-locale trees)
- Related: SKODA-828 (term banner UI and the archive-hero re-import, moved out 2026-09-28)

## Risks / Flags
- ~~**Pagination mechanism (🟡)**~~ Resolved (SKODA-209a, 2026-10-12): a "6 / N" count row + a JS "Load more"
  (+6), no infinite scroll.
- ~~**Grid columns (🟡)**~~ Resolved (2026-10-22): category and tag archives are both 3-up at 1280. The "2-up"
  tag archive in the capture was a model tag, where the featured model card takes column 3 (SKODA-222).
- ~~Ordering~~ Resolved (2026-10-22): newest-first. On all 41, the EDS cards are the source's in the same order
  (EDS holds only the migrated stories).
- ~~Metadata `template=category|tag`~~ Superseded (SKODA-209a decision): the archives carry `template: page`;
  the archive grid is authored (`columns 3`), and the chrome comes from the bulk metadata.

## Close-out (2026-10-22, branch `skoda-209-archive-closeout`)
**Finding: 13 tag archives are Media Room pages on the source.** The company / crew / derivative / environment /
people / years tag archives have `body.media-room`, the Media Room nav (News, Press Kits, …), the 688px
Media Room footer and the "Media Room" tab active; categories and model tags are Storyboard (830px footer).
The 48px under their pager (SKODA-209a's known deviation) is that Media Room page style.
- **Content (published 2026-10-22, user-approved):** 12 bulk-metadata rows in DA `/metadata.json` (310 → 322 rows,
  every other row kept; backup in `.migration/skoda-209/`): an exact row and a `/**` row each for
  `/en/tag/{company,crew,derivative,environment,people,years}` → `nav: /media-room/nav`,
  `footer: /media-room/footer`, `section: media-room`, the SKODA-309 mechanism. No re-import.
- **Code:** the Stories block reads the authored `section` metadata (as the header does): on a Media Room page
  the archive grid's section ends 48px under the pager (`stories-media-room`,
  `calc(var(--spacing-xl) + var(--spacing-xs))`), 16 elsewhere. CSS contract test in `stories.test.mjs`.
- **Verified** (local code + published sheet, source vs EDS): the 13 have the Media Room nav, footer (688px) and
  tab; the 28 others are unchanged; Load more → footer 64 (125 when every story fits) on the 13, 32 / 93 on the
  controls; the home "Latest Stories" feed is unchanged (featured layout, no count row).
- **Follow-up (card-wide, not this ticket):** the source rests every card image at 102% inside its 16:9 frame
  (`transform: scale(1.02)`); EDS card images rest at 100%. The frame is identical. It affects every card
  (rails, home, listings), so it belongs with the card primitive (SKODA-201), like SKODA-828's hero zoom.
- **Content, not code:** 8 archives hold fewer migrated stories than one source row (company/production,
  environment/greenfuture, people/stefani, model/slavia, concepts, corporate-life, design-eng, skoda-world/heritage),
  and classic-cars has none yet. The volume is SKODA-848 / SKODA-801b.

## M2 readiness review (2026-10-15)
- The template is done for M1. The **volume** (378 EN archives, 41 live) and the keep / redirect rule move to SKODA-848.
