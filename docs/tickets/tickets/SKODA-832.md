# SKODA-832, Re-import the Octavia-rail press-kit hubs with press-kit-hub (audit F1)

- **Epic:** E08, Editorial at Scale
- **Type:** import
- **Phase:** A · **Milestone:** M1 (link targets of the ★ Octavia model page's Press Kits rail)
- **GitHub issue:** [#261](https://github.com/skoda-storyboard/demo/issues/261)
- **Fixes:** [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §3.1 / §8 F1; follows up the interim noted in [SKODA-208](SKODA-208.md)
- **Branch:** `skoda-832-octavia-hubs-reimport`
- **Status (2026-10-07):** 🟡 **9 hubs pushed to DA and previewed** (9 × update, 0 conflicts, 9/9 preview 200), not
  published. QA (2026-10-07): content PASS; rendered FAIL on D2 (lone download banner, code-only fix pending).
  RS 245 is excluded (D1: no importer for its template).

## Problem
The 10 Octavia-rail press kits were imported through `page-base` as an interim. 9 of them are hubs, so the chapter
tile grid was flattened to text, Twitter widget iframes were left as junk links, and the meta description was the
Twitter text. The 10th (Octavia RS 245) is a press-kit article.

## Change
- New `tools/importer/urls-press-kit-hub-octavia.txt` (9 hubs) and `urls-press-kit-default-octavia.txt` (RS 245,
  imported later, after PR #251, with F6). `urls-page-base-octavia-press-kits.txt` is retired; SKODA-208 and
  `docs/planning/skoda-rail-feed-corpus.txt` now point at the new lists.
- `parsers/press-kit-hub-tiles.js` + `import-press-kit-hub.js` (+ test, bundle rebuilt). 5 of 9 hubs failed with
  "unsupported layout", and 7 of 9 use the default template.
  - Tiles inside a nested page-builder layout counted once.
  - A lone 2:1 / 4:1 tile becomes a half tile that ends its row.
  - Square rows other than 5 become quarters.
  - Contacts text after the tiles stays below, as Columns in its own section.
  - The rendered X timeline (iframe/script) is recognised and dropped.
  - Description falls back to the hero intro when the origin's is "Tweets by skodaautonews".
  - Banner alt text added.
- The 8 hubs already on press-kit-hub re-import byte-identical.

## Developer result
| Hub | Template | Tiles origin/new | Banners | Twitter junk | Remaining |
|---|---|---|---|---|---|
| lets-explore-albania | tiles | 10/10 | 2 ok | n/a | – |
| skoda-rs-driving-experience | tiles | 11/11 | 2 ok | n/a | – |
| skoda-octavia-media-launch | default | 14/14 | 2 ok | n/a | – |
| 4x4-winter-experience | default | 12/12 | 1 ok | removed | three 1/3 squares shown as quarters |
| skoda-rs-experience | default | 12/12 | 1 ok | removed | – |
| skoda-octavia-rs-and-octavia-scout | default | 14/14 | 1 ok | removed | full-width 4:1 intro tile shown half-width (2:1); no description |
| skoda-octavia-press-kit-2 | default | 15/15 | 1 ok | removed | contacts as Columns, no hub styling yet |
| skoda-octavia-press-kit | default | 14/14 | 1 ok | removed | ZIP link has no extension, 403 (`…/SKODA-OCTAVIA.zip` is 200; editorial call) |
| press-kit-skoda-at-the-iaa-2019 | default | 17/17 | 1 ok | removed | ZIP stays `/direct-download/` as on Kodiaq |

- Tests: importer tests 448 pass, 0 fail, 3 skipped. The hub test file passes 15/15, incl. live
  (`SKODA_PRESS_KIT_LIVE=1`). `npm run lint` clean.
- Chapter pages are not migrated, so tile links correctly stay absolute to the origin (link policy).
- The scratch import ran without the media step: run `media:apply` before any push.

## QA result (2026-10-07, head ab03c9a)
Evidence: `.migration/qa-832/` (outside git).
- **Code / tests / bundles:** pass. All 19 bundles rebuild byte-identical. The press-kit-default bundle embeds
  `press-kit-hub-tiles.js` and was rebuilt in the main merge.
- **Regression:** 55/55 press-kit-default pages and 8/8 existing hubs are byte-identical between main's and the
  branch's bundles.
- **Content (9 hubs):** pass. Tiles, banners and contacts match origin, with no Twitter junk. Nothing is lost vs the
  old DA docs. `media:apply` made 39 rewrites; `validate-binaries` reports 0 errors; `validate-blocks` 9/9.
- **D1 (high): RS 245 has no importer.**
  - The origin body class is `press_kit-template-template-press-release`, which the press-kit-default layout guard
    rejects ("Not a default press-kit article").
  - The press-release bundle keeps 110 "Add/remove" links.
  - Needs a template-variant follow-up; excluded from the push. DA still holds the flattened page-base doc.
- **D2 (high, visual): a lone download banner spans the content width.**
  - `.section.press-kit-banners` grid `repeat(auto-fit, minmax(min(100%, 25rem), 1fr))`.
  - Scout, 4x4, RS Experience: 1228×1228 at 1440 (origin 292×292); 972×972 at 992 (origin 228).
  - Octavia -2, IAA: 1228×1228 (origin 307×307).
  - Octavia 4:1 banner: 1228×307 (origin 634×159).
  - Fix in CSS (size a lone banner like its origin tile: square → quarter, 4:1 → half); no re-push needed.
- **D3 (medium): approximation not yet recorded.**
  - Origin shows the last 5 resource tiles 2-up (292/307) beside the X timeline; EDS shows them 5-across at
    230×230 (178 at 992).
  - The Octavia kit's 6 tiles become 4+2 at 292 (origin 307).
- **D4 (known approximations, measured):**
  - Scout 4:1 intro tile at 1440 is 604×292 (origin 1228×292).
  - The 4x4 1/3 squares are 292 (origin 396).
- **D5 (low):**
  - IAA ZIP stays `/direct-download/` (CDN `.zip` returns 200).
  - The Octavia ZIP with no extension returns 403 (editorial).
- **D6 (low):** `bannerAlt` treats any "download" image name as the ZIP banner.
- **D7 (observation):** contact cells are 602×116 vs 604×96; banners start 40px below the tiles vs 20px on origin.

## Acceptance Criteria
- [x] All 9 hubs import through press-kit-hub with every tile (count, titles, links, images) in the cards/tiles block
- [x] No Twitter junk; sane description; no text or image lost vs the current DA docs
- [ ] Rendered QA (measured, 1440/992/768/375) vs origin, incl. the contacts Columns and the two size approximations
- [x] `media:apply`, DA dry-run, push + preview (2026-10-07: 9 hubs; RS 245 excluded, D1)
- [ ] D2 banner sizing fixed + rendered re-check; then publish (separate go-ahead)

## Follow-ups
- The cards tiles block has no full-width or one-third tile size (block change), which is behind the 2 approximations.
- The Octavia press kit's ZIP link correction (editorial).
