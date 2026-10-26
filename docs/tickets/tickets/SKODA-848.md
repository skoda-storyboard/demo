# SKODA-848, Taxonomy archives at scale: which of the 378 EN tag / category archives exist at go-live
- **Epic:** E02, Core Blocks (scale-out of SKODA-209)
- **Type:** import / decision · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#367](https://github.com/skoda-storyboard/demo/issues/367) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 2 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** 🔵 TODO (M2), no owner.

## Why
The source serves **378 EN taxonomy archives**: 77 categories, 90 `history` tags, 33 `company`, 33 `technology`,
28 `concept`, 16 `model`, 16 `derivative`, 15 `vip`, 14 `years`, and smaller sets
([coverage matrix](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §2). 41 are live. SKODA-209 owns the template, not
the volume, and nobody has decided which of the archives must exist.

## Scope
- Proposal to the client (D12):
  - **Keep:** the archives linked from the nav, cards or tag chips (Tags block), plus every facet term that has ≥ N items.
  - **Redirect:** the rest, to the facet-filtered listing (`/en/news?filter[<facet>][]=<term>`, the 402d deep links).
- Generate the archive pages from the index (category-archive importer), not by hand.

## Acceptance criteria
- [ ] Keep / redirect rule agreed. Every tag chip and category link on a migrated page resolves (0 dead links on a
      100-page sample).
- [ ] Every kept archive is imported, and every other archive has a redirect row.

## Dependencies
209, 402d, 841 (facets entered once), D12.

## Amendment (2026-10-22, M2 gap review §7.2)
Source: [M2 integration gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2, findings
G-D-03 (Medium, confirmed, with browser corrections) and G-E-03 (Low).

**Added scope**
- Podcast archives are keep archives (G-D-03). The source nav links `/en/category/podcast-en/` (200); the authored
  demo slug `/en/category/podcast/` 404s on the source. The Buzzsprout, Apple and Spotify show pages advertise
  this archive as the podcast website (RSS channel link). Per locale:
  - EN `podcast-en`: 30 episodes, 5 server pages × 6 cards (`/page/2/`–`/page/5/` 200, `/page/6/` 404). The
    visible UI is an AJAX "Load more" button; `/page/N/` is reachable only through `<link rel=next>`.
  - CS `podcast-cz`: 20; SR `podcast-en`: 21; SL `podcast-en`: 17.
  - SK `podcast-en` and DE `podcast-cz` are empty.
- Keep or redirect `/en/category/podcast-en/page/2/` to `/page/5/` (G-D-03).
- The demo sends the archive to WordPress: `scripts/links.js` LIVE_ONLY + LIVE_ALIASES rewrite it to the live
  archive in a new tab, and that target disappears at cutover. Delete those entries once the EDS archive exists
  (cutover checklist item) (G-D-03). Re-authoring the nav/footer link and correcting the "not an archive" note
  belong to SKODA-209 (G-D-03).
- 18 locale-less global-categories archives are missing from this ticket and the coverage matrix (G-E-03). They
  sit at `/global-categories/{term}/` (brand, citigo, citigoe-iv, classic-cars, concepts, cycling, emobility,
  enyaq-iv, fabia, kamiq, karoq, kodiaq, motorsport, octavia, rapid, scala, superb, yeti). They return 200 with
  `index,follow`, render on the Media Room shell and paginate with Load more (`/global-categories/brand/` shows
  6,718 items). The chrome never links them, and nothing redirects them today.
- Add the 18 to the redirect list: model terms to `/en/models/{model}`, the others to the facet listing (G-E-03).
  The coverage matrix row is a separate doc edit (G-E-03).

**Added acceptance criteria**
- [ ] The keep list names `/{locale}/category/podcast-*` for EN, CS, SR and SL; the empty SK and DE categories
      get a redirect or are dropped by the agreed rule (G-D-03).
- [ ] `/en/category/podcast-en/` and `/page/2/`–`/page/5/` resolve on EDS (kept or redirected); 0 links from EDS
      pages to the WordPress podcast archive (G-D-03).
- [ ] The `scripts/links.js` LIVE_ONLY / LIVE_ALIASES podcast entries are removed once the target exists, or the
      removal is on the cutover checklist (G-D-03).
- [ ] All 18 `/global-categories/{term}/` URLs have a redirect row (model terms to `/en/models/{model}`, the rest
      to the facet listing), and none returns 404 (G-E-03).

**Estimate**
- Estimate after the amendment: 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*.
  G-D-03 adds +0.5 SP; G-E-03 adds 18 redirect rows (about +0.5 SP with the model-term mapping).
