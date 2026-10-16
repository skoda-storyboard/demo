# SKODA-402d, News and Press Kits listings: every source facet, so deep links like `filter[sponsorship][]` work

- **Epic:** E04, Listings & Search
- **Type:** block config + importer (`listing`)
- **Phase:** A · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Origin:** reported in manual review on 2026-10-11. `/en/news?filter%5Bsponsorship%5D%5B%5D=icehockey` "does not work".
- **GitHub issue:** [#333](https://github.com/skoda-storyboard/demo/issues/333)
- **Status (2026-10-15, from GitHub):** 🟡 M1, in QA: PR #355 merged 2026-10-15 ("moving to QA").

## Problem
- **Source** `/en/news/?filter[sponsorship][]=icehockey`: "6 / 21" ice-hockey releases, with the Sponsorship pill showing "1".
- **`main`:** the filter is ignored, and all 51 press releases show with "Advanced filter (0)".
- **Cause:** the News listing only offers the facets in its `facets` row: `model, derivative, years, company, happening, technology`. That is the importer default `FACETS_DEFAULT` in `tools/importer/parsers/listing.js`. `decodeState` reads only the configured facets, so a deep link to any other facet is dropped.
- **Facets on the source News page (11):** Model, Derivative, Bodywork, Equipment, Year, Company, Event, **Sponsorship**, People, Interior/Exterior, Technology. Missing on EDS: `bodywork`, `equipment`, `sponsorship`, `vip` (People) and `view` (Interior/Exterior).
- **Index coverage on the 51 migrated releases:** bodywork 11, equipment 2, sponsorship 8, vip 25, view 0. `icehockey`: 1 (source: 21; the rest isn't migrated).

## Scope
- **Facets:** the News and Press Kits listing configs list the source's facets in source order (check the Press Kits facets against its source page). Update the importer default, re-import, and push both pages (DA preview; publish after merge).
- **Decision (Architect):** should a URL facet that's in `INDEX_FACETS` but not shown as a pill still filter? The source only deep-links to the facets it shows, so the recommendation is no; the fix is the config.
- Facets with no values in the scoped rows stay hidden, as today (`view` has 0 on News).
- **Out of scope:** migrating the other 20 ice-hockey releases (content scope).

## Acceptance criteria
- [ ] `/en/news?filter[sponsorship][]=icehockey` shows only the matching releases, the Sponsorship pill shows (1), and "Advanced filter (1)". The same works for one bodywork, equipment and vip link.
- [ ] The pill order matches the source on News and Press Kits at 1440 / 768 / 375. Measured, no screenshots.
- [ ] Importer test updated. `npm test` covers the listing logic, and `npm run lint` is clean.
- [ ] The re-imported pages differ from DA only in the `facets` row (DA diff attached).

## Dependencies
- Related: #328 (SKODA-402c overlay cards), SKODA-402 / 402a, `docs/ui-specs/faceted-listing.md` §3.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
