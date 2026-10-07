# SKODA-836, Press-kit article importer for the `template-press-release` variant (Octavia RS 245)

- **Epic:** E08, Editorial at Scale
- **Type:** import / transformer
- **GitHub issue:** [#280](https://github.com/skoda-storyboard/demo/issues/280)
- **Phase:** A · **Milestone:** M2 candidate (user decision 2026-10-07: "new ticket, later")
- **Origin:** SKODA-832 QA (2026-10-07, defect D1); audit [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §3.1
- **Status (2026-10-07):** 🔵 TODO

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

## Acceptance Criteria
- [ ] RS 245 imports as a standard press-kit article, with no cart UI junk and no empty anchors.
- [ ] Content matches origin (galleries, Media Box rows, PDFs / MP4s); `validate-blocks` passes.
- [ ] No change to the other 55 press-kit-default pages (byte-identical re-import).

## Dependencies
SKODA-805 family (press-kit detail), SKODA-503 (binary gate), SKODA-832 (the hubs that link it).
