# SKODA-851, Source-generated data after the freeze: facet vocabularies, category parents, a generator register

- **Epic:** E04, Listings & Search
- **Type:** block (listing, stories) + DA sheets + tooling clean-up
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Must be done **before the content freeze** (SKODA-710): after
  WordPress is switched off, the scrapers can't regenerate anything.
- **Estimate:** 4 SP · AI-assisted 1.5–2d / manual 3–4d *(planning estimate, not a quote)*. The findings sum to
  ≈ 2.75–3.75 SP (facet vocabulary 1–2 shared, category tree 1, register 0.5, 2027 seed and year values ≈ 0.25);
  4 SP takes the upper end, since the facet work also changes 841 step 4 and 402d.
- **GitHub issue:** [#428](https://github.com/skoda-storyboard/demo/issues/428) (created 2026-10-21, sub-issue of epic #5)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-T2-01, G-T2-02, G-KT-03 (Medium),
  G-T2-04 (Low); round 2: G-T9-03 (Medium). None was re-verified by a refuter; the code facts below were re-read on
  2026-10-21.

## Why
- **Listing filters are frozen at the scrape (G-KT-03, G-T2-01).** `blocks/listing/facet-labels.json` holds per-page
  option lists for all 15 facets on `/en/images`, `/en/videos`, `/en/news` and `/en/press-kits`, and `listing.js` offers
  only listed values (`isOffered`). On all 4 pages the `years` list ends at 2026 and `model` has 15–16 fixed values.
  179 of 409 index rows carry `years` 2026, so the first post tagged 2027, or a new model, never shows as a filter.
- **The vocabulary is already stale.** `build-facet-labels.mjs` scrapes the source's filter forms, and its `--check`
  fails today: the source added the VIP option `biene` (Images, News) after the 2026-10-16 commit. No index or feed
  value lacks a label yet.
- **No 2027 on go-live day (G-T9-03).** `/config/tags.json` (the DA tag picker, 29 rows) offers the years 2024, 2025
  and 2026 only, and the `years` lists in `facet-labels.json` also end at 2026. Offering unlisted index values (below)
  doesn't help authors: on 2 Jan 2027 they can't pick 2027. Related-story rails match `years` AND `model`
  (`story-rail.js:101`), so a launch-week story without a year tag drops out of year-based rails. The same chore
  comes back every 1 January, and nobody owns it.
- **SKODA-841 step 4 misses it.** "One vocabulary" makes `/en/facet-values.json` the source and generates
  `config/tags.json`, but never mentions `facet-labels.json`. A value authors pick from 841's pick list, or that the
  SKODA-511 sync writes to the feed, would still not be offered.
- **Parent category archives need tokens only the importer writes (G-T2-02).** Archives filter on the `categories`
  column, and `stories.js` matches tokens literally. The ancestors come from `CATEGORY_PARENTS` (46 entries, depth up
  to 2), scraped from WP REST (469 categories). 95 of 409 index rows carry an ancestor token, and 5 parent archives
  rely on them: models 76 rows, skoda-world 38, lifestyle 28, innovation-and-technology 11, sports 9. The DA story
  template prompt (`templates-spec.mjs:131`) has no parent rule, so a story authored after cutover in a child category
  misses its parent archive. The tree matches a fresh REST read (46 of 46), so it can move now without loss.
- **No register of generators (G-T2-04).** 36 `tools/` files reference the source hosts, 19 of them `import-*.js`.
  Five generators fetch the source and write data; three have M2 owners (hreflang alternates: L-X-02; media feed:
  511 / 511a / 520; manifest → cart index: 518 / 519) and two have none (facet labels, category tree). AR-07
  ("constants to DA sheets") was never ticketed, and the two dead Elroq transformers it scheduled for deletion in M1
  (`skoda-model-tags.js`, `skoda-model-metadata.js`) are still on main.
- **Correction to the review summary:** the link allow-list (`build-link-allowlist.mjs`) reads the **EDS** live index,
  not WordPress. It is import-time only and retires at the freeze; its runtime side (`links.js` LIVE_ONLY) is
  SKODA-710's link release.

## Scope
**Client:**
- Name the editorial owner of the vocabulary and category-tree sheets after go-live (with D15).

**Team:**
- **Facet vocabulary (amends SKODA-841 step 4 and 402d):**
  - generate `facet-labels.json` (labels, `_pages`, `_hidden`) from `/en/facet-values.json`, or have `listing.js` read
    `facet-values` with a per-page column;
  - values present in the index or feed but not in a page list are offered after the listed ones (at least `years`
    and `model`);
  - until the freeze, run `build-facet-labels.mjs --check` before each import batch; retire it at the freeze;
  - **seed 2027** in `facet-values` and `/config/tags.json` before the freeze, then generate the year values from the
    current date, or put a 1 December "add next year" line on the SKODA-712 calendar; pick one and record why.
- **Category tree (amends SKODA-841, with 831):**
  - publish the tree as a DA sheet (`/en/category-tree.json`, from `CATEGORY_PARENTS`);
  - the stories block expands a configured category to its descendants at runtime, or the options sheet writes the
    ancestors on save; pick one and record why;
  - fix the story template prompt in `templates-spec.mjs` (SKODA-842); retire `build-category-parents.mjs`.
- **Register:** a "generated data at cutover" table (tool, output, retire or replace, owner) in the SKODA-710 runbook,
  covering the 5 generators, the link allow-list, `MODEL_CARD_IMAGES` and `BANNER_ZIP_CORRECTIONS` (both re-import
  only, retire at the freeze) and the 19 importers.
- **Clean-up:** delete `skoda-model-tags.js` and `skoda-model-metadata.js` after a grep shows no importer uses them.

## Not in scope
- Per-locale facet maps on Polylang term groups (SKODA-1001 / 1004) and EN-keyed labels (L-X-09).
- The media feed generator (SKODA-511a, 520), hreflang (1005), the cart index (518 / 519), `links.js` (710).

## Acceptance criteria
- [ ] Unit test: an index row with `years` 2027 and an unlisted `model` value is offered in the filters of all 4
      listing pages, with no generated file changed.
- [ ] On 2027-01-02 the DA tag picker offers 2027, and a story tagged 2027 shows in the `years` filter and in a
      year-based rail.
- [ ] Adding a value with its label to the `facet-values` sheet and publishing it shows the labelled option on the
      listing, with no code-bus change.
- [ ] A draft story with only a child category appears on its parent archive. The 5 parent archives list the same
      pages as before when the ancestor tokens are removed from a test copy of the index.
- [ ] No runtime code reads a file produced by scraping WordPress; both scrapers are removed or marked retired.
- [ ] The register table exists in the SKODA-710 runbook, with an owner for every row.
- [ ] The two dead transformers are deleted; `npm test` and `npm run lint` are clean.

## Dependencies
SKODA-841 (one vocabulary, options sheet, `tags.json`), 402d / 402 (listing facets), 831 (category scoping), 842
(template), 710 (freeze, runbook), 712 (the 1 December line, if chosen), D15 (sheet owner). Amends AR-07 and AR-15 for
M2.
