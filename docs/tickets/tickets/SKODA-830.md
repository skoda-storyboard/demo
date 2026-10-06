# SKODA-830, Story importer validity fixes + Media Box → Downloads (audit F3 + F4)

- **Epic:** E08, Editorial at Scale
- **Type:** import / transformer (+ downloads block CSS/JS for the QA defects)
- **Phase:** A · **Milestone:** M1 (build freeze Thu 8 Oct 2026, demo 15 Oct)
- **GitHub issue:** [#259](https://github.com/skoda-storyboard/demo/issues/259)
- **Implements:** [SKODA-801a](SKODA-801a.md) (Media Box → `downloads` on stories), plus the story findings of
  [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §4 / §8 F3–F4
- **Branch:** `skoda-830-story-import-validity`
- **Status (2026-10-06):** 🔴 **QA FAIL.** Content passes; the Media Box rendering on stories fails (D1, D2). The fix is
  in progress. Nothing has been pushed to DA, previewed or published.

## Scope (approved 2026-10-05)
1. Media Box (`.search-results.media-box`) becomes its own `dark, full-width, media-box` section: heading, stats line,
   `Downloads` table (same row shape as press releases). If the box has no asset, the section is dropped and logged.
2. Gallery lightbox chrome ("Gallery overview", "Share gallery", share links, colorbox overlay) stripped.
3. Gallery captions: the visible origin caption only, with no alt / file-name / page-title fallback.
4. Inline body images kept. The DA losses came from 35 outdated `partial` manifest rows that `media:build` resolves.
5. Body data tables become `Columns`, keeping the header row (Epiq spec table; no more `version` block).
6. Quiz: hidden `.jsonStruct` JSON and widget UI text dropped; questions, images and options kept.
7. `+N` tag show-more toggle skipped; the tags it reveals are kept.
8. Series-nav teaser grid becomes `Cards (overlay)`, with full titles recovered from the image alt.

Out of scope: in-body `.sb-gallery` restore (SKODA-604), slider variant (SKODA-819), "Explore more" origin links
(SKODA-609), and MP4 links in in-body video toolbars (need DAM ingest).

## Developer result (head d4f82c7)
- 59/59 stories re-import. 92 of 117 audit findings are resolved, and 7 stale-DA findings are cleared by the re-import.
  The remaining 25 are outside scope (14 Explore-more links, 6 sb-gallery, 3 in-body MP4, 1 `.JPG` master URL in the
  media lib, PR #253's area; 1 quiz grading).
- 57/57 origin Media Boxes migrated, 716 assets; all 21 M1 stories have a Downloads block. Max 38 distinct images
  per page (limit 200).
- `validate-blocks`: 0 errors on 59 pages (baseline 1: the Epiq `version` block).
- Tests: 11 new fixture tests (`tools/importer/story-import-validity.test.mjs`); `npm run lint` clean. In `npm test`
  only the 2 pre-existing failures remain (`header-locales`, `media-cart-download`/fflate).
- `media:apply` passes on 58/59; gaming-consoles is blocked by an already-unverified MP4.
- Media step: 122 new image rows and 35 corrected ones come from `media:build` and are **not committed**. Run
  `media:build` + `media:apply` for these pages during the real import.

## QA result (2026-10-06): FAIL
Evidence: `.migration/qa-830/` (not in git).
- **Code review:** pass. The bundle rebuilt from sources is byte-identical; the standalone rule holds; edge cases are
  covered (no Media Box, 0 assets).
- **Content, items 1–8:** pass. Checked independently on all 59 pages: 57/57 boxes, 716/716 rows with stats, order
  and hrefs matching the origin; captions equal the visible origin descriptions; 0 missing inline images.
- **Grid geometry:** matches the origin. Columns 4/4/3/1 at 1440/992/768/375, gap 20, 16:9 thumbs, background
  `rgb(14,58,47)`.

### Defects
| # | What | Where | Origin (expected) | EDS (actual) | Severity |
|---|---|---|---|---|---|
| D1 | Media Box heading / stats / band padding unstyled on stories | `.section.media-box h2`, `.downloads-stats`; rules exist only under `body.press-release` / `body.press-kit` | h 26px/32.5 (≥992), 20px/25 (≤768); stats 16px/600/32px `#c4c6c7`; padding 32/12; heading→grid 96–97 (89 ≤768) | h2 34px/42.5 all widths; stats 400/24px white; padding 40/40; heading→grid 111 | **blocking** (18 ★ stories) |
| D2 | "Show more" collapse and pill | shared `blocks/downloads` | collapsed 708/636/669/803 px at 1440/992/768/375 (peek of row 3); pill 137.6×44 `#78faae` r32 w500; collapses 8 assets at 375 | 630/558/567/701 (exactly 2 rows); pill 132.6×44 white r50 w400; all 8 shown at 375 (2864px) | **blocking** for 801a sign-off |
| D3 | Epiq spec table unreadable on mobile | `.columns.columns-4-cols`, big-possibilities | 4-col table at 375; 819×503, 14px, 36px rows, bold header | one stacked 355px column at 375; 819×784, 16px, header 400 | nice-to-have (not M1) |
| D4 | 66/716 Media Box titles cut short with "…" (19 pages, 7 ★) | `parsers/downloads.js` reads `.entry-title` after the origin's dotdotdot | full title (it is in the img `alt`) | truncated text in figcaption + aria-label | nice-to-have (do it) |
| D5 | Lightbox-only `data-caption` text (WLTP consumption/CO₂ disclaimers) would be removed from DA by the re-import | carousel captions; e.g. practical-fun Epiq ×12, even-opening Peaq | — | dropped (also on the main baseline, since SKODA-819) | decision needed → **decided** |

**D5 decision (user, 2026-10-06): "Keep it, visible".** Regulatory consumption/CO₂ text is kept as a visible
caption or note under the image. Other lightbox-only captions stay dropped. This also applies to the press-kit
image galleries (audit §5, F6).

Notes, not defects:
- 1,249 Media Box links point at `www.skoda-storyboard.com/direct-download/…`, the same as releases (skoda-links by
  design). This depends on the origin staying up at go-live.
- `media:apply` has so far run on only 5 pages.

## Acceptance Criteria
- [x] All 57 stories with an origin Media Box get a Downloads section whose rows, order and hrefs match the origin
- [x] Lightbox chrome, quiz JSON/UI, `+N` pill and "Show more Show less" text gone; captions = visible origin captions
- [x] Epiq table keeps its header row; no `version` block (`validate-blocks` 0 errors)
- [ ] D1: Media Box heading / stats / padding match the origin at 1440/992/768/375 on stories; releases/kits unchanged or closer to the origin
- [ ] D2: collapse height, peek, threshold and pill match the measured origin (reconcile with the 801a "708px / 139×44" line)
- [ ] D4: full Media Box titles (alt-prefix recovery)
- [ ] D5: WLTP/CO₂ disclaimer text visible under its image
- [ ] D3 (optional): spec table readable at 375
- [ ] QA re-run PASS; then `media:build` + `media:apply`, DA dry-run (resolve the 3 story DA conflicts:
      epiq-will-win, elroq-through-designers-eyes, the-versatile-octavia), push + preview. Publishing needs a separate go-ahead.

## Dependencies / collisions
- PR #253 (hero parity) edits `import-story-detail.js` + bundle. Whichever merges second rebuilds the bundle.
- `skoda-831-category-archive-membership` is stacked on this branch. The stories are re-imported once, from both.
- `skoda-833-press-release-import-validity` also edits `parsers/downloads.js` (MP4 URL-encoding); D4 must merge with it.
