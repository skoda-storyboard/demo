# SKODA-1004c, SK corpus import (ŠKODA AUTO Slovensko, own Media Room)

- **Epic:** E10, Localization
- **Type:** import
- **Phase:** D · **Milestone:** M2; timing per **Q-7**
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–5d *(planning estimate, not a quote)*
- **GitHub issue:** to create
- **Status (2026-10-20):** 🔵 TODO (M2), no owner. Source:
  [locale review](../../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-SK-01 … L-SK-17.

## Why
SK is a separately authored, active locale:
- 833 stories and 642 press releases. 456 items (147 stories, 309 releases) have no translation in any language, and
  34 SK-only releases have been published in 2026.
- A full SK Media Room with a named local PR contact.
- 626 press-kit URLs, 159 Škodapedia terms, 13 model pages and 13 series hubs.

The census counted none of the press kits, Škodapedia, model pages or series.

## Scope
- **Import** every SK template with the SKODA-1004 tooling, Media Room included.
- **Underscore bases:** SK press kits and series live under `/sk/press_kit/` and `/sk/skoda_serialy/` (≈ 490 URLs).
  Decide the target base (e.g. `/sk/tlacove-mapy/<hub>/`, to match the SK listing) and add pattern redirects.
- **Slugs:** 7 slugs use the stylised Unicode "𝗶V". Normalise them and add redirect rows.
- **Facets:**
  - SK values are `-sk` per-locale terms; map them by translation group;
  - keep the SK-only values;
  - 3 of the 15 groups have no SK values;
  - the `years` facet has no 2025 tag: client data fix.
- **Media:** keep the SK titles and alt text per asset (Q-11). This finding (L-SK-15) is High.
- **Search:** diacritic folding and localised type labels in search-suggest (SKODA-1003 amendment).
- **Chrome:** `/sk/nav`, `/sk/footer`, `/sk/media-room/nav` and `/sk/media-room/footer` from SKODA-1006. The SK MR
  menus differ from EN (Models 1 vs 11, Company 4 vs 9).
- **Legal and newsletter:**
  - the SK set from SKODA-843 (10 pages; the cookie notice is Czech; 1 link 404s);
  - SK consent names ŠKODA AUTO Slovensko as controller, but the form shows the EN text. 904 carries the per-locale
    consent (Q-9).

## Acceptance criteria
- [ ] Imported counts per type match the enumeration report.
- [ ] Every `/sk/press_kit/*` and `/sk/skoda_serialy/*` source URL 301s to its new base on the preview host.
- [ ] The SK Media Room Images rail shows SK titles on the preview.
- [ ] 20 sampled SK pages render with SK chrome and facet values.

## Dependencies
Q-7, Q-9, Q-11; SKODA-1004, 1001, 1006, 103a, 843, 904, 511/517.
