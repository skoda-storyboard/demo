# SKODA-841, Tags entered once: facet metadata with pick lists, derived visible tags and archive matching

- **Epic:** E08, Editorial at Scale
- **Type:** setup (Experience Workspace options) + block + import
- **Phase:** A · **Milestone:** M2
- **GitHub issue:** [#319](https://github.com/skoda-storyboard/demo/issues/319)
- **Origin:** authoring review [`SKODA-AUTHORING-REVIEW-2026-10-10.md`](../../reviews/SKODA-AUTHORING-REVIEW-2026-10-10.md), AR-04 + AR-15 (user, 2026-10-10: "present a fix", tickets only)
- **Related:** SKODA-205 (Tags block), SKODA-211 (tag picker plugin), SKODA-401 (index facets), SKODA-605 rule 4 (tag
  link mapping), SKODA-842 (library; the options sheet lives there)
- **Status (2026-10-27):** 🟡 Phase 2 code built (branch `skoda-841-tags-once`): derived Tags, archive matching
  on facets, the vocabulary and pick-list generators. Waiting: the DA writes (vocabulary sheet, library
  `options` tab), the Page-panel check by a person, then the content step (was 🔵 TODO 2026-10-10)

## Problem
On a story the same tags are entered **four times**. On `/en/emobility/peaq-enters-production-…`:

| Where | Value |
|---|---|
| Visible `Tags` block | links `/en/tag/years/2026`, `/en/tag/model/peaq` |
| Metadata `tags` | `2026, peaq` |
| Metadata `model` | `peaq` |
| Metadata `years` | `2026` |

Who reads what:
- **Rails** filter on the facet fields. The story's related rail uses `model | peaq`, `years | 2026`; model pages
  filter on `model`.
- **Tag and category archives** (`stories` `tag | <slug>`) match the `tags` column.
- **The visible block** is authored links. Empty, it falls back to `article:tag`, but as plain labels, not links.
- **The tag picker (SKODA-211)** inserts only a visible `Tags` block, so a picker-tagged page can still miss rails and
  archives.
- **Two vocabularies:** `/config/tags.json` (29 tags, the picker) and `/en/facet-values.json` (275 values with labels,
  the listings).
  - `facet-values` is previewed but **not published**: `.aem.live` returns 404.

## Fix: authors edit only the facet fields, everything else is derived
1. **Pick lists in Experience Workspace.**
   - Add the library "options" sheet (Experience Workspace set-up-library guide, "Block options"; registered with
     SKODA-842) with rows for page `metadata`:
     - `template` and `category`: single-choice;
     - `model`, `years`, `derivative`, `company`, `environment`, `bodywork`, `technology`: `multi`, with
       `Label=value` pairs generated from `facet-values`.
   - The Page side panel then shows these as dropdowns and checklists.
   - A spike on a draft confirms where the sheet is registered and that `multi` saves comma-separated values the index
     reads.
2. **Derived visible tags.**
   - A story or press release with no (or an empty) `Tags` block renders it from the facet fields.
   - Each value links to its tag archive when a published `/en/tag/<facet>/<slug>` exists. Otherwise it uses the
     SKODA-605 rule-4 slug match (`technology: electromobility` → `/en/tag/crew/electromobility`), else a News filter
     link. Labels come from `facet-values`.
   - Authored `Tags` blocks still win.
3. **Archive matching on facets.** `stories` / `story-rail` `tag | <slug>` match a page when the slug is in `tags`
   **or** in any facet column. The `tags` row stops being required; it's kept for `article:tag` and existing pages.
4. **One vocabulary.** `facet-values` is the source. `config/tags.json` is generated from it, or the picker reads
   `facet-values`. Publish `facet-values`.
5. **Content:**
   - The importers stop emitting the `Tags` table on stories (the facet rows stay).
   - Re-push with the conflict guard.
   - The DA diff must show only the removed `Tags` table.
6. **Tag picker:** retire it, or keep it only as a helper that writes the facet values. That decision is in the
   tracker.

## Phase 0 findings (2026-10-27, measured on preview)
The census covered the index (413 rows) and the 322 indexed stories, releases, press-kit hubs and chapters.
- **`/en/facet-values.json` no longer exists** (404 in DA, preview and live). The listings name their facets from
  `blocks/listing/facet-labels.json` (code). Every authored pill label equals its name there.
- **Links are per term, not per page type.**
  - Stories link `/en/tag/<facet>/<slug>`; press-kit pages link the Press Kits filter.
  - Releases link the News filter, except 21 terms that link an archive: years, models, `company:production`,
    and `technology` values through the source's `crew` archive.
  - None of the 223 terms has two hrefs or two labels.
  - An archive link is on the site when the archive is a page here (544 / 544), else on the source (174 / 174).
  - Pills sort by label as plain text ("2018" before "4x4").
- **`crew` and `people` are WordPress taxonomies, not facets.** 28 stories show them, and only `tags` carries them.
  The 5 archives for those terms list their stories through `tags` alone.
- **Archives:** matching the slug in `tags` or a facet column leaves all 41 archives and all 44 tag-filtered Stories /
  Story Rail blocks unchanged; no slug collisions today.

## Decisions (2026-10-27, user)
- **Links: a term registry.** `blocks/tags/tag-terms.json` holds the archive exceptions per page family (generated).
- **`tags` stays for the non-facet terms** (`crew`, `people`); facets for the 15 facets. Step 3's "the `tags` row
  stops being required" holds for facet values only.
- **An empty `Tags` table stays** in the document as the marker (step 5: the importer empties it instead of dropping
  it).
- **One vocabulary: the DA sheet `/config/tags.json`** (`taxonomy | slug | label`, the sheet the tag picker reads),
  extended to every term in use. It replaces step 4's `facet-values`. The picker keeps pointing at it.

## Built (Phase 2, 2026-10-27)
- **`scripts/tag-links.js`:** facets + non-facet `tags` → pills (vocabulary label, the per-family link rule with the
  `tag-terms.json` exceptions, the on-site / source archive rule, the source's order). Unit tests:
  `scripts/tag-links.test.mjs`.
- **Tags block:** an empty block renders the derived pills; authored pills win; the `article:tag` plain labels are
  the last resort.
- **`matchesTags`** (listing-logic): a feed's `tag` matches `tags` or any facet column; used by `stories` and
  `story-rail`.
- **`tools/importer/build-tag-vocabulary.mjs`:** builds the sheet (168 rows: the sheet's 29 + 139 from the pages and
  the index) and `tag-terms.json` (21 release exceptions).
- **`tools/library/build-library.mjs`:** the Blocks sheet gets an `options` tab (Experience Workspace block
  options): the 15 facets and `tags` as `multi` pick lists from the vocabulary, `template` as a single choice.
  Registration, per the EW docs: the `options` tab of `/library/blocks`; `multi` saves comma-separated (what the
  index reads).
- **Measured:**
  - **All pages, simulated:** 271 / 274 Tags blocks derive with the same labels, hrefs and order. The 3 others show a
    pill no metadata holds (`crew:smart-dials___en`; a "+2" toggle link; a chapter's `history:lk-rkm` facet that
    its block omits), so they keep their authored block.
  - **Branch code, Tags tables emptied (local, nothing written to DA), 10 pages at 1280 and 375:** 5 stories, 3
    releases and 2 press-kit chapters. Pills, heading outline and Tags box size are the same, with no console errors.
    Real clicks open the archive, the source archive in a new tab, or the Press Kits filter.
- **Not yet:** the DA writes (vocabulary sheet, `options` tab), the Page-panel check, the importer change and the
  content step.

## Acceptance criteria
- [ ] Spike notes: the options-sheet registration and the `multi` value format, verified on a draft. The index reads
      the saved value (`/en/query-index.json` row). *(Documented and generated; needs the DA write and a draft save.)*
- [ ] The Page panel shows the facet pick lists with labels for a story and a press release. *(Needs a person in DA.)*
- [x] With the `Tags` table emptied, 5 stories and 3 releases (and 2 press-kit chapters) render the same tag pills,
      with the same hrefs and labels, as before. Measured, with unit tests for the link mapping (archive / exception /
      News and Press Kits filter).
- [x] Tag and category archives list the same pages before and after, with facets matched: all 41 (simulated with
      the production code). With `tags` empty, the 36 facet archives stay the same; the 5 `crew` / `people`
      archives need `tags` (decision above).
- [ ] One vocabulary: `/config/tags.json` extended and published (was: "`facet-values` is published").
- [ ] `npm test` and `npm run lint` are clean. DA push diff: only the `Tags` tables. Publishing needs a separate
      go-ahead.

## Effort
- The options sheet: about half a day.
- Derived tags and archive matching: 1–2 days with tests.
- Content re-push and QA: about 1 day.
