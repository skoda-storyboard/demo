# SKODA-832, Re-import the Octavia-rail press-kit hubs with press-kit-hub (audit F1)

- **Epic:** E08, Editorial at Scale
- **Type:** import
- **Phase:** A · **Milestone:** M1 (link targets of the ★ Octavia model page's Press Kits rail)
- **GitHub issue:** [#261](https://github.com/skoda-storyboard/demo/issues/261)
- **Fixes:** [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §3.1 / §8 F1; follows up the interim noted in [SKODA-208](SKODA-208.md)
- **Branch:** `skoda-832-octavia-hubs-reimport`
- **Status (2026-10-07):** 🟢 **9 hubs published** (PR #281 merged; 9/9 live 200 + indexed, after a publish dry-run
  showed DA = the QA'd content). Open follow-ups: lone banner sizing → SKODA-835 (#279); RS 245 → SKODA-836 (#280),
  still on its flattened page-base doc.

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

## ZIP link fix (2026-10-08, user decision; branch `skoda-832-zip-links`)
- **Importer:** `import-press-kit-hub.js` `bannerHref()`:
  - `www…/direct-download/<path>.zip` (301 to an expiring signed S3 URL) becomes `cdn.skoda-storyboard.com/<path>.zip`.
  - Plus one explicit, user-approved correction: Octavia's extensionless `…/2020/04/SKODA-OCTAVIA` (403) becomes
    `….zip`.
  - Hub banners only. All targets were checked as 200 `application/zip`.
- **Pages:** 4 hubs re-imported; each differs from DA only in the ZIP href. Pushed and previewed (4 × update,
  0 conflicts), then **published 2026-10-08** (4/4 live 200); every live ZIP link returns 200.

| Hub | Before | After |
|---|---|---|
| press-kit-skoda-at-the-iaa-2019 (M1) | direct-download …IAA_FRANKFURT_2019.zip (301) | cdn …/2019/11/IAA_FRANKFURT_2019.zip (200, 1.59 GB) |
| skoda-octavia-press-kit (M1) | cdn …/2020/04/SKODA-OCTAVIA (403) | cdn …/2020/04/SKODA-OCTAVIA.zip (200, 1.60 GB) |
| the-all-new-skoda-kodiaq-press-kit | direct-download …868a3959.zip (301) | cdn … (200) |
| the-all-new-skoda-superb-press-kit | direct-download …454bb916.zip (301) | cdn … (200) |

## Accepted differences (user, 2026-10-08)
- D3: resource tiles 5-across (origin 2-up beside the X timeline); the Octavia kit's 6 tiles as 4+2 at 292.
- D4: the Scout 4:1 intro tile at half width; the 4x4 1/3 squares as quarters.
- D7: contact cells 602×116 vs 604×96.
- Banner placement and size details are in SKODA-835.

## Acceptance Criteria
- [x] All 9 hubs import through press-kit-hub with every tile (count, titles, links, images) in the cards/tiles block
- [x] No Twitter junk; sane description; no text or image lost vs the current DA docs
- [x] Rendered QA (measured, 1440/992/768/375) vs origin, incl. the contacts Columns and the two size approximations; the remaining differences are accepted by the user (2026-10-08)
- [x] `media:apply`, DA dry-run, push + preview (2026-10-07: 9 hubs; RS 245 excluded, D1)
- [x] Published 2026-10-07 (9/9 live, indexed). Follow-ups: D2 banner sizing → [SKODA-835](SKODA-835.md) (#279); D1 RS 245 → [SKODA-836](SKODA-836.md) (#280)

## Follow-ups
- The cards tiles block has no full-width or one-third tile size (block change), which is behind the 2 approximations.
- The Octavia press kit's ZIP link correction (editorial).

## QA #275 (2026-10-09, branch `bug-275-press-kits-qa`)
Press kits QA observations, HUB (Peaq hub). Measured origin vs branch at 1440 / 1080 / 992 / 768 / 390.
- **Fixed:**
  - Hero → tiles is 34px, as the source (it was the 40px section margin); 50px at exactly 768, where the source's hero image already takes its 16px stacked margin. This also covers the mobile "white space below the hero".
  - Banners: one equal cell each from 781px, 20px apart (2 → 604, 3 → 396, 4 → 292 at 1440), a lone banner half the row, stacked 40px apart below 781. The footer follows 30px after the last banner (it was 60). Checked on Peaq, Enyaq (3), Vision O (4) and Superb (1).
  - Tile titles: no 56% backdrop on press-kit tiles, as the source (PO decision). The series tiles keep theirs (`series.md` §6).
  - Media Room footer: Contacts / Subscribe / Company are `h3` (`footer-sections.js`); the "consent to the processing" link has no hover underline (`newsletter-stub.css`).
- **Already as the source:** hero perex 20px, "Manage subscription" `#419468`.
- **Held:** the Images tile still goes to the unpublished Images chapter (404 on `.aem.live`), PO decision 2026-10-09.
- **Notes (not changed here):**
  - The Superb and RS Experience hubs' tile areas are shorter than the source (Superb banner at y1640 vs 1984 at 1440).
  - The RS Experience lone square banner sits in column 1, the source in column 2 (x418).
  - Lighthouse (hub, branch = main): accessibility 92 (footer contrast / colour-only consent link, as the source; redundant tile alts), SEO 69 (`noindex` on aem hosts only).
