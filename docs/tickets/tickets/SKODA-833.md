# SKODA-833, Press-release importer validity fixes (audit F5)

- **Epic:** E08, Editorial at Scale
- **Type:** import / parser
- **Phase:** A · **Milestone:** M1
- **GitHub issue:** [#262](https://github.com/skoda-storyboard/demo/issues/262)
- **Fixes:** [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §3.3 / §5 / §8 F5; relates to [SKODA-607](SKODA-607.md), SKODA-502, SKODA-204, SKODA-818
- **Branch:** `skoda-833-press-release-import-validity`
- **Status (2026-10-06):** 🟢 **QA PASS; pushed to DA and previewed** (28/28 preview 200, push report
  `2026-10-06T12-23-54-957Z`: 23 updated, 5 unchanged, 0 conflicts). **Published 2026-10-06** on user go-ahead
  (report `2026-10-06T12-37-27-228Z`: 28/28 live=200, indexed). PR #265. Assets ingest + Assets-only QA complete (258 originals).

## Change
- `parsers/downloads.js` (shared, backwards-compatible): MP4 links are URL-encoded before the table is written.
  Root cause of the 4x4 breakage: a raw "×" in a filename widened one row after helix-importer rewrote `.mp4` links,
  which produced an unparseable table (ASCII grid text, a classless block, and the Elroq row lost as that block's name).
- `parsers/tags.js` (shared): skips the `+N` toggle (`.show-hidden-terms`, `href="#"`) and keeps the revealed tags.
- `transformers/skoda-press-release-layout.js`:
  - `lite-youtube` → bare `youtube.com/watch` URL, as on stories (SKODA-818), with the consent shell removed.
  - Bullet soft-wrap joins only continuation lines that start lower-case.
- `press-release.test.mjs` + a trimmed 4x4 fixture, incl. the Solberg bullet regression.
- `tools/importer/media/media-manifest.json`: 11 added rows only (kind video, `partial`, publish pending) + 1 Vimeo
  thumbnail row; no existing rows changed.
- `import-press-release.bundle.js` rebuilt. It must be rebuilt again on integration with SKODA-831 (`skoda-metadata.js`).

## Developer result
1. 4x4 Media Box: resolved. One Downloads block with 15/15 items incl. "Video | Škoda Elroq".
2. Buzzsprout embed: resolved on 4/4 releases. Main already emits it; the DA copies were stale. The embed block
   renders Buzzsprout.
3. MP4 rows: emitted (Slavia, Red Dot, 4x4 Elroq). Manifest rows added; not verified.
4. Solberg YouTube: resolved (one watch URL, no "Play" junk).
5. `+N` toggle: resolved (Elroq/Enyaq model-year, Elroq premiere).
6. Bullets (M13, Karoq, Laura) and pull-quotes (board-of-management, UCI MTB): resolved.
7. Stale releases (Red Dot, UCI MTB): re-imported with the current layout, Story Rail and no empty link.

23 of 28 findings resolved (14 only needed a re-import). Remaining: tag links to the origin where no `/en/tag/…` page
exists (containment policy, all 28 releases), and the Elroq premiere PDF title "…".

- Regressions vs baseline: none. `validate-blocks` 28 pages, 0 errors, 1 hold (Zellmer, SKODA-824).
- Tests: lint clean; `npm test` 943 pass, 3 skipped, only the 2 pre-existing failures.

## DAM ingest completed (2026-10-06)

The approved scope was both `urls-press-release.txt` and `urls-press-release-octavia.txt`
(28 releases), not the entire site manifest. All 261 scoped manifest rows now point to
258 verified published originals; three CDN/direct-download video aliases reuse one
uploaded asset each instead of creating duplicate originals.

`tools/importer/media/media-manifest.json` records each actual `dam_asset_path`,
`dam_original_url`, `public_url`, `public_verified` MIME/byte count, and completed
`steps.dam` / `steps.publish`. `scripts/media-cart-index.json` was regenerated from
those verified mappings.

Independent Assets QA checked all 258 anonymous public URLs: HTTP 200 with exact
recorded MIME and original byte counts. After replacing the token, the previously
blocked authenticated author recheck passed for all 114 newly uploaded originals.
Fresh anonymous checks of those same 114 originals also passed with exact matching
MIME and byte counts; the manifest hash was unchanged throughout the read-only QA.
**Assets-only QA PASS.** No asset upload, activation or author-auth check is pending.
The media suite passed 105 tests, the changed tooling passed ESLint, and the
regenerated cart index passed its `--check`.

- Two image masters use real `.JPG.jpg` filenames; their original bytes were uploaded,
  not their resized derivatives.
- The Slavia Monte Carlo `.mov_….mp4` source is actually QuickTime; the uploader and
  binary gate preserve and verify `video/quicktime` through `mime_type`.
- AEM escaped the percent-encoded 4×4 PDF/video filenames. The actual stored paths were
  verified on author, recorded, and activated without re-uploading those originals.
- Two existing image rows remain `partial` solely for their separate unsafe inline
  delivery renditions (SKODA-506). Their DAM originals and public proofs are complete:
  `4397252d__skoda_4X4_6_dda8c372.jpg` and
  `cbfef660__251118-Skoda-Auto-enters-Saudi-Arabian-market_908e1587.jpg`.

Previously blocking originals, now ingested and published:
All under `www.skoda-storyboard.com/direct-download/`:
- **Slavia:** `2026/08/Skoda_Slavia_Monte_Carlo.mov_125225b2.mp4`, `Skoda_Slavia_Prestige_69ae887f.mp4`, PDF `260818_…_fd432da8.pdf`
- **Red Dot:** `2026/08/Skoda_receives_red_dot_award_for_its_vision_app_concept-720p_cd084254.mp4`, PDF `260820_…_094b7c12.pdf`
- **4x4 (`2026/02/`):** the 9 `-1080p` videos (Elroq, Enyaq, Enyaq RS, Kodiaq, Kodiaq RS, Superb, Superb Combi,
  Octavia Combi, "the Škoda 4×4 range") + 3 PDFs (markets / models infographics, release PDF)
- **UCI MTB:** PDF `2026/08/260825_…_54e4195a.pdf` (manifest row added and verified)

The full list of the 37 blocked links per page is in the scratch `media/unverified.txt` (not in git).

## Acceptance Criteria
- [x] 4x4 Media Box parses into one Downloads block with all 15 items
- [x] YouTube / Buzzsprout embeds, tags, bullets, quotes as above; no regressions
- [x] QA PASS (code + content; rendered check of the 4x4 Media Box and a Buzzsprout embed). Independent fresh import of all 28,
      real `media:apply` (297 rewrites) + `media:validate-binaries` 28/28; Buzzsprout 812/641/492/355×200 and YouTube
      812×457… equal to origin at 1440/992/768/375; 258/258 public Assets URLs 200 with exact MIME/bytes.
- [x] Scoped image/PDF/video originals uploaded and published on AEM Assets; actual paths and public MIME/byte proofs recorded in the manifest
- [x] Independent Assets-only QA: all 114 new author originals match their anonymous published copies; authentication blocker resolved
- [x] `media:apply`, DA dry-run, push + preview (2026-10-06, from this branch: main's binary gate lacks e7a0e65)
- [x] Published 2026-10-06 (28/28 live 200 + indexed); the cart index for the new images goes live when #265 merges

## QA follow-ups (non-blocking)
- 4×4 Assets filenames are double-escaped (`the_Skoda_4%2525C3%2525974_range…`): downloads save as
  `…4%25C3%25974…`. Rename to the decoded name before publish? (needs manifest update + re-apply + re-push)
- Bullet rule: a lower-case brand-name bullet (`eMobility…`, `iV…`) would be joined; a digit/dash continuation split.
  Not present in the 28.
- `serialiseMp4` leaves protocol-relative / relative `×.mp4` hrefs raw. Not present in the 28.
- Shared Media Box collapse/pill deviations are SKODA-830 D1/D2 (identical on main).

## Collisions
- `parsers/downloads.js` is also edited on `skoda-830-story-import-validity` (D4 title recovery); merge carefully.
- `import-press-release.bundle.js` is rebuilt after SKODA-831 merges.
