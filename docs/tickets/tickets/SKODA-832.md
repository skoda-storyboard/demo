# SKODA-832, Re-import the Octavia-rail press-kit hubs with press-kit-hub (audit F1)

- **Epic:** E08, Editorial at Scale
- **Type:** import
- **Phase:** A · **Milestone:** M1 (link targets of the ★ Octavia model page's Press Kits rail)
- **Fixes:** [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §3.1 / §8 F1; follows up the interim noted in [SKODA-208](SKODA-208.md)
- **Branch:** `skoda-832-octavia-hubs-reimport`
- **Status (2026-10-06):** 🟡 Developer done (head 3a591aa, pushed). QA (rendered) not yet run. Nothing has been
  pushed to DA, previewed or published.

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

## Acceptance Criteria
- [x] All 9 hubs import through press-kit-hub with every tile (count, titles, links, images) in the cards/tiles block
- [x] No Twitter junk; sane description; no text or image lost vs the current DA docs
- [ ] Rendered QA (measured, 1440/992/768/375) vs origin, incl. the contacts Columns and the two size approximations
- [ ] `media:apply`, DA dry-run, push + preview. Publishing needs a separate go-ahead.

## Follow-ups
- The cards tiles block has no full-width or one-third tile size (block change), which is behind the 2 approximations.
- The Octavia press kit's ZIP link correction (editorial).
