# SKODA-841, Tags entered once: facet metadata with pick lists, derived visible tags and archive matching

- **Epic:** E08, Editorial at Scale
- **Type:** setup (Experience Workspace options) + block + import
- **Phase:** A · **Milestone:** M2
- **GitHub issue:** [#319](https://github.com/skoda-storyboard/demo/issues/319)
- **Origin:** authoring review [`SKODA-AUTHORING-REVIEW-2026-10-10.md`](../../reviews/SKODA-AUTHORING-REVIEW-2026-10-10.md), AR-04 + AR-15 (user, 2026-10-10: "present a fix", tickets only)
- **Related:** SKODA-205 (Tags block), SKODA-211 (tag picker plugin), SKODA-401 (index facets), SKODA-605 rule 4 (tag
  link mapping), SKODA-842 (library; the options sheet lives there)
- **Status (2026-10-10):** 🔵 TODO

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

## Acceptance criteria
- [ ] Spike notes: the options-sheet registration and the `multi` value format, verified on a draft. The index reads
      the saved value (`/en/query-index.json` row).
- [ ] The Page panel shows the facet pick lists with labels for a story and a press release.
- [ ] With the `Tags` table removed, 5 stories and 3 releases render the same tag pills, with the same hrefs and labels,
      as before. Measured, with unit tests for the link mapping (archive / rule-4 / News filter).
- [ ] Tag and category archives list the same pages before and after, on 6 archives, when the `tags` row is absent but
      facets are set (test + a live check on a draft).
- [ ] `facet-values` is published, and there is one vocabulary.
- [ ] `npm test` and `npm run lint` are clean. DA push diff: only the `Tags` tables. Publishing needs a separate
      go-ahead.

## Effort
- The options sheet: about half a day.
- Derived tags and archive matching: 1–2 days with tests.
- Content re-push and QA: about 1 day.
