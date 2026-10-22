# SKODA-1004, Non-EN corpus import: shared tooling and per-locale runs (CS, DE, SK, SR, SL)

- **Epic:** E10, Localization
- **Type:** import / tooling
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). CS is a go-live gate; DE/SK/SR/SL timing per **Q-7**.
- **Estimate:** 3 SP for the shared tooling · AI-assisted 1–2d / manual 3–4d *(planning estimate, not a quote)*.
  Per-locale runs are sub-tickets: 1004a CS 5 SP, 1004b DE 3 SP, 1004c SK 3 SP, 1004d SR 3 SP, 1004e SL 1 SP.
- **GitHub issue:** [#394](https://github.com/skoda-storyboard/demo/issues/394) (created 2026-10-20) (sub-issue of the E10 epic #96; moved from #83 on 2026-10-22)
- **Status (2026-10-20):** 🔵 TODO (M2), no owner. Source:
  [locale review](../../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-X-03, L-CS-01, L-SK-01, L-SR-01.

## Why
No ticket moves the existing non-EN content (≈ 12,000 docs):
- SKODA-803 enumerates EN REST lists only.
- SKODA-1002 plans DE/SK/SR/SL as EW machine-translation projects.
- SKODA-1001 sets up the trees and indexes, not their content.

But DE, SK and SR are written locally, and CS, the D1 go-live partner, is ≈ 5,100 docs:

| Locale | Stories / releases / pages (REST, 20 Oct) | Press kits (sitemaps 1–4, a floor) | Škodapedia / models / series | ≈ Docs |
|---|---|--:|---|--:|
| CS | 1,454 / 2,456 / 119 | 845 | 189 / 23 / 25 | 5,100 |
| DE | 736 / 1,260 / 26 | 570 | 188 / – / – | 2,800 |
| SK | 833 / 642 / 30 | 626 | 159 / 13 / 13 | 2,300 |
| SR | 549 / 351 / 21 | 571 | – / 0 / 11 | 1,500 |
| SL | 314 / 4 / 12 | 0 | – / – / 5 | 335 |

A translation project can't produce any of this: 456 SK items and most 2026 DE stories have no translation at all.

## Scope (shared tooling, this ticket)
- **Enumeration per locale:**
  - REST `?lang=<loc>` for `posts`, `press_release`, `pages` and `skodapedia`;
  - the locale press-kit listing (load-more) plus **all four** press-kit sitemaps (`press_kit-sitemap4.xml` isn't in
    the sitemap index);
  - model and series sitemaps.
  
  The output is one URL list per locale and template, as for EN (803).
- **Filters:**
  - drop `content.protected` posts and write a redirect row for each (Q-13);
  - drop translation targets that aren't published: Polylang REST lists 100 unpublished targets.
- **Locale config for the existing importers:**
  - the locale prefix and translated URL bases (e.g. `/cs/tiskove-mapy/`, `/sk/press_kit/`, `/sr/press_release/`);
  - the locale chrome (SKODA-1006);
  - date formats;
  - the facet value map keyed on Polylang term translation groups (amendment to 1001).
  
  No per-locale importer forks.
- **hreflang columns** from the published Polylang pairs, written to the bulk metadata the way the EN/CS demo rows are
  today, until SKODA-1005 replaces that.
- **Redirect rows** per locale: translated and underscore bases, slug-only 301s and non-ASCII slugs.
- **Media manifest rows** per locale, keeping the locale title, caption and alt (Q-11).
- **Run report** per locale: the count enumerated, imported, skipped (with the reason) and redirected.

## Not in scope
- Translating anything new: that is SKODA-1002, reworded as post-go-live authoring.
- Legal pages: SKODA-843 per-locale matrix (Q-9).
- Chrome fragments: SKODA-1006.

## Acceptance criteria
- [ ] For each locale, the enumerated count matches REST `X-WP-Total` per type (± unpublished and protected items, each
      listed with its reason), and the press-kit count is at least the four-sitemap count.
- [ ] A dry run on 20 URLs per locale and template produces DA docs that pass `import:validate-blocks` and
      `validate-metadata.mjs` with the locale's bases, chrome and facet values.
- [ ] Every hreflang pair written is reciprocal and points to a published target.
- [ ] Protected posts are skipped and redirected.
- [ ] The locale run reports exist under `tools/importer/reports/` (not committed), with counts.

## Dependencies
- **Q-7** (which locales import when), Q-12 (cutoff per locale), Q-13.
- SKODA-803 (bulk tooling), SKODA-1001 (trees, index, facet map), SKODA-1006 (chrome), SKODA-103a (slash rule), SKODA-843
  (per-locale legal set).
- Sub-tickets: SKODA-1004a (CS), 1004b (DE), 1004c (SK), 1004d (SR), 1004e (SL).
