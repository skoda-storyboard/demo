# SKODA-1004a, CS corpus import (go-live)

- **Epic:** E10, Localization
- **Type:** import
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). **Go-live gate:** CS is the D1 partner of EN.
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 5–8d, mostly run and QA time *(planning estimate, not a quote)*
- **GitHub issue:** [#395](https://github.com/skoda-storyboard/demo/issues/395) (created 2026-10-20) (sub-issue of #394)
- **Status (2026-10-20):** 🔵 TODO (M2), no owner. Source:
  [locale review](../../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-CS-01 … L-CS-14.

## Why
CS is ≈ 5,100 docs, not the 1,056 CS-only items in Q-6:
- 1,454 stories, 2,456 press releases and 119 pages;
- 845 press-kit URLs under `/cs/tiskove-mapy/`;
- 189 Škodapedia terms, 23 model pages and 25 series hubs.

The 894 CS-only press releases are a live Czech newsroom: 35 in 2026, covering local pricing, plant newsletters, CSR
and the museum. The M1 CS demo set is not this corpus.

## Scope
- Run the SKODA-1004 tooling for every CS template: stories, press releases, pages, press kits (listing + 4 sitemaps),
  Škodapedia (per-locale generator, 802), model pages, series hubs and the 77 category archives (per 848's keep rule).
- **CS specifics:**
  - `template-layout-article-full` (46 stories) and the default post template (39) also run through the story
    importer. Add both to `_TEMPLATES.md`.
  - **CS+SK pairs:** 138 of the 162 "CS-only" stories have an SK twin, 130 of them the 2025 `/cs/130let/` series.
    Write `hreflang:sk` when SK lands (1004c). Fix the `/cs/130let/` 302 to `http://`.
  - **Facet values:** a CS vocabulary with `-cs` slugs and CS-only terms (czech-top-100, skofin, charita). Map them
    through the 1001 facet map.
  - **hreflang denylist:** the wrong source pairs (CS privacy ↔ `/en/press-kits/privacy-statement/`, CS test pages ↔
    DE test kits).
  - Drop the 4 password-protected CS test pages. The 2 employee event galleries go to SKODA-210.
  - **Feeds:** `/cs/feed/` and `/cs/tiskove-zpravy-archiv/feed/` (SKODA-405). `/cs/press-releases/` 301s to the
    translated base.
  - **Media:** keep the CS attachment titles, captions and alt per file (Q-11). Add the media-cart strings to
    `/cs/placeholders`.
- **Chrome:** `/cs/nav`, `/cs/footer`, `/cs/media-room/nav` and `/cs/media-room/footer` from SKODA-1006.
- **Legal:** the CS set from SKODA-843's per-locale matrix. The consent page is linked from every CS form (Q-9).
- **Newsletter:** lists 386 (Storyboard) and 342 (Media Room), per the SKODA-904 config.

## Acceptance criteria
- [ ] Imported counts per type match the 1004 enumeration report; skipped items are listed with their reason.
- [ ] 20 sampled CS pages per template render on `.aem.page` with CS chrome, CS facet values and a reciprocal hreflang
      to EN where the source has one.
- [ ] `/cs/query-index.json` lists the imported CS docs with the 15-facet schema.
- [ ] Every CS legacy URL in the enumeration 200s or 301s on the preview host (slash rule from 103a included).

## Dependencies
SKODA-1004, 1001, 1006, 103a, 843 (CS legal set), 904 (lists), Q-11, Q-12.
