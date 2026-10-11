# SKODA-836, Press-kit article importer for the `template-press-release` variant (Octavia RS 245)

- **Epic:** E08, Editorial at Scale
- **Type:** import / transformer
- **GitHub issue:** [#280](https://github.com/skoda-storyboard/demo/issues/280)
- **Phase:** A · **Milestone:** M2 candidate (user decision 2026-10-07: "new ticket, later")
- **Origin:** SKODA-832 QA (2026-10-07, defect D1); audit [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §3.1
- **Status (2026-10-10):** 🔵 TODO, M2 confirmed (user, 2026-10-10: keep M2, record the survey). RS 245 stays live in
  its flattened form for the demo; see "Survey".

## Problem
`/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps` was imported through
the generic page-base importer, so its DA doc is flattened: galleries, sidebar previews and the Media Box became
default content. It also has 222 "Add/remove" cart links, "+48", 3× "Show more Show less" and 3 empty PDF anchors.

Neither existing importer handles it:
- **press-kit-default:** `transformers/skoda-press-kit-default-layout.js` (around line 179) rejects the page with
  "Not a default press-kit article (body class missing)". The origin body class is
  `press_kit-template-template-press-release`.
- **press-release:** the bundle imports it, but keeps 110 "Add/remove" links, 3 "Show more Show less" and 213
  `/direct-download/` links (probe in `.migration/qa-832/rs245-probe/`).

## Scope
- Survey `press_kit-template-template-press-release` pages in the press-kit sitemap (RS 245 may not be the only one).
- Extend the press-kit-default layout (or add a variant) for this template: body column, sidebar, galleries,
  Media Box → `downloads`, cart UI stripped, PDF/MP4 rows in the media manifest (SKODA-503).
- Re-import, `media:build` + `media:apply`, DA dry-run, push + preview; publishing needs a separate go-ahead.

## Survey (2026-10-10)
- **Method:** the body class (`press_kit-template-*`) of the 83 English top-level press kits in the origin press-kit
  sitemaps.
  - The sitemaps hold 2,927 URLs in 5 languages; English has 701 including chapters.
  - There is no WordPress REST route for press kits.

| Origin template | Kits | On the demo |
|---|---|---|
| `default` | 49 | 10 (press-kit-default importer) |
| `template-press-release` (this ticket) | **22** | 1: RS 245, live and flattened |
| `template-layout-article` | 12 | 0; layout not yet analysed |

- **RS 245 live, measured:**
  - Cart and expander junk: 222 "Add/remove", 3 "Show more", 3 empty anchors.
  - Links and blocks: 216 `/direct-download/` links and 0 blocks (all default content).
  - Exposure: no demo page links it in content. It is indexed (`press_kit`, 2017-06-06, model `octavia`), so it can
    show in the Press Kits listing (e.g. filtered by Octavia).
- **PR #305 (SKODA-808, press-kit variant):** does not touch this template.
- **`template-press-release` kits (22):**
  - `/en/press-kits/4x4-winter-discovery-press-kit`
  - `/en/press-kits/dynamic-skoda-rapid-spaceback-compact-outside-huge-inside`
  - `/en/press-kits/high-tech-update-skoda-octavia-compact-tsi-modern-dynamic-chassis-control-dcc-press-kit`
  - `/en/press-kits/new-skoda-kodiaq-discovery-new-world`
  - `/en/press-kits/new-skoda-kodiaq-press-kit`
  - `/en/press-kits/skoda-auto-shanghai-2017-first-skoda-concept-car-electric-drive-outlook-companys-electromobility-strategy`
  - `/en/press-kits/skoda-citigo-small-nimble-charming-new-front-section-dark-framed-tail-lights`
  - `/en/press-kits/skoda-defends-wrc-2-title-again`
  - `/en/press-kits/skoda-geneva-motor-show-2016-press-kit`
  - `/en/press-kits/skoda-geneva-motor-show-spotlight-bestseller-plus-numerous-premieres`
  - `/en/press-kits/skoda-iaa-frankfurt-2017`
  - `/en/press-kits/skoda-iaa-press-kit-2`
  - `/en/press-kits/skoda-karoq-press-kit`
  - `/en/press-kits/skoda-looks-back-successful-motorsport-year-wrc-2-champion-14-national-titles`
  - `/en/press-kits/skoda-octavia-bestseller-comprehensive-upgrade`
  - `/en/press-kits/skoda-octavia-bestseller-in-new-top-shape-following-comprehensive-revisions`
  - `/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps`
  - `/en/press-kits/skoda-octavia-rs-skoda-octavia-combi-rs-press-kit`
  - `/en/press-kits/skoda-octavia-scout-press-kit`
  - `/en/press-kits/skoda-rapid-the-family-favourite`
  - `/en/press-kits/skoda-scala-press-kit`
  - `/en/press-kits/the-skoda-roadiaq-all-electric-student-car-no-9-has-a-true-explorers-spirit`
- **`template-layout-article` kits (12), a likely sibling ticket for M2:**
  - Fabia (design and technology update, Combi, R 5)
  - Superb (press kit, new-era world premiere)
  - 4x4
  - Geneva 2018 and 2019, Paris 2018
  - Karoq compact SUV
  - Kodiaq Paris 2016, Kodiaq RS
- **Raw data:** `.migration/836/survey-top.json`.

## Acceptance Criteria
- [x] Survey the `template-press-release` pages (2026-10-10: 22 English top-level kits, see "Survey").
- [ ] RS 245 (and, in M2, the other 21) imports as a standard press-kit article, with no cart UI junk and no empty
      anchors.
- [ ] Content matches origin (galleries, Media Box rows, PDFs / MP4s); `validate-blocks` passes.
- [ ] No change to the other 55 press-kit-default pages (byte-identical re-import).

## Dependencies
SKODA-805 family (press-kit detail), SKODA-503 (binary gate), SKODA-832 (the hubs that link it).
