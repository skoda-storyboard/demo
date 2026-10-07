# SKODA-830, Story importer validity fixes + Media Box → Downloads (audit F3 + F4)

- **Epic:** E08, Editorial at Scale
- **Type:** import / transformer (+ downloads block CSS/JS for the QA defects)
- **Phase:** A · **Milestone:** M1 (build freeze Thu 8 Oct 2026, demo 15 Oct)
- **GitHub issue:** [#259](https://github.com/skoda-storyboard/demo/issues/259)
- **Implements:** [SKODA-801a](SKODA-801a.md) (Media Box → `downloads` on stories), plus the story findings of
  [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §4 / §8 F3–F4
- **Branch:** `skoda-830-story-import-validity`
- **Status (2026-10-06):** 🟢 **QA PASS (run 3); 57 stories pushed to DA and previewed** from this branch's import
  (54 updated + 3 overwritten after review of their 28 Sep DA edits; 57/57 preview 200). **Published 2026-10-06** on user
  go-ahead, before #269 merged (57/57 live 200 + indexed): live shows the Media Box with main's old CSS/JS until #269 lands.
  gaming-consoles stays blocked (unverified MP4 `7_skoda-x-airconsole_hero_16-9_v08_056c7d9e.mp4`, needs DAM
  ingest); the `innovation-and-technology/…mixed-reality` alias is excluded (301). Until this branch merges,
  `main--…aem.page` renders the new content with main's old Media Box CSS/JS; the branch preview shows it correctly.

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
| D1 | Media Box heading / stats / band padding unstyled on stories | `.section.media-box h2`, `.downloads-stats`; rules exist only under `body.press-release` / `body.press-kit` | h 26px/32.5 (≥992), 20px/25 (≤768); stats 16px/600/32px `#c4c6c7`; padding 32/12; heading→grid 96–97 (89 ≤768) | h2 34px/42.5 all widths; stats 400/24px white; padding 40/40; heading→grid 111 | **blocking** (18 ★ stories) → **fixed** (dev result 2) |
| D2 | "Show more" collapse and pill | shared `blocks/downloads` | collapsed 708/636/669/803 px at 1440/992/768/375 (peek of row 3); pill 137.6×44 `#78faae` r32 w500; collapses 8 assets at 375 | 630/558/567/701 (exactly 2 rows); pill 132.6×44 white r50 w400; all 8 shown at 375 (2864px) | **blocking** for 801a sign-off → **fixed** (dev result 2); QA run 2: heights/pill pass, peek missing (row 3 `hidden`, 0px under the pill vs 58px) → **fixed** (dev result 3), ready for QA re-check |
| D3 | Epiq spec table unreadable on mobile | `.columns.columns-4-cols`, big-possibilities | 4-col table at 375; 819×503, 14px, 36px rows, bold header | one stacked 355px column at 375; 819×784, 16px, header 400 | nice-to-have (not M1) |
| D4 | 66/716 Media Box titles cut short with "…" (19 pages, 7 ★) | `parsers/downloads.js` reads `.entry-title` after the origin's dotdotdot | full title (it is in the img `alt`) | truncated text in figcaption + aria-label | nice-to-have (do it) |
| D5 | Lightbox-only `data-caption` text (WLTP consumption/CO₂ disclaimers) would be removed from DA by the re-import | carousel captions; e.g. practical-fun Epiq ×12, even-opening Peaq | — | dropped (also on the main baseline, since SKODA-819) | decision needed → **decided** → **fixed** (dev result 2) |

**D5 decision (user, 2026-10-06): "Keep it, visible".** Regulatory consumption/CO₂ text is kept as a visible
caption or note under the image. Other lightbox-only captions stay dropped. This also applies to the press-kit
image galleries (audit §5, F6).

Notes, not defects:
- 1,249 Media Box links point at `www.skoda-storyboard.com/direct-download/…`, the same as releases (skoda-links by
  design). This depends on the origin staying up at go-live.
- `media:apply` has so far run on only 5 pages.

## Developer result 2 (2026-10-06, after the QA FAIL)
Branch merged with `origin/main` (#251–#255, #258, #265; no conflicts); `import-story-detail.bundle.js` rebuilt from
the merged sources (the other 18 bundles rebuild unchanged). Evidence and tools:
`.migration/wt-830-story-scratch/run-823-d1d2/` (not in git).

- **Newsletter (SKODA-823 importer slice).** `skoda-story-aside.js` turns the sidebar `.newsletter-subscribe-widget`
  into `Newsletter Stub (card)` at the top of the aside, on the `preprocess` hook (the shared page cleanup removes
  the widget in beforeTransform). Heading (with its line break), image, placeholder, button, consent text,
  consent-error and the list/language ids come from the widget; `label`, `message` and `error` are the block draft's
  strings. The consent and "Manage subscription" links stay the live origin URLs (skoda-links leaves them absolute;
  their EDS pages 404). `.side-banner` is still dropped (SKODA-903). `block-contracts.json` registers
  `newsletter-stub` / `card` (config only). Re-import: **59/59** stories have the card first in the sidebar section;
  59/59 origins have the widget. Rendered vs origin (wireless charging, Epiq, Como): 345.3×354.8 / 260×307.9 /
  185.3×266.8 / 355×368.1 at 1440/992/768/375, all equal to the origin; top 32px in the aside (≥768), 16px to
  "Explore more". Field/pill at 768–1200 keep the documented SKODA-823 deviation.
- **D1.** One shared Media Box band in `styles/styles.css` (`main > .section.media-box`, `--media-box-*` tokens):
  top inset 64 (story) / 72 (release, kit), 60 under the box, title 26/32.5 600 (story + kit 20/25 up to 768),
  stats 16/32 600 `#c4c6c7` with a 4px inset in the 44px add-all row, 20px to the grid. The kit's own copies are
  gone; releases keep their 26px title at every width (as the source).
  Stories, origin → before → after: band top→title 64 → 40 → 64; title 26/32.5 (20/25 ≤768) → 34/42.5 → equal;
  stats 16/32/600 `#c4c6c7` → 16/24/400 white → equal; title→grid 96.5 (89 ≤768) → 111 → equal; box→band end 60 →
  40 → 60.
- **D2.** Rule read from the source (media-room.js togglebox): collapse when the items need more than two rows at the
  current column count; clip at `2 × (tile + 20) − 2 + 60`. The block now collapses at > 2 rows (was > 8 assets) and
  the pill is the source's mint `.btn` (emerald, no border, weight 500, 1px tracking, hover `#a8ffcc`). The source
  shows "Show less" once open (`.open .close {display:block}`, 127.4×44), so the button stays, as before; collapsing
  keeps it in view. The 801a "above 8 assets" line is this rule at 4 columns. Story/kit tile titles are 20/24 in a
  58px row up to 768 (the source's article h3), which the collapsed heights depend on.
  Como (13): origin 708.25/636.25/669.25/803.11 → before 708.25/636.25/645.25/779.13 → after 708.25/636.25/669.25/
  803.13. Epiq (8): origin 650.25 (no control)/578.25/669.25/803.11 → before 630.25/558.25/860.88/2864.5 (never
  collapsed) → after 630.25/558.25/669.25/803.13. An uncollapsed box keeps the source's last 20px row margin: last
  tile → band end 80 (origin 80, before 60). Pill: 137.58×44 `#78faae`, no border, weight 500 → before
  132.58×44 white, 2px border, 400 → after 137.58×44 `#78faae`, 0, 500 (radius `--pill-radius`, same capsule as 2em
  at 44px). 769px: 645.59 = origin.
- **D5.** `story-flatten.js` `isRegulatoryCaption()` (a WLTP mention, or a kWh/100 km or l/100 km figure together
  with a CO₂/CO2 emissions or g/km figure). A carousel image's lightbox-only regulatory `data-caption` becomes a
  visible caption (after the description, if any; not repeated). Other lightbox-only captions stay dropped (the Peaq
  aerodynamics and 936 km captions are not matched). Re-import: 7 captions on 2 stories, practical-fun Epiq 6 and
  even-opening Peaq 1, equal to the origin's carousel disclaimers. The other 6 practical-fun disclaimers are on the
  same images' Media Box tiles (title-only on the source too).
- **Releases (regression).** 4x4 (15) and Slavia (35), before → after at 1440/992/768/375: title→grid 112.5 → 96.5
  (origin 96.5); band 72/60, title 26/32.5, box heights 708.25/636.25/645.25/779.13 unchanged (= origin); pill as
  above. Small boxes now follow the row rule: the 936 km release (5) collapses at 375 to 779.13 (origin 779.11,
  before not collapsed) and ends 80px under its last tile at 1440–768 (origin 80, before 60). Kit 1100 OHC: title→grid 104.5/97 → 96.5/89 (= origin); tiles ≤768 now 285.63 / 352.56 (= origin).
- Re-import diff vs the d4f82c7 run: blocks and hrefs equal on all 59 pages apart from the card; text differs only on
  the 2 D5 pages; image changes are the #253 hero renditions. `validate-blocks`: 59 checked, 0 errors.
- Tests: newsletter (3), D5 (2), contract (1), downloads disclosure (2 new, 1 updated), press-kit Images-chapter test
  now counts visible controls. `npm test`: 1013/1019 pass; failures are `header-locales`, `media-cart-download`
  (fflate) and `media-lib` "rejects truncated bodies" (ENOTEMPTY on the NFS worktree; it fails the same on the merge
  commit before these changes). `npm run lint` clean.
- Open (2px): opened, the source pill sits 36px under the grid (34 when closed); ours stays at 34.
- Not fixed, found while measuring: below 768 the aside starts 85px under the last body line (origin 77px), a
  SKODA-801 spacing; it predates the card.

## Developer result 3 (2026-10-06, after QA run 2)
QA run 2 evidence: `.migration/qa-830/run2/`. Measured with Chrome DevTools (isolated context) on `aem up
--html-folder` (Como, metadata as `<meta>`) and the `main` proxy (4x4 release, Epiq kit Images); origin
`www.skoda-storyboard.com`.

- **D2 peek.** `downloads.js` no longer sets `hidden` on rows 3+. A collapsed block gets `downloads-collapsed`: the
  list is clipped (`overflow: hidden`, `max-height: calc(var(--dl-rows-height) + --dl-toggle-gap +
  --dl-toggle-height)`) and the pill overlaps the clip's bottom edge (`margin-block-start: -44px`, z-index 2), like
  the source `.search-results-items-wrap`. `--dl-rows-height` is measured from the tiles (tallest bottom of the first
  two rows); a `ResizeObserver` on the tiles re-measures between breakpoints and once the section is shown. Rows 3+
  are `inert` (not focusable, out of the a11y tree) until expanded; expanding drops the clip and `inert`.
  Show more / less, `aria-expanded` / `aria-controls` and the matchMedia column rule are unchanged.

  | Page @ width | Collapsed box: origin / before / after | Row 3 visible: origin / before / after |
  |---|---|---|
  | Como 1440 | 708.25 / 708.25 / 708.25 | 58 / 0 / 58 |
  | Como 992 | 636.25 / 636.25 / 636.25 | 58 / 0 / 58 |
  | Como 768 | 669.25 / 669.25 / 669.25 | 58 / 0 / 58 |
  | Como 375 | 803.11 / 803.12 / 803.13 | 57.98 / 0 / 58 |
  | 4x4 release 1440 | 708.25 / 708.25 / 708.25 | 58 / 0 / 58 |
  | 4x4 release 992 | 636.25 / 636.25 / 636.25 | 58 / 0 / 58 |
  | 4x4 release 768 | 645.25 / 645.25 / 645.25 | 58 / 0 / 58 |
  | 4x4 release 375 | 779.11 / 779.13 / 779.13 | 57.98 / 0 / 58 |

  Pill 137.58×44 `rgb(120,250,174)` w500 everywhere, hit-tests on top of the peeking tiles; band end 60px under
  it (grid top → band end 768.25 at 1440, Como). Como at 1200: 694.75 with 58 visible (re-measured on resize, no
  reload); 769: 645.59 (= origin). Expanded: no clip, 0 inert, pill 34px under the grid.
- **Press-kit Images (`collapse auto`).** Epiq kit Images at 1440: the 6 groups with more than two rows collapse
  (clipped, inert rows 3+), the 3-tile group keeps a hidden toggle, single-tile groups have none. Peek there is 62px
  (default variant gap 16px; origin 58px with 20px gap). Pre-existing, not part of this fix: the kit gallery tiles
  are taller than the origin's (EDS 2 rows 399.25px with titles vs origin 105.75px image-only tiles).
- **Newsletter card button.** `.newsletter-stub.card .newsletter-stub-submit` weight 500 (origin "Subscribe now!"
  500; before 400). Footer variant unchanged (400).
- **Guardrail §6.** The story/kit Media Box tile-title rule moved from `styles/styles.css` to
  `blocks/downloads/downloads.css`, mobile-first (compact 20px / 58px row by default, the block's 15px / 46px from
  769px via `--dl-title-*-base`). Tile title 20px at 375/768, 15px at 769/992/1440 (unchanged).
- Tests: new clip/inert test (measured `--dl-rows-height`, inert rows, expand/collapse, column change); the
  disclosure tests and the press-kit Images-chapter test count `inert` tiles instead of `hidden`. `npm run lint`
  clean. `npm test`: 1013/1020 pass; failures are the known `header-locales`, `media-cart-download` (fflate) and
  `media-lib` ENOTEMPTY (NFS worktree; a second media-lib test hit the same ENOTEMPTY once and passes on rerun).
- Open (not measured): a row-2 tile's size menu opens downward inside the clipped list, so a long menu can be cut
  off while collapsed (the source's wrap clips with `overflow: hidden` too).

## QA result 3 (2026-10-06, head fec4c0a): PASS
Evidence: `.migration/qa-830/run2/` (full run at cfa90ef) and `.migration/qa-830/run3/` (D2 re-check), both outside git.
- **D1:** pass. On stories, releases and kits: band top→title 64, title 26/32.5 (20/25 ≤768), stats 16/32/600
  `#c4c6c7`, title→grid 96.5/89, all equal to origin. Main was 112.5 on releases.
- **D2:** pass.
  - Collapsed box: Lake Como 708.25 / 636.25 / 669.25 / 803.13; 4x4 release 708.25 / 636.25 / 645.25 / 779.13.
  - Row 3 peeks by 58px at all 4 widths, equal to origin.
  - Pill 137.58×44 `#78faae` w500; Show less 127.42×44.
  - Clipped tiles are `inert` (Tab skips them, unlike origin). Re-measures on resize.
- **Newsletter card (SKODA-823 importer slice):** pass. 59/59 cards first in the sidebar.
  345.33×354.83 / 260×307.89 / 185.33×266.83 / 355×368.14 at 1440/992/768/375; button w500.
- **D5:** pass. 7/7 regulatory lightbox captions kept visible; 6/6 non-regulatory ones dropped (scan of all 59 origins).
- **Regression:** press releases and kits equal origin and are closer to it than main; nothing is worse than main.
- **Push readiness (predicted):** 54 update, 3 conflicts, 1 blocked-binary (gaming-consoles: unverified MP4); the
  `innovation-and-technology/…mixed-reality` alias is excluded (301).
  - epiq-will-win and the-versatile-octavia: DA edits at 28 Sep 05:45 look like a scripted SKODA-819/801 re-push
    (Gallery → slider, page-title captions removed), and the new import contains them.
  - elroq-through-designers-eyes: DA edit at 09:22 with no rendered difference.

### PR #269 review (2026-10-06, issuecomment-6024206752): fixed
- **Media Box band background:** it was painted 100vw (only Related Stories was capped). The cap now sits on the
  shared story `.section.dark::before` (`--story-dark-band-max-width: var(--cover-box-max-width)`).
  On cruise-control at 1920 / 2560 / 3440: x 240 / 560 / 1000, width 1440, equal to origin (was full-viewport at x=0).
- **Gap between bands:** a single 36px separator between the Media Box and Related Stories
  (`.section.media-box + .section.dark.story-rail-container`, `--story-dark-band-gap: 2.25em`). The 24px gap from
  Related Stories to the footer is unchanged. Measured 36 / 24 at 375 / 768 / 992 / 1080 / 1440 / 1920 / 2560 / 3440.
- **Found while checking, pre-existing on main, not this PR:** the press-release Media Box band is 1248px wide
  (x=656 at 2560) vs origin 1440px (x=560), with a 0px gap to the footer vs origin 16px.

### PR #269 review (2026-10-07, saran-adobe, downloads.css:234): fixed
- **Problem:** the collapsed Media Box `overflow: hidden` clipped the 2px + 2px focus ring of the edge tiles
  (WCAG 2.4.7, css-guidelines §8).
- **Fix:** the collapsed list gets `--dl-focus-room: 4px` padding on its top and sides, cancelled by an equal
  negative margin, plus `box-sizing: border-box`. There is no bottom room, so the clip edge stays at the pill
  bottom and the peek is unchanged.
- **Measured** with branch code on Lake Como and the 4x4 release at 1440/992/768/375:
  - 0 of 138 focusable tile controls have a clipped ring.
  - A real Tab onto tile 1 gives `:focus-visible`, with the ring exactly at the clip edge (0px cut; it was 4px).
  - Collapsed box: Lake Como 708.25/636.25/669.25/803.13, 4x4 708.25/636.25/645.25/779.13.
  - Peek: 58 at all widths; grid x unchanged. All equal to the values before the fix and to origin.

### PR #269 review (2026-10-07, vijayr-adobe, downloads.js:565): fixed
- **Problem:** Safari 15.4 has ResizeObserver but no native `inert`, so the clipped rows-3+ controls stayed in the
  tab order and the AT tree.
- **Fix:** where `'inert' in HTMLElement.prototype` is false, a clipped tile gets `aria-hidden="true"` and its
  controls `tabindex="-1"` (an author tabindex is kept in `data-dl-tabindex` and restored on expand). Native
  engines are unchanged.
- **Pointer:** clipped tiles get `pointer-events: none` via `[inert]`, which also matches without native support.
- **Tests:** 2 new tests, one per path (fallback + author-tabindex round trip; native).
- **Chrome check:**
  - Native: 5 inert tiles, no extra attributes, 708.25 collapsed.
  - Forced fallback (prototype removed before load): 5/5 `aria-hidden`, 25/25 clipped controls at -1, rows 1–2
    untouched. Expand restores everything with nothing left over, and collapse re-applies.
- **Noted for later:** `gallery` and `float-dock` also rely on native `inert`. The repo has no documented browser
  baseline.

### Follow-ups (non-blocking)
- D2-F1: without a ResizeObserver measurement, the tiles stay `inert` and the pill overlaps (outside the supported
  browsers). Apply collapsed + inert only once measured.
- Guardrail §7: D2 measures layout in JS and uses a -44px overlap. A CSS-only alternative (JS marks row-3 tiles, CSS
  caps them at 58px) is possible; accepted for M1.
- Minor, not part of this ticket:
  - The caption-less slider bottom gap is 40px vs 16px (SKODA-819).
  - The "Five questions" Columns box inset, h2 and image size are already listed in SKODA-824 / `columns-split.md` §5.
  - The open "Show less" sits 34px under the grid vs 36px on origin.

## Acceptance Criteria
- [x] All 57 stories with an origin Media Box get a Downloads section whose rows, order and hrefs match the origin
- [x] Lightbox chrome, quiz JSON/UI, `+N` pill and "Show more Show less" text gone; captions = visible origin captions
- [x] Epiq table keeps its header row; no `version` block (`validate-blocks` 0 errors)
- [x] D1: Media Box heading / stats / padding match the origin at 1440/992/768/375 on stories; releases/kits unchanged or closer to the origin (dev; QA re-run pending)
- [x] D2: collapse height, peek, threshold and pill match the measured origin (reconcile with the 801a "708px / 139×44" line) (dev; QA re-run pending)
- [ ] D4: full Media Box titles (alt-prefix recovery)
- [x] D5: WLTP/CO₂ disclaimer text visible under its image (dev; QA re-run pending)
- [x] SKODA-823 importer slice: `Newsletter Stub (card)` first in every story aside (59/59) (dev; QA re-run pending)
- [ ] D3 (optional): spec table readable at 375
- [x] QA re-run PASS; then `media:build` + `media:apply`, DA dry-run (resolve the 3 story DA conflicts:
      epiq-will-win, elroq-through-designers-eyes, the-versatile-octavia), push + preview. Publishing needs a separate go-ahead.

## Dependencies / collisions
- PR #253 (hero parity) edits `import-story-detail.js` + bundle. Whichever merges second rebuilds the bundle.
- `skoda-831-category-archive-membership` is stacked on this branch. The stories are re-imported once, from both.
- `skoda-833-press-release-import-validity` also edits `parsers/downloads.js` (MP4 URL-encoding); D4 must merge with it.
